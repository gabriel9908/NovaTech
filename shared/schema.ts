import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Usuários do sistema
export const firebaseUsers = pgTable("firebase_users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // UID do Firebase
  email: text("email").notNull(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

export const insertFirebaseUserSchema = createInsertSchema(firebaseUsers).pick({
  uid: true,
  email: true,
  displayName: true,
  photoURL: true,
  isAdmin: true,
});

// Mensagens de chat
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  senderId: text("sender_id").notNull(), // UID do Firebase do remetente
  receiverId: text("receiver_id").notNull(), // UID do Firebase do destinatário
  message: text("message").notNull(),
  hasAttachment: boolean("has_attachment").default(false),
  attachmentURL: text("attachment_url"),
  attachmentType: text("attachment_type"),
  attachmentName: text("attachment_name"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  senderId: true,
  receiverId: true,
  message: true,
  hasAttachment: true,
  attachmentURL: true,
  attachmentType: true,
  attachmentName: true,
});

// Conversas (para organizar os chats)
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // UID do Firebase do usuário
  adminId: text("admin_id").notNull(), // UID do Firebase do administrador
  lastMessage: text("last_message"),
  lastMessageTime: timestamp("last_message_time"),
  unreadCount: integer("unread_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  userId: true,
  adminId: true,
  lastMessage: true,
  unreadCount: true,
});

// Mantemos a tabela de contatos original
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertContactSchema = createInsertSchema(contacts).pick({
  name: true,
  email: true,
  phone: true,
  subject: true,
  message: true,
});

// Tipos exportados
export type InsertFirebaseUser = z.infer<typeof insertFirebaseUserSchema>;
export type FirebaseUser = typeof firebaseUsers.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;
