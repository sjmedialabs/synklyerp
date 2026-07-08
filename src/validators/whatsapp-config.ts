import { z } from "zod";

export const whatsappConfigSchema = z.object({
  phoneNumberId: z.string().min(1, "Phone number ID is required"),
  businessAccountId: z.string().min(1, "Business account ID is required"),
  accessToken: z.string().optional(),
  webhookVerifyToken: z.string().min(8, "Webhook verify token must be at least 8 characters"),
  isActive: z.boolean(),
});

export type WhatsAppConfigInput = z.infer<typeof whatsappConfigSchema>;
