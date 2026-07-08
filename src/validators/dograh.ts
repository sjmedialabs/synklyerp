import { z } from "zod";

export const dograhCreateCallSchema = z.object({
  leadId: z.string().uuid(),
});

export const dograhCustomerQuerySchema = z.object({
  phone: z.string().min(8),
  tenantId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
});

export const dograhPreCallSchema = z
  .object({
    event: z.string().optional(),
    call_inbound: z
      .object({
        from_number: z.string().optional(),
        to_number: z.string().optional(),
        agent_id: z.union([z.number(), z.string()]).optional(),
      })
      .optional(),
    initial_context: z.record(z.string(), z.unknown()).optional(),
    phone_number: z.string().optional(),
    phone: z.string().optional(),
    tenantId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
  })
  .passthrough();

export const dograhWebhookSchema = z.object({
  phone: z.string().min(8),
  tenantId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  callId: z.string().optional(),
  status: z.string().optional(),
  summary: z.string().optional(),
  visitDate: z.string().optional(),
  transcript: z.string().optional(),
  duration: z.number().int().nonnegative().optional(),
  recording: z.string().optional().nullable(),
});

export const dograhUpdateStatusSchema = z.object({
  leadId: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
  status: z.string().min(1),
  summary: z.string().optional(),
});
