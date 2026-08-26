import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/gas-station/sales/[id] - Update a sale
// Reverses old sale effects (tank level, customer balance) and applies new ones
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await db.sale.findUnique({
      where: { id },
      include: { pump: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    const newLiters = parseFloat(body.liters);
    const newPricePerLiter = parseFloat(body.pricePerLiter);
    const newTotalAmount = newLiters * newPricePerLiter;
    const newPaymentType = body.paymentType || "cash";
    const newCustomerId = body.customerId || null;
    const newPumpId = body.pumpId || null;

    // 1. Reverse the OLD sale's effects
    // Reverse old tank level (add back old liters)
    if (existing.pumpId) {
      const oldPump = await db.pump.findUnique({
        where: { id: existing.pumpId },
        include: { tank: true },
      });
      if (oldPump) {
        await db.tank.update({
          where: { id: oldPump.tankId },
          data: { currentLevel: { increment: existing.liters } },
        });
        await db.pump.update({
          where: { id: oldPump.id },
          data: { reading: { decrement: existing.liters } },
        });
      }
    }
    // Reverse old customer balance if old sale was credit
    if (existing.paymentType === "credit" && existing.customerId) {
      await db.customer.update({
        where: { id: existing.customerId },
        data: { balance: { decrement: existing.totalAmount } },
      });
    }

    // 2. Apply the NEW sale's effects
    // Decrement new tank level
    if (newPumpId) {
      const newPump = await db.pump.findUnique({
        where: { id: newPumpId },
        include: { tank: true },
      });
      if (newPump) {
        await db.tank.update({
          where: { id: newPump.tankId },
          data: { currentLevel: { decrement: newLiters } },
        });
        await db.pump.update({
          where: { id: newPump.id },
          data: { reading: { increment: newLiters } },
        });
      }
    } else {
      // Find a tank for the fuel type
      const tank = await db.tank.findFirst({ where: { fuelTypeId: body.fuelTypeId } });
      if (tank) {
        await db.tank.update({
          where: { id: tank.id },
          data: { currentLevel: { decrement: newLiters } },
        });
      }
    }
    // Increase new customer balance if new sale is credit
    if (newPaymentType === "credit" && newCustomerId) {
      await db.customer.update({
        where: { id: newCustomerId },
        data: { balance: { increment: newTotalAmount } },
      });
    }

    // 3. Update the sale record
    const updated = await db.sale.update({
      where: { id },
      data: {
        fuelTypeId: body.fuelTypeId,
        pumpId: newPumpId,
        liters: newLiters,
        pricePerLiter: newPricePerLiter,
        totalAmount: newTotalAmount,
        paymentType: newPaymentType,
        customerId: newCustomerId,
        note: body.note || null,
      },
      include: { fuelType: true, customer: true, pump: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Sale update error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

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
