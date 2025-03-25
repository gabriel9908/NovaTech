import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useUser } from "../lib/UserContext";
import { getAuth, signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  showAuthModal: () => void;
}

export default function Header({ showAuthModal }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro ao tentar desconectar",
        variant: "destructive",
      });
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMenuOpen(false);
    }
  };

  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? "bg-white shadow-sm" : "bg-white/80 backdrop-blur-sm"}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Zap className="h-8 w-auto text-primary" />
            <span className="ml-2 text-xl font-bold text-gray-900">NovaTech</span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button onClick={() => scrollToSection("inicio")} className="text-gray-700 hover:text-primary font-medium transition-colors duration-200">
              Início
            </button>
            <button onClick={() => scrollToSection("servicos")} className="text-gray-700 hover:text-primary font-medium transition-colors duration-200">
              Serviços
            </button>
            <button onClick={() => scrollToSection("sobre")} className="text-gray-700 hover:text-primary font-medium transition-colors duration-200">
              Sobre
            </button>
            <button onClick={() => scrollToSection("contato")} className="text-gray-700 hover:text-primary font-medium transition-colors duration-200">
              Contato
            </button>
            
            {user ? (
              <Button onClick={handleLogout} variant="outline" className="ml-4">
                Sair
              </Button>
            ) : (
              <Button onClick={showAuthModal} className="ml-4">
                Entrar
              </Button>
            )}
          </nav>
          
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="md:hidden focus:outline-none"
            aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
          >
            {isMenuOpen ? (
              <svg className="h-6 w-6 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden animate-fade-in pb-4">
            <nav className="flex flex-col space-y-4">
              <button onClick={() => scrollToSection("inicio")} className="text-gray-700 hover:text-primary font-medium transition-colors duration-200">
                Início
              </button>
              <button onClick={() => scrollToSection("servicos")} className="text-gray-700 hover:text-primary font-medium transition-colors duration-200">
                Serviços
              </button>
              <button onClick={() => scrollToSection("sobre")} className="text-gray-700 hover:text-primary font-medium transition-colors duration-200">
                Sobre
              </button>
              <button onClick={() => scrollToSection("contato")} className="text-gray-700 hover:text-primary font-medium transition-colors duration-200">
                Contato
              </button>
              
              {user ? (
                <Button onClick={handleLogout} variant="outline" className="w-full">
                  Sair
                </Button>
              ) : (
                <Button onClick={showAuthModal} className="w-full">
                  Entrar
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
