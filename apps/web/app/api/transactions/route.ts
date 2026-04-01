import { NextRequest, NextResponse } from "next/server";
import {
  createTransaction,
  listTransactions,
  NotFoundError,
} from "@repo/service/operations";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const result = await listTransactions({
    walletId: params.get("walletId") ?? undefined,
    categoryId: params.get("categoryId") ?? undefined,
    type: params.get("type") as "income" | "expense" | "transfer" | undefined,
    limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    offset: params.get("offset") ? Number(params.get("offset")) : undefined,
    dateFrom: params.get("dateFrom") ? new Date(params.get("dateFrom")!) : undefined,
    dateTo: params.get("dateTo") ? new Date(params.get("dateTo")!) : undefined,
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await createTransaction(body);

  if (result instanceof NotFoundError) {
    return NextResponse.json({ error: result.message }, { status: 404 });
  }
  if (result instanceof Error) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json(result, { status: 201 });
}
