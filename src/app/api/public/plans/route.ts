import { apiError, apiSuccess } from "@/lib/api/response";
import * as plansRepo from "@/repositories/platform/plans";

export async function GET() {
  try {
    const plans = await plansRepo.listPublicPlans();
    return apiSuccess(plans);
  } catch (error) {
    console.error(error);
    return apiError("Failed to load plans", 500);
  }
}
