import { NextRequest, NextResponse } from "next/server";
import { getWallets, createWallet } from "@repo/service/operations";

export async function GET() {
  const result = await getWallets();
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await createWallet(body);
  return NextResponse.json(result, { status: 201 });
}
