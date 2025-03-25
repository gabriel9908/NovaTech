import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock 
} from "lucide-react";

const contactFormSchema = z.object({
  name: z.string().min(3, { message: "Por favor, insira seu nome completo" }),
  email: z.string().email({ message: "Por favor, insira um email válido" }),
  phone: z.string().optional(),
  subject: z.string().min(1, { message: "Por favor, selecione um assunto" }),
  message: z.string().min(10, { message: "Por favor, insira uma mensagem com pelo menos 10 caracteres" }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const { toast } = useToast();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: (values: ContactFormValues) => {
      return apiRequest("POST", "/api/contact", values);
    },
    onSuccess: () => {
      toast({
        title: "Mensagem enviada",
        description: "Entraremos em contato em breve!",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message || "Por favor, tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: ContactFormValues) {
    submitMutation.mutate(values);
  }

  const contactInfo = [
    {
      icon: <MapPin className="h-6 w-6 text-primary" />,
      title: "Endereço",
      lines: [" Rua Agenor de Campos (antiga perimetral), 5 - Agua Azul", "Dom Aquino - MT, 78830-000"],
    },
    {
      icon: <Phone className="h-6 w-6 text-primary" />,
      title: "Telefone",
      lines: ["(66) 99246-3778", "(66) 99208-1582"],
    },
    {
      icon: <Mail className="h-6 w-6 text-primary" />,
      title: "Email",
      lines: ["gabrielnascimento.01@hotmail.com"],
    },
    {
      icon: <Clock className="h-6 w-6 text-primary" />,
      title: "Horário de Atendimento",
      lines: ["Segunda a Sexta: 9h às 18h"],
    },
  ];

  return (
    <section id="contato" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Entre em Contato</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Estamos prontos para ajudar no seu próximo projeto. Preencha o formulário abaixo e entraremos em contato em breve.
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:space-x-8">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="seu.email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assunto</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um assunto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="website">Desenvolvimento Web</SelectItem>
                          <SelectItem value="mobile">Aplicativo Mobile</SelectItem>
                          <SelectItem value="data">Análise de Dados</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensagem</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva seu projeto ou dúvida..." 
                          className="resize-none" 
                          rows={5}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? "Enviando..." : "Enviar Mensagem"}
                </Button>
              </form>
            </Form>
          </div>
          
          <div className="md:w-1/2 bg-gray-50 p-8 rounded-lg">
            <h3 className="text-2xl font-bold mb-6">Informações de Contato</h3>
            
            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    {info.icon}
                  </div>
                  <div className="ml-4">
                    <p className="text-lg font-medium text-gray-800">{info.title}</p>
                    {info.lines.map((line, i) => (
                      <p key={i} className="text-gray-600">{line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
