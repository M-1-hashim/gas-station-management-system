import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const refills = await db.refill.findMany({
      include: { tank: { include: { fuelType: true } }, supplier: true },
      orderBy: { date: "desc" },
      take: 100,
    });
    return NextResponse.json(refills);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST - Add a refill and increase tank level
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const liters = parseFloat(body.liters);
    const costPerLiter = parseFloat(body.costPerLiter || 0);
    const totalCost = liters * costPerLiter;

    const refill = await db.refill.create({
      data: {
        tankId: body.tankId,
        liters,
        costPerLiter,
        totalCost,
        supplierId: body.supplierId || null,
        invoiceNo: body.invoiceNo || null,
        date: body.date ? new Date(body.date) : new Date(),
        note: body.note || null,
      },
      include: { tank: { include: { fuelType: true } }, supplier: true },
    });

    // Increase tank level
    await db.tank.update({
      where: { id: body.tankId },
      data: { currentLevel: { increment: liters } },
    });

    // Increase supplier balance (payable)
    if (body.supplierId) {
      await db.supplier.update({
        where: { id: body.supplierId },
        data: { balance: { increment: totalCost } },
      });
    }

    return NextResponse.json(refill);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
