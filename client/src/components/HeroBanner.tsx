import { Button } from "@/components/ui/button";

interface HeroBannerProps {
  scrollToSection: (sectionId: string) => void;
}

export default function HeroBanner({ scrollToSection }: HeroBannerProps) {
  return (
    <section id="inicio" className="pt-32 pb-20 bg-gradient-to-r from-primary to-accent text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
              Transforme seu negócio com tecnologia avançada
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Soluções digitais personalizadas para impulsionar o crescimento da sua empresa.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Button 
                onClick={() => scrollToSection("servicos")}
                variant="outline" 
                size="lg" 
                className="bg-white text-primary hover:bg-gray-100 text-center"
              >
                Nossos Serviços
              </Button>
              <Button 
                onClick={() => scrollToSection("contato")}
                variant="outline" 
                size="lg" 
                className="border-2 border-white hover:bg-white hover:text-primary text-center"
              >
                Fale Conosco
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 animate-slide-up">
            <div className="rounded-lg shadow-2xl overflow-hidden">
              <svg 
                className="w-full h-auto" 
                viewBox="0 0 800 600" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="800" height="600" fill="#2563EB" opacity="0.1" />
                <circle cx="400" cy="300" r="200" fill="#4F46E5" opacity="0.2" />
                <path d="M300,200 Q400,100 500,200 T700,300" stroke="white" strokeWidth="8" fill="none" />
                <path d="M100,300 Q200,400 300,300 T500,200" stroke="white" strokeWidth="8" fill="none" />
                <rect x="250" y="220" width="300" height="200" rx="20" fill="white" opacity="0.6" />
                <rect x="280" y="260" width="240" height="20" rx="5" fill="#4F46E5" opacity="0.8" />
                <rect x="280" y="300" width="240" height="20" rx="5" fill="#4F46E5" opacity="0.6" />
                <rect x="280" y="340" width="140" height="20" rx="5" fill="#4F46E5" opacity="0.4" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
