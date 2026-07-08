import { getDograhApiKeyForTenant, findTenantIdByDograhApiKey } from "@/repositories/sales/crm/dograh-config";

export function getGlobalDograhApiKey() {
  return process.env.DOGRAH_API_KEY?.trim() ?? "";
}

export async function verifyDograhRequest(req: Request, tenantId?: string): Promise<boolean> {
  const auth = req.headers.get("authorization");
  const headerKey = req.headers.get("x-dograh-api-key");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : headerKey;
  if (!token) return false;

  const globalKey = getGlobalDograhApiKey();
  if (globalKey && token === globalKey) return true;

  if (tenantId) {
    const tenantKey = await getDograhApiKeyForTenant(tenantId);
    if (tenantKey && token === tenantKey) return true;
  }

  const matchedTenant = await findTenantIdByDograhApiKey(token);
  return !!matchedTenant;
}
