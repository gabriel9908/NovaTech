import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema, insertFirebaseUserSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";

// Armazenamento de conexões WebSocket por UID do usuário
const clients = new Map<string, WebSocket>();

// Função para enviar mensagem a um cliente específico
function sendMessageToClient(uid: string, message: any) {
  const client = clients.get(uid);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
    return true;
  }
  return false;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Rota para envio de formulário de contato
  app.post("/api/contact", async (req, res) => {
    try {
      // Validar os dados da requisição
      const validatedData = insertContactSchema.parse({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone || null,
        subject: req.body.subject,
        message: req.body.message,
      });

      // Adicionar timestamp atual
      const contactData = {
        ...validatedData,
        createdAt: new Date().toISOString(),
      };

      // Armazenar o contato no banco de dados
      const contact = await storage.createContact(contactData);

      res.status(201).json({
        message: "Formulário de contato enviado com sucesso",
        contact
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Erro de validação",
          errors: error.errors,
        });
      }
      
      console.error("Erro ao enviar formulário de contato:", error);
      res.status(500).json({
        message: "Ocorreu um erro ao enviar o formulário de contato",
      });
    }
  });

  // Rota para cadastrar/atualizar usuário Firebase
  app.post("/api/users/firebase", async (req, res) => {
    try {
      const { uid, email, displayName, photoURL } = req.body;
      
      // Validar os dados da requisição
      const validatedData = insertFirebaseUserSchema.parse({
        uid,
        email,
        displayName: displayName || null,
        photoURL: photoURL || null,
        isAdmin: email === "admin@novatech.com"
      });

      // Verificar se o usuário já existe
      let user = await storage.getFirebaseUserByUid(uid);
      
      if (user) {
        // Atualizar último login
        user = await storage.updateFirebaseUserLastLogin(uid);
      } else {
        // Criar novo usuário
        user = await storage.createFirebaseUser(validatedData);
      }
      
      res.status(201).json({
        message: "Usuário registrado/atualizado com sucesso",
        user
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Erro de validação",
          errors: error.errors,
        });
      }
      
      console.error("Erro ao processar usuário Firebase:", error);
      res.status(500).json({
        message: "Ocorreu um erro ao processar o usuário",
      });
    }
  });

  // Rota para obter o administrador
  app.get("/api/admin", async (req, res) => {
    try {
      const adminUser = await storage.getAdminUser();
      
      if (!adminUser) {
        return res.status(404).json({
          message: "Administrador não encontrado"
        });
      }
      
      res.status(200).json({
        admin: {
          uid: adminUser.uid,
          email: adminUser.email,
          displayName: adminUser.displayName || "Administrador"
        }
      });
    } catch (error) {
      console.error("Erro ao obter administrador:", error);
      res.status(500).json({
        message: "Ocorreu um erro ao obter informações do administrador"
      });
    }
  });

  // Rota para enviar mensagem
  app.post("/api/messages", async (req, res) => {
    try {
      const { senderId, receiverId, message, hasAttachment, attachmentURL, attachmentType, attachmentName } = req.body;
      
      // Validar os dados da requisição
      const validatedData = insertChatMessageSchema.parse({
        senderId,
        receiverId,
        message,
        hasAttachment: hasAttachment || false,
        attachmentURL: attachmentURL || null,
        attachmentType: attachmentType || null,
        attachmentName: attachmentName || null
      });

      // Verificar ou criar conversa
      await storage.getOrCreateConversation(
        senderId !== receiverId ? senderId : receiverId,
        senderId !== receiverId ? receiverId : senderId
      );
      
      // Criar mensagem
      const newMessage = await storage.createChatMessage(validatedData);
      
      // Tentar enviar a mensagem por WebSocket
      const wasMessageSent = sendMessageToClient(receiverId, {
        type: "new_message",
        data: newMessage
      });

      res.status(201).json({
        message: "Mensagem enviada com sucesso",
        chatMessage: newMessage,
        delivered: wasMessageSent
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Erro de validação",
          errors: error.errors,
        });
      }
      
      console.error("Erro ao enviar mensagem:", error);
      res.status(500).json({
        message: "Ocorreu um erro ao enviar a mensagem"
      });
    }
  });

  // Rota para obter mensagens de uma conversa
  app.get("/api/messages/:userId/:adminId", async (req, res) => {
    try {
      const { userId, adminId } = req.params;
      
      const messages = await storage.getChatMessagesByConversation(userId, adminId);
      
      // Marcar mensagens como lidas quando o destinatário acessar a conversa
      // O uid do usuário que está fazendo a requisição está no header X-User-ID
      const requestingUserId = req.header("X-User-ID");
      if (requestingUserId) {
        if (requestingUserId === adminId) {
          // Admin está vendo mensagens do usuário - marcar mensagens do usuário como lidas
          await storage.markMessagesAsRead(adminId, userId);
        } else if (requestingUserId === userId) {
          // Usuário está vendo mensagens do admin - marcar mensagens do admin como lidas
          await storage.markMessagesAsRead(userId, adminId);
        }
      }
      
      res.status(200).json({
        messages
      });
    } catch (error) {
      console.error("Erro ao obter mensagens:", error);
      res.status(500).json({
        message: "Ocorreu um erro ao obter as mensagens"
      });
    }
  });

  // Rota para obter todas as conversas do admin
  app.get("/api/conversations/admin/:adminId", async (req, res) => {
    try {
      const { adminId } = req.params;
      
      const conversations = await storage.getConversationsByAdminId(adminId);
      
      // Para cada conversa, buscamos informações do usuário
      const conversationsWithUsers = await Promise.all(
        conversations.map(async (conversation) => {
          const user = await storage.getFirebaseUserByUid(conversation.userId);
          return {
            ...conversation,
            user: user ? {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email.split('@')[0],
              photoURL: user.photoURL
            } : null
          };
        })
      );
      
      res.status(200).json({
        conversations: conversationsWithUsers
      });
    } catch (error) {
      console.error("Erro ao obter conversas do admin:", error);
      res.status(500).json({
        message: "Ocorreu um erro ao obter as conversas"
      });
    }
  });

  // Rota para obter todas as conversas de um usuário
  app.get("/api/conversations/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const conversations = await storage.getConversationsByUserId(userId);
      
      // Para cada conversa, buscamos informações do admin
      const conversationsWithAdmins = await Promise.all(
        conversations.map(async (conversation) => {
          const admin = await storage.getFirebaseUserByUid(conversation.adminId);
          return {
            ...conversation,
            admin: admin ? {
              uid: admin.uid,
              email: admin.email,
              displayName: admin.displayName || "Administrador",
              photoURL: admin.photoURL
            } : null
          };
        })
      );
      
      res.status(200).json({
        conversations: conversationsWithAdmins
      });
    } catch (error) {
      console.error("Erro ao obter conversas do usuário:", error);
      res.status(500).json({
        message: "Ocorreu um erro ao obter as conversas"
      });
    }
  });

  // Criar servidor HTTP
  const httpServer = createServer(app);

  // Configurar servidor WebSocket
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (socket) => {
    let uid = '';
    
    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Autenticação - o cliente deve enviar seu UID para registrar a conexão
        if (data.type === 'auth' && data.uid) {
          uid = data.uid;
          clients.set(uid, socket);
          console.log(`Cliente WebSocket registrado: ${uid}`);
          
          // Enviar confirmação
          socket.send(JSON.stringify({ type: 'auth_success', uid }));
        }
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    });
    
    socket.on('close', () => {
      if (uid) {
        clients.delete(uid);
        console.log(`Cliente WebSocket desconectado: ${uid}`);
      }
    });
  });

  return httpServer;
}
