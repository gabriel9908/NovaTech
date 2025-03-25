import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Contact form submission endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      // Validate the request body
      const validatedData = insertContactSchema.parse({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone || null,
        subject: req.body.subject,
        message: req.body.message,
      });

      // Add the current timestamp
      const contactData = {
        ...validatedData,
        createdAt: new Date().toISOString(),
      };

      // Store the contact in database
      const contact = await storage.createContact(contactData);

      res.status(201).json({
        message: "Contact form submitted successfully",
        contact
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      
      console.error("Error submitting contact form:", error);
      res.status(500).json({
        message: "An error occurred while submitting the contact form",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
