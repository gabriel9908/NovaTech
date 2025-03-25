import { LightningBoltIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Footer() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast({
        title: "Erro ao inscrever",
        description: "Por favor, insira um email válido",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Inscrição realizada",
      description: "Obrigado por se inscrever em nossa newsletter!",
    });
    setEmail("");
  };

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <LightningBoltIcon className="h-8 w-auto text-primary" />
              <span className="ml-2 text-xl font-bold">NovaTech</span>
            </div>
            <p className="text-gray-400 mb-4">
              Soluções tecnológicas inovadoras para transformar o seu negócio.
            </p>
            <div className="flex space-x-4">
              {[
                { icon: "fab fa-facebook-f", href: "#" },
                { icon: "fab fa-twitter", href: "#" },
                { icon: "fab fa-instagram", href: "#" },
                { icon: "fab fa-github", href: "#" },
                { icon: "fab fa-youtube", href: "#" }
              ].map((social, index) => (
                <a key={index} href={social.href} className="text-gray-400 hover:text-white transition-colors duration-200">
                  <i className={`${social.icon} h-5 w-5`}></i>
                  <span className="sr-only">{social.icon.split('-').pop()}</span>
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Serviços</h3>
            <ul className="space-y-2">
              {[
                "Desenvolvimento Web",
                "Aplicativos Mobile",
                "Análise de Dados",
                "Consultoria em TI",
                "Segurança da Informação"
              ].map((service, index) => (
                <li key={index}>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Empresa</h3>
            <ul className="space-y-2">
              {[
                "Sobre Nós",
                "Nosso Time",
                "Carreiras",
                "Blog",
                "Contato"
              ].map((item, index) => (
                <li key={index}>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
            <p className="text-gray-400 mb-4">
              Assine nossa newsletter para receber as últimas notícias e atualizações.
            </p>
            <form onSubmit={handleSubscribe} className="flex">
              <Input 
                type="email" 
                placeholder="Seu email" 
                className="rounded-l-md rounded-r-none border-r-0 text-gray-900 focus-visible:ring-0"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" className="rounded-l-none">
                <i className="fas fa-arrow-right"></i>
              </Button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400">&copy; {new Date().getFullYear()} NovaTech. Todos os direitos reservados.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            {["Termos de Serviço", "Política de Privacidade", "Cookies"].map((item, index) => (
              <a key={index} href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
