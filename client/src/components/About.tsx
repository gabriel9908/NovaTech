import { Button } from "@/components/ui/button";

interface AboutProps {
  scrollToContact: () => void;
}

export default function About({ scrollToContact }: AboutProps) {
  const stats = [
    { value: "100+", label: "Projetos Concluídos" },
    { value: "50+", label: "Clientes Satisfeitos" },
    { value: "25+", label: "Especialistas" },
    { value: "8+", label: "Anos de Experiência" },
  ];

  return (
    <section id="sobre" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-12">
            <div className="rounded-lg shadow-lg overflow-hidden">
              <svg
                className="w-full h-auto" 
                viewBox="0 0 800 600" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="800" height="600" fill="#F3F4F6" />
                <circle cx="400" cy="250" r="150" fill="#3B82F6" opacity="0.1" />
                <circle cx="400" cy="250" r="100" fill="#3B82F6" opacity="0.2" />
                <circle cx="400" cy="250" r="50" fill="#3B82F6" opacity="0.3" />
                
                {/* People silhouettes */}
                <circle cx="320" cy="220" r="30" fill="#3B82F6" opacity="0.7" />
                <rect x="300" y="250" width="40" height="80" rx="10" fill="#3B82F6" opacity="0.7" />
                
                <circle cx="400" cy="220" r="30" fill="#3B82F6" opacity="0.8" />
                <rect x="380" y="250" width="40" height="80" rx="10" fill="#3B82F6" opacity="0.8" />
                
                <circle cx="480" cy="220" r="30" fill="#3B82F6" opacity="0.9" />
                <rect x="460" y="250" width="40" height="80" rx="10" fill="#3B82F6" opacity="0.9" />
                
                {/* Connection lines */}
                <line x1="320" y1="220" x2="400" y2="220" stroke="#3B82F6" strokeWidth="2" opacity="0.5" />
                <line x1="400" y1="220" x2="480" y2="220" stroke="#3B82F6" strokeWidth="2" opacity="0.5" />
                
                {/* Base */}
                <rect x="150" y="350" width="500" height="20" rx="10" fill="#3B82F6" opacity="0.4" />
                <rect x="200" y="370" width="400" height="40" rx="5" fill="#3B82F6" opacity="0.3" />
              </svg>
            </div>
          </div>
          <div className="md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Sobre a NovaTech</h2>
            <p className="text-lg text-gray-700 mb-6">
              Somos uma empresa de tecnologia focada em fornecer soluções inovadoras que ajudam nossos clientes a alcançar seus objetivos de negócios.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              Com uma equipe altamente qualificada de profissionais, combinamos experiência técnica com visão estratégica para entregar produtos e serviços de alta qualidade.
            </p>
            <div className="grid grid-cols-2 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div key={index}>
                  <p className="text-3xl font-bold text-primary">{stat.value}</p>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
            <Button onClick={scrollToContact} size="lg">
              Entre em Contato
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
