import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().min(3, { message: "Por favor, insira seu nome completo" }),
  email: z.string().email({ message: "Por favor, insira um email válido" }),
  phone: z.string().optional(),
  subject: z.string().min(1, { message: "Por favor, selecione um assunto" }),
  message: z.string().min(10, { message: "Por favor, insira uma mensagem com pelo menos 10 caracteres" }),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
