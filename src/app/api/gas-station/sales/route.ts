import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const customerId = searchParams.get("customerId");

    const sales = await db.sale.findMany({
      where: customerId ? { customerId } : undefined,
      take: limit,
      orderBy: { date: "desc" },
      include: {
        fuelType: true,
        customer: true,
        pump: true,
      },
    });
    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST - Create a sale and update tank level + customer balance
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const liters = parseFloat(body.liters);
    const pricePerLiter = parseFloat(body.pricePerLiter);
    const totalAmount = liters * pricePerLiter;

    // Create the sale
    const sale = await db.sale.create({
      data: {
        date: body.date ? new Date(body.date) : new Date(),
        fuelTypeId: body.fuelTypeId,
        pumpId: body.pumpId || null,
        liters,
        pricePerLiter,
        totalAmount,
        paymentType: body.paymentType || "cash",
        customerId: body.customerId || null,
        shiftId: body.shiftId || null,
        staffId: body.staffId || null,
        note: body.note || null,
      },
      include: { fuelType: true, customer: true },
    });

    // Update tank level (decrease)
    if (body.pumpId) {
      const pump = await db.pump.findUnique({
        where: { id: body.pumpId },
        include: { tank: true },
      });
      if (pump) {
        await db.tank.update({
          where: { id: pump.tankId },
          data: { currentLevel: { decrement: liters } },
        });
        // Update pump reading
        await db.pump.update({
          where: { id: pump.id },
          data: { reading: { increment: liters } },
        });
      }
    } else {
      // Find the first tank for this fuel type
      const tank = await db.tank.findFirst({ where: { fuelTypeId: body.fuelTypeId } });
      if (tank) {
        await db.tank.update({
          where: { id: tank.id },
          data: { currentLevel: { decrement: liters } },
        });
      }
    }

    // If credit, increase customer balance
    if (body.paymentType === "credit" && body.customerId) {
      await db.customer.update({
        where: { id: body.customerId },
        data: { balance: { increment: totalAmount } },
      });
    }

    return NextResponse.json(sale);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
