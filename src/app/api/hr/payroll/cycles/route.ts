import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    
    // In production, force tenant check
    let tenantId = (session.user as any).tenantId;
    if (!tenantId) {
      const defaultTenant = await db.tenant.findFirst();
      tenantId = defaultTenant?.id;
    }

    const cycles = await db.payrollCycle.findMany({
      where: { tenantId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        _count: { select: { payslips: true } }
      }
    });

    return NextResponse.json(cycles);
  } catch (error) {
    console.error("[PAYROLL_CYCLES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    
    let tenantId = (session.user as any).tenantId;
    if (!tenantId) {
      const defaultTenant = await db.tenant.findFirst();
      tenantId = defaultTenant?.id;
    }

    const { month, year } = await req.json();

    // Check if cycle exists
    const existing = await db.payrollCycle.findUnique({
      where: {
        tenantId_month_year: { tenantId, month, year }
      }
    });

    if (existing) {
      return new NextResponse("Payroll cycle already exists for this month", { status: 400 });
    }

    const cycle = await db.payrollCycle.create({
      data: {
        tenantId,
        month,
        year,
        status: "DRAFT",
      }
    });

    // In a real scenario, this would trigger a background job to generate draft payslips.
    return NextResponse.json(cycle);
  } catch (error) {
    console.error("[PAYROLL_CYCLES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
