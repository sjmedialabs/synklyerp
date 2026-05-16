import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createServiceSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  description: z.string().optional(),
  basePrice: z.number().min(0),
  unit: z.string().min(1),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    
    // Fallback for development if no tenantId is linked to user yet
    const tenantId = (session.user as any).tenantId;
    const query = tenantId ? { tenantId } : {};
    
    const services = await db.service.findMany({
      where: query,
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(services);
  } catch (error) {
    console.error("[SERVICES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    
    // In a real environment, throw if tenantId is missing. For now, fallback for setup.
    let tenantId = (session.user as any).tenantId;
    if (!tenantId) {
      // Find or create a default tenant for dev
      let defaultTenant = await db.tenant.findFirst();
      if (!defaultTenant) {
        defaultTenant = await db.tenant.create({
          data: { name: "Synkly Demo Corp", businessType: "Hybrid", status: "ACTIVE" }
        });
      }
      tenantId = defaultTenant.id;
    }

    const body = await req.json();
    const validatedData = createServiceSchema.parse(body);

    const service = await db.service.create({
      data: {
        ...validatedData,
        tenantId,
      }
    });

    return NextResponse.json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.message, { status: 400 });
    }
    console.error("[SERVICES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
