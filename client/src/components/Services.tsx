import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { Monitor, Smartphone, BarChart } from "lucide-react";

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  scrollToContact: () => void;
}

function ServiceCard({ icon, title, description, scrollToContact }: ServiceCardProps) {
  return (
    <Card className="bg-gray-50 hover:shadow-md transition-shadow transform hover:scale-[1.03] transition-transform duration-300">
      <CardHeader>
        <div className="text-primary mb-4">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">
          {description}
        </p>
        <button 
          onClick={scrollToContact}
          className="text-primary font-medium hover:text-blue-700 inline-flex items-center"
        >
          Saiba mais
          <ExternalLink className="h-4 w-4 ml-1" />
        </button>
      </CardContent>
    </Card>
  );
}

interface ServicesProps {
  scrollToContact: () => void;
}

export default function Services({ scrollToContact }: ServicesProps) {
  const services = [
    {
      icon: <Monitor className="h-12 w-12" />,
      title: "Desenvolvimento Web",
      description: "Criamos sites e plataformas web modernas, responsivas e otimizadas para conversão."
    },
    {
      icon: <Smartphone className="h-12 w-12" />,
      title: "Aplicativos Mobile",
      description: "Desenvolvemos aplicativos nativos e multiplataforma para iOS e Android."
    },
    {
      icon: <BarChart className="h-12 w-12" />,
      title: "Análise de Dados",
      description: "Transformamos dados em insights valiosos para decisões estratégicas."
    }
  ];

  return (
    <section id="servicos" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Nossos Serviços</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Oferecemos soluções completas em tecnologia para atender às necessidades do seu negócio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              icon={service.icon}
              title={service.title}
              description={service.description}
              scrollToContact={scrollToContact}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
