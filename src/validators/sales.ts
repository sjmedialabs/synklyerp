import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(2),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  leadType: z.string(),
  serviceId: z.string().optional(),
  source: z.string().optional(),
  assignedTo: z.string().optional(),
  status: z.string(),
  notes: z.string().optional(),
  /** Enterprise capture — optional, backward compatible */
  crmLeadSourceId: z.string().uuid().optional(),
  originalSource: z.string().optional(),
  attribution: z
    .object({
      capturedFrom: z.string().optional(),
      campaign: z.string().optional(),
      utmSource: z.string().optional(),
      utmMedium: z.string().optional(),
      utmCampaign: z.string().optional(),
      utmContent: z.string().optional(),
      utmTerm: z.string().optional(),
      landingPage: z.string().optional(),
      referrerUrl: z.string().optional(),
      ipAddress: z.string().optional(),
      device: z.string().optional(),
      browser: z.string().optional(),
      country: z.string().optional(),
      city: z.string().optional(),
    })
    .optional(),
});
