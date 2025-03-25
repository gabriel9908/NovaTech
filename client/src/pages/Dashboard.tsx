import { useEffect, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { getAuth, signOut } from "firebase/auth";
import Chat from "@/components/dashboard/Chat";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FileIcon, LogOut, MessageSquareText, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminId, setAdminId] = useState("");
  const auth = getAuth();

  // Verificar se o usuário está autenticado
  useEffect(() => {
    if (!user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Verificar se o usuário é admin
  const { data: userData } = useQuery({
    queryKey: ["/api/users/firebase", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      const response = await fetch(`/api/users/firebase?uid=${user.uid}`);
      if (!response.ok) {
        throw new Error("Falha ao buscar dados do usuário");
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Buscar ID do administrador
  const { data: adminData } = useQuery({
    queryKey: ["/api/admin"],
    queryFn: async () => {
      const response = await fetch("/api/admin");
      if (!response.ok) {
        throw new Error("Falha ao buscar dados do administrador");
      }
      return response.json();
    },
  });

  useEffect(() => {
    if (userData?.user?.isAdmin) {
      setIsAdmin(true);
    }

    if (adminData?.admin?.uid) {
      setAdminId(adminData.admin.uid);
    }
  }, [userData, adminData]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setLocation("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header showAuthModal={() => {}} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isAdmin ? "Painel do Administrador" : "Painel do Cliente"}
            </h1>
            <p className="text-gray-600 mt-1">
              Bem-vindo(a), {user.displayName || user.email}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut size={16} />
            Sair
          </Button>
        </div>

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquareText size={16} />
              Chat
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User size={16} />
              Perfil
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="files" className="flex items-center gap-2">
                <FileIcon size={16} />
                Arquivos
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <Chat 
                userId={user.uid} 
                adminId={adminId} 
                isAdmin={isAdmin} 
                userName={user.displayName || user.email?.split('@')[0] || 'Usuário'}
              />
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Informações do Perfil</h2>
              <Separator className="my-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Nome</p>
                  <p className="font-medium">{user.displayName || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tipo de Conta</p>
                  <p className="font-medium">{isAdmin ? "Administrador" : "Cliente"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Membro desde</p>
                  <p className="font-medium">
                    {user.metadata?.creationTime
                      ? new Date(user.metadata.creationTime).toLocaleDateString("pt-BR")
                      : "Data não disponível"}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="files" className="space-y-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Arquivos Recebidos</h2>
                <Separator className="my-4" />
                
                <div className="bg-gray-50 rounded-lg p-10 text-center text-gray-500">
                  <FileIcon className="mx-auto h-12 w-12 mb-4" />
                  <p>Todos os arquivos enviados pelos clientes aparecerão aqui.</p>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}