import { NextResponse } from "next/server";
import { buildOpenApiSpec } from "@/lib/openapi/spec";

export async function GET() {
  const spec = buildOpenApiSpec();
  return NextResponse.json(spec, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
