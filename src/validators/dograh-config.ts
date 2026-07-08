import { z } from "zod";

const uuidLike = z
  .string()
  .trim()
  .min(8, "Enter the API Trigger UUID from your Dograh workflow")
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Enter a valid API Trigger UUID"
  );

export const dograhConfigSchema = z.object({
  serverUrl: z.string().url("Enter a valid Dograh server URL").or(z.literal("")),
  apiKey: z.string().optional(),
  publicAppUrl: z.string().url("Enter a valid public app URL").or(z.literal("")),
  agentTriggerUuid: z.string().trim().or(z.literal("")),
  telephonyConfigurationId: z.number().int().positive().nullable().optional(),
  isActive: z.boolean(),
});

export type DograhConfigInput = z.infer<typeof dograhConfigSchema>;

export function parseDograhAgentTriggerUuid(value: string | null | undefined) {
  const str = (value ?? "").trim();
  if (!str) return null;

  // Direct UUID
  const direct = uuidLike.safeParse(str);
  if (direct.success) return direct.data;

  // Accept full URLs like:
  // https://ai.synklyapp.com/api/v1/public/agent/<uuid>
  const match = str.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );
  if (!match) return null;

  const extracted = uuidLike.safeParse(match[0]);
  return extracted.success ? extracted.data : null;
}
