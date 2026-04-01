import { NextRequest, NextResponse } from "next/server";
import { deleteWallet, NotFoundError } from "@repo/service/operations";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await deleteWallet(id);

  if (result instanceof NotFoundError) {
    return NextResponse.json({ error: result.message }, { status: 404 });
  }

  return NextResponse.json(result);
}
