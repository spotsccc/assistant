import { NextRequest, NextResponse } from "next/server";
import { getCurrencies, createCurrency } from "@repo/service/operations";

export async function GET() {
  const result = await getCurrencies();
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await createCurrency(body);
  return NextResponse.json(result, { status: 201 });
}
