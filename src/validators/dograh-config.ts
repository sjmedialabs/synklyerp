import { z } from "zod";

export const dograhConfigSchema = z.object({
  serverUrl: z.string().url("Enter a valid Dograh server URL").or(z.literal("")),
  apiKey: z.string().optional(),
  publicAppUrl: z.string().url("Enter a valid public app URL").or(z.literal("")),
  isActive: z.boolean(),
});

export type DograhConfigInput = z.infer<typeof dograhConfigSchema>;
