import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const refill = await db.refill.findUnique({ where: { id } });
    if (!refill) {
      return NextResponse.json({ error: "Refill not found" }, { status: 404 });
    }

    // Reverse tank level
    await db.tank.update({
      where: { id: refill.tankId },
      data: { currentLevel: { decrement: refill.liters } },
    });

    // Reverse supplier balance if linked
    if (refill.supplierId) {
      await db.supplier.update({
        where: { id: refill.supplierId },
        data: { balance: { decrement: refill.totalCost } },
      });
    }

    await db.refill.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
