import { NextRequest, NextResponse } from "next/server";
import { incomeReport } from "@repo/service/operations";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const groupBy = params.get("groupBy") as "day" | "week" | "month";
  if (!groupBy) {
    return NextResponse.json({ error: "groupBy is required" }, { status: 400 });
  }

  const result = await incomeReport({
    walletId: params.get("walletId") ?? undefined,
    dateFrom: params.get("dateFrom") ? new Date(params.get("dateFrom")!) : undefined,
    dateTo: params.get("dateTo") ? new Date(params.get("dateTo")!) : undefined,
    groupBy,
  });

  return NextResponse.json(result);
}
