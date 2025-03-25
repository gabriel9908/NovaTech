import { 
  firebaseUsers, contacts, chatMessages, conversations,
  type FirebaseUser, type InsertFirebaseUser,
  type Contact, type InsertContact,
  type ChatMessage, type InsertChatMessage,
  type Conversation, type InsertConversation
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or } from "drizzle-orm";

// Interface de armazenamento com métodos CRUD
export interface IStorage {
  // Usuários Firebase
  getFirebaseUserByUid(uid: string): Promise<FirebaseUser | undefined>;
  getFirebaseUserByEmail(email: string): Promise<FirebaseUser | undefined>;
  createFirebaseUser(user: InsertFirebaseUser): Promise<FirebaseUser>;
  updateFirebaseUserLastLogin(uid: string): Promise<FirebaseUser | undefined>;
  getAdminUser(): Promise<FirebaseUser | undefined>;

  // Contatos
  createContact(contact: InsertContact & { createdAt: string }): Promise<Contact>;
  getContacts(): Promise<Contact[]>;

  // Mensagens de chat
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesByConversation(userId: string, adminId: string): Promise<ChatMessage[]>;
  markMessagesAsRead(receiverId: string, senderId: string): Promise<void>;
  
  // Conversas
  getOrCreateConversation(userId: string, adminId: string): Promise<Conversation>;
  getConversationsByUserId(userId: string): Promise<Conversation[]>;
  getConversationsByAdminId(adminId: string): Promise<Conversation[]>;
  updateConversation(id: number, lastMessage: string, unreadCount?: number): Promise<Conversation>;
}

// Implementação usando o banco de dados PostgreSQL
export class DatabaseStorage implements IStorage {
  // Métodos de usuários Firebase
  async getFirebaseUserByUid(uid: string): Promise<FirebaseUser | undefined> {
    const [user] = await db.select().from(firebaseUsers).where(eq(firebaseUsers.uid, uid));
    return user;
  }

  async getFirebaseUserByEmail(email: string): Promise<FirebaseUser | undefined> {
    const [user] = await db.select().from(firebaseUsers).where(eq(firebaseUsers.email, email));
    return user;
  }

  async createFirebaseUser(user: InsertFirebaseUser): Promise<FirebaseUser> {
    // Verificar se o usuário admin@novatech.com deve ser administrador
    const isAdmin = user.email === 'admin@novatech.com';
    
    const [newUser] = await db
      .insert(firebaseUsers)
      .values({
        ...user,
        isAdmin: isAdmin || user.isAdmin || false
      })
      .returning();
    return newUser;
  }

  async updateFirebaseUserLastLogin(uid: string): Promise<FirebaseUser | undefined> {
    const [user] = await db
      .update(firebaseUsers)
      .set({ lastLogin: new Date() })
      .where(eq(firebaseUsers.uid, uid))
      .returning();
    return user;
  }

  async getAdminUser(): Promise<FirebaseUser | undefined> {
    const [adminUser] = await db
      .select()
      .from(firebaseUsers)
      .where(eq(firebaseUsers.isAdmin, true));
    return adminUser;
  }

  // Métodos de contatos
  async createContact(contactData: InsertContact & { createdAt: string }): Promise<Contact> {
    const [contact] = await db
      .insert(contacts)
      .values(contactData)
      .returning();
    return contact;
  }

  async getContacts(): Promise<Contact[]> {
    return await db.select().from(contacts).orderBy(desc(contacts.id));
  }

  // Métodos de mensagens
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    
    // Atualizar a última mensagem da conversa
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.userId, message.senderId === message.receiverId ? message.receiverId : message.senderId),
          eq(conversations.adminId, message.receiverId === message.senderId ? message.senderId : message.receiverId)
        )
      );

    if (conversation) {
      // Se o destinatário for o administrador, incrementar unreadCount
      const unreadIncrement = message.receiverId === conversation.adminId ? 1 : 0;
      await this.updateConversation(
        conversation.id, 
        message.message,
        (conversation.unreadCount || 0) + unreadIncrement
      );
    }
    
    return newMessage;
  }

  async getChatMessagesByConversation(userId: string, adminId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(
        or(
          and(
            eq(chatMessages.senderId, userId),
            eq(chatMessages.receiverId, adminId)
          ),
          and(
            eq(chatMessages.senderId, adminId),
            eq(chatMessages.receiverId, userId)
          )
        )
      )
      .orderBy(chatMessages.createdAt);
  }

  async markMessagesAsRead(receiverId: string, senderId: string): Promise<void> {
    await db
      .update(chatMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(chatMessages.receiverId, receiverId),
          eq(chatMessages.senderId, senderId),
          eq(chatMessages.isRead, false)
        )
      );
    
    // Zerar contador de não lidas na conversa
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.userId, senderId),
          eq(conversations.adminId, receiverId)
        )
      );
    
    if (conversation) {
      await this.updateConversation(conversation.id, conversation.lastMessage || '', 0);
    }
  }

  // Métodos de conversas
  async getOrCreateConversation(userId: string, adminId: string): Promise<Conversation> {
    // Verificar se a conversa já existe
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.userId, userId),
          eq(conversations.adminId, adminId)
        )
      );
    
    if (conversation) {
      return conversation;
    }
    
    // Criar nova conversa
    const [newConversation] = await db
      .insert(conversations)
      .values({
        userId,
        adminId,
        unreadCount: 0
      })
      .returning();
    
    return newConversation;
  }

  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.lastMessageTime));
  }

  async getConversationsByAdminId(adminId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.adminId, adminId))
      .orderBy(desc(conversations.lastMessageTime));
  }

  async updateConversation(id: number, lastMessage: string, unreadCount?: number): Promise<Conversation> {
    const updateData: any = {
      lastMessage,
      lastMessageTime: new Date()
    };
    
    if (unreadCount !== undefined) {
      updateData.unreadCount = unreadCount;
    }
    
    const [updatedConversation] = await db
      .update(conversations)
      .set(updateData)
      .where(eq(conversations.id, id))
      .returning();
    
    return updatedConversation;
  }
}

export const storage = new DatabaseStorage();
