import { NextRequest, NextResponse } from "next/server";
import { financeSummary } from "@repo/service/operations";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const result = await financeSummary({
    walletId: params.get("walletId") ?? undefined,
    dateFrom: params.get("dateFrom") ? new Date(params.get("dateFrom")!) : undefined,
    dateTo: params.get("dateTo") ? new Date(params.get("dateTo")!) : undefined,
  });

  return NextResponse.json(result);
}
