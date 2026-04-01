import { NextRequest, NextResponse } from "next/server";
import { getCategories, createCategory } from "@repo/service/operations";

export async function GET() {
  const result = await getCategories();
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await createCategory(body);
  return NextResponse.json(result, { status: 201 });
}
