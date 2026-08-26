import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sale = await db.sale.findUnique({
      where: { id },
      include: { pump: true },
    });
    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // Reverse tank level
    if (sale.pumpId) {
      const pump = await db.pump.findUnique({
        where: { id: sale.pumpId },
        include: { tank: true },
      });
      if (pump) {
        await db.tank.update({
          where: { id: pump.tankId },
          data: { currentLevel: { increment: sale.liters } },
        });
        await db.pump.update({
          where: { id: pump.id },
          data: { reading: { decrement: sale.liters } },
        });
      }
    }

    // Reverse customer balance if credit
    if (sale.paymentType === "credit" && sale.customerId) {
      await db.customer.update({
        where: { id: sale.customerId },
        data: { balance: { decrement: sale.totalAmount } },
      });
    }

    await db.sale.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
