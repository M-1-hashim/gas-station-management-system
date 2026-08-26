import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/gas-station/shifts/[id]/summary - Detailed shift reconciliation
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shift = await db.shift.findUnique({
      where: { id },
      include: { staff: true },
    });
    if (!shift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    // All sales during this shift
    const sales = await db.sale.findMany({
      where: { shiftId: id },
      include: { fuelType: true, customer: true, pump: true },
      orderBy: { date: "asc" },
    });

    const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalLiters = sales.reduce((sum, s) => sum + s.liters, 0);
    const cashSales = sales.filter((s) => s.paymentType === "cash");
    const creditSales = sales.filter((s) => s.paymentType === "credit");
    const cashTotal = cashSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const creditTotal = creditSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalProfit = sales.reduce(
      (sum, s) => sum + (s.pricePerLiter - s.fuelType.cost) * s.liters,
      0
    );

    // Sales by fuel type
    const fuelTypeMap = new Map<string, {
      name: string; nameDa: string | null; namePs: string | null;
      color: string; liters: number; amount: number; count: number;
    }>();
    for (const s of sales) {
      const key = s.fuelTypeId;
      if (!fuelTypeMap.has(key)) {
        fuelTypeMap.set(key, {
          name: s.fuelType.name,
          nameDa: s.fuelType.nameDa,
          namePs: s.fuelType.namePs,
          color: s.fuelType.color,
          liters: 0,
          amount: 0,
          count: 0,
        });
      }
      const entry = fuelTypeMap.get(key)!;
      entry.liters += s.liters;
      entry.amount += s.totalAmount;
      entry.count += 1;
    }

    // Sales by hour (for activity chart)
    const hourlyMap = new Map<number, number>();
    for (const s of sales) {
      const hour = new Date(s.date).getHours();
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + s.totalAmount);
    }
    const hourlyActivity = Array.from(hourlyMap.entries())
      .map(([hour, amount]) => ({ hour, amount }))
      .sort((a, b) => a.hour - b.hour);

    // Expenses during shift timeframe (same day)
    const shiftDate = new Date(shift.startTime);
    const dayStart = new Date(shiftDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(shiftDate);
    dayEnd.setHours(23, 59, 59, 999);
    const expenses = await db.expense.findMany({
      where: { date: { gte: dayStart, lte: dayEnd } },
    });
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Cash reconciliation
    const expectedCash = shift.openingCash + cashTotal;
    const actualCash = shift.closingCash ?? 0;
    const cashDifference = actualCash - expectedCash;

    // Duration
    const endTime = shift.endTime ? new Date(shift.endTime) : new Date();
    const durationMs = endTime.getTime() - new Date(shift.startTime).getTime();
    const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10;

    return NextResponse.json({
      shift,
      summary: {
        totalSales,
        totalLiters,
        totalProfit,
        cashTotal,
        creditTotal,
        cashCount: cashSales.length,
        creditCount: creditSales.length,
        saleCount: sales.length,
        totalExpenses,
        netProfit: totalProfit - totalExpenses,
        expectedCash,
        actualCash,
        cashDifference,
        durationHours,
      },
      salesByFuelType: Array.from(fuelTypeMap.values()),
      hourlyActivity,
      sales,
      expenses,
    });
  } catch (error) {
    console.error("Shift summary error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
