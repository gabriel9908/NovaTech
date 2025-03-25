import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, FileUp, Paperclip, Download } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChatProps {
  userId: string;
  adminId: string;
  isAdmin: boolean;
  userName: string;
}

interface Message {
  id: number;
  senderId: string;
  receiverId: string;
  message: string;
  hasAttachment: boolean;
  attachmentURL?: string;
  attachmentType?: string;
  attachmentName?: string;
  isRead: boolean;
  createdAt: string;
}

interface ConversationUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

interface Conversation {
  id: number;
  userId: string;
  adminId: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  createdAt: string;
  user?: ConversationUser;
  admin?: ConversationUser;
}

export default function Chat({ userId, adminId, isAdmin, userName }: ChatProps) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  // Configurar WebSocket
  useEffect(() => {
    if (!userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Conexão WebSocket estabelecida");
      // Enviar autenticação
      ws.send(JSON.stringify({ type: 'auth', uid: userId }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'auth_success') {
        console.log('Autenticação WebSocket bem-sucedida', data);
      }
      
      if (data.type === 'new_message') {
        // Invalidar consultas para recarregar mensagens
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        // Se for o administrador, invalidar a lista de conversas
        if (isAdmin) {
          queryClient.invalidateQueries({ queryKey: ['admin_conversations'] });
        } else {
          queryClient.invalidateQueries({ queryKey: ['user_conversations'] });
        }
      }
    };

    ws.onerror = (error) => {
      console.error("Erro na conexão WebSocket:", error);
    };

    ws.onclose = () => {
      console.log("Conexão WebSocket fechada");
    };

    setWsConnection(ws);

    return () => {
      ws.close();
    };
  }, [userId, queryClient, isAdmin]);

  // Buscar conversas (apenas para administradores)
  const { data: adminConversations } = useQuery({
    queryKey: ['admin_conversations', adminId],
    queryFn: async () => {
      if (!adminId || !isAdmin) return { conversations: [] };
      
      const response = await fetch(`/api/conversations/admin/${adminId}`);
      if (!response.ok) throw new Error("Erro ao buscar conversas");
      return response.json();
    },
    enabled: !!adminId && isAdmin,
  });

  // Buscar conversas (apenas para usuários regulares)
  const { data: userConversations } = useQuery({
    queryKey: ['user_conversations', userId],
    queryFn: async () => {
      if (!userId || isAdmin) return { conversations: [] };
      
      const response = await fetch(`/api/conversations/user/${userId}`);
      if (!response.ok) throw new Error("Erro ao buscar conversas");
      return response.json();
    },
    enabled: !!userId && !isAdmin,
  });

  // Determinar o ID da conversa atual
  useEffect(() => {
    if (isAdmin && adminConversations?.conversations?.length > 0) {
      // Para admin, selecionar o primeiro usuário da lista
      setSelectedConversation(adminConversations.conversations[0].userId);
    } else if (!isAdmin) {
      // Para usuário regular, sempre é com o admin
      setSelectedConversation(adminId);
    }
  }, [isAdmin, adminId, adminConversations]);

  // Buscar mensagens da conversa selecionada
  const { data: messagesData } = useQuery({
    queryKey: ['messages', isAdmin ? selectedConversation : userId, isAdmin ? adminId : selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return { messages: [] };
      
      const chatUserId = isAdmin ? selectedConversation : userId;
      const chatAdminId = isAdmin ? adminId : selectedConversation;
      
      const response = await fetch(`/api/messages/${chatUserId}/${chatAdminId}`, {
        headers: {
          'X-User-ID': userId
        }
      });
      
      if (!response.ok) throw new Error("Erro ao buscar mensagens");
      return response.json();
    },
    enabled: !!selectedConversation,
  });

  // Enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { 
      senderId: string; 
      receiverId: string; 
      message: string;
      hasAttachment?: boolean;
      attachmentURL?: string;
      attachmentType?: string;
      attachmentName?: string;
    }) => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error("Erro ao enviar mensagem");
      return response.json();
    },
    onSuccess: () => {
      // Limpar o campo de mensagem e o arquivo selecionado
      setMessage("");
      setSelectedFile(null);
      
      // Recarregar mensagens
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      
      // Recarregar conversas
      if (isAdmin) {
        queryClient.invalidateQueries({ queryKey: ['admin_conversations'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['user_conversations'] });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Função para lidar com a seleção de arquivo
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Função para lidar com a mudança de arquivo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  // Função para enviar mensagem
  const handleSendMessage = async () => {
    if ((!message && !selectedFile) || !selectedConversation) return;
    
    // Aqui você pode implementar o upload de arquivo para um serviço como Firebase Storage
    // e depois enviar a URL do arquivo junto com a mensagem
    
    // Por enquanto, vamos apenas enviar a mensagem de texto
    sendMessageMutation.mutate({
      senderId: userId,
      receiverId: isAdmin ? selectedConversation : adminId,
      message: message,
      // Se tiver arquivo selecionado, incluir informações do arquivo
      hasAttachment: !!selectedFile,
      attachmentName: selectedFile?.name,
      attachmentType: selectedFile?.type,
      // attachmentURL seria preenchido após o upload para um serviço de armazenamento
    });
  };

  // Rolagem automática para a última mensagem
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messagesData]);

  // Renderizar lista de conversas (só para admin)
  const renderConversationList = () => {
    if (!isAdmin) return null;
    
    const conversations = adminConversations?.conversations || [];
    
    if (conversations.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          Nenhuma conversa disponível
        </div>
      );
    }
    
    return (
      <div className="w-full md:w-1/4 md:pr-4 mb-4 md:mb-0">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-3 bg-gray-100 border-b font-medium">
            Conversas
          </div>
          <div className="divide-y">
            {conversations.map((conversation: Conversation) => (
              <div 
                key={conversation.id}
                className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation === conversation.userId ? 'bg-gray-100' : ''
                }`}
                onClick={() => setSelectedConversation(conversation.userId)}
              >
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={conversation.user?.photoURL || ""} />
                    <AvatarFallback className="bg-primary text-white">
                      {(conversation.user?.displayName || conversation.user?.email || "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {conversation.user?.displayName || conversation.user?.email?.split('@')[0] || "Usuário"}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.lastMessage || "Sem mensagens"}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="ml-2 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Renderizar cabeçalho da conversa
  const renderChatHeader = () => {
    if (!selectedConversation) return null;
    
    const conversations = isAdmin ? adminConversations?.conversations : userConversations?.conversations;
    let chatPartner;
    
    if (isAdmin) {
      // Admin está conversando com um usuário
      chatPartner = adminConversations?.conversations?.find(
        (c: Conversation) => c.userId === selectedConversation
      )?.user;
    } else {
      // Usuário está conversando com o admin
      chatPartner = userConversations?.conversations?.find(
        (c: Conversation) => c.adminId === selectedConversation
      )?.admin;
    }
    
    return (
      <div className="flex items-center p-3 bg-gray-100 border-b">
        <Avatar className="h-10 w-10 mr-3">
          <AvatarImage src={chatPartner?.photoURL || ""} />
          <AvatarFallback className="bg-primary text-white">
            {isAdmin 
              ? (chatPartner?.displayName || chatPartner?.email || "U")[0].toUpperCase()
              : "A"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">
            {isAdmin 
              ? chatPartner?.displayName || chatPartner?.email?.split('@')[0] || "Usuário"
              : chatPartner?.displayName || "Administrador"}
          </p>
          <p className="text-xs text-gray-500">
            {isAdmin ? "Cliente" : "Suporte"}
          </p>
        </div>
      </div>
    );
  };

  // Renderizar mensagens
  const renderMessages = () => {
    const messages = messagesData?.messages || [];
    
    if (messages.length === 0) {
      return (
        <div className="flex flex-col h-96 items-center justify-center text-gray-500 p-4">
          <MessageSquareIcon className="h-12 w-12 mb-2 text-gray-300" />
          <p>Nenhuma mensagem disponível</p>
          <p className="text-sm">Envie uma mensagem para iniciar a conversa</p>
        </div>
      );
    }
    
    return (
      <div 
        ref={messageContainerRef}
        className="flex flex-col h-96 overflow-y-auto px-4 py-2 space-y-4"
      >
        {messages.map((msg: Message) => {
          const isSentByCurrentUser = msg.senderId === userId;
          
          return (
            <div 
              key={msg.id}
              className={`flex ${isSentByCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-end gap-2">
                {!isSentByCurrentUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-white">
                      {isAdmin ? "U" : "A"}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div 
                  className={`max-w-xs sm:max-w-md rounded-lg p-3 ${
                    isSentByCurrentUser 
                      ? 'bg-primary text-white rounded-br-none' 
                      : 'bg-gray-100 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  
                  {msg.hasAttachment && (
                    <div className="mt-2 p-2 bg-white bg-opacity-20 rounded flex items-center gap-2">
                      <Paperclip size={16} />
                      <span className="truncate text-sm flex-1">
                        {msg.attachmentName || "Arquivo anexado"}
                      </span>
                      {msg.attachmentURL && (
                        <Button variant="ghost" size="sm" className="p-1 h-6" asChild>
                          <a href={msg.attachmentURL} target="_blank" rel="noopener noreferrer">
                            <Download size={14} />
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                  
                  <div className={`text-xs mt-1 ${isSentByCurrentUser ? 'text-gray-200' : 'text-gray-500'}`}>
                    {format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </div>
                </div>
                
                {isSentByCurrentUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={""} />
                    <AvatarFallback className="bg-primary text-white">
                      {userName[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {renderConversationList()}
      
      <div className="flex-1">
        <Card className="shadow-md">
          {renderChatHeader()}
          
          {renderMessages()}
          
          <Separator />
          
          <div className="p-3">
            <div className="flex items-start gap-2">
              <Textarea 
                placeholder="Digite sua mensagem aqui..." 
                className="resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={handleFileSelect}
                  title="Anexar arquivo"
                >
                  <FileUp size={18} />
                </Button>
                <Button 
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={(!message && !selectedFile) || sendMessageMutation.isPending}
                  title="Enviar mensagem"
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
            
            {selectedFile && (
              <div className="mt-2 p-2 bg-gray-100 rounded flex items-center gap-2">
                <Paperclip size={16} />
                <span className="truncate text-sm flex-1">{selectedFile.name}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-1 h-6"
                  onClick={() => setSelectedFile(null)}
                >
                  ✕
                </Button>
              </div>
            )}
            
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function MessageSquareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}