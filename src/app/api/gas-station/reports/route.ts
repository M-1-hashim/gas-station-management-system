import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/gas-station/reports?from=...&to=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const now = new Date();
    let fromDate: Date;
    let toDate: Date;

    if (from && to) {
      fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
    } else {
      // Default: current month
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      toDate = now;
    }

    const sales = await db.sale.findMany({
      where: { date: { gte: fromDate, lte: toDate } },
      include: { fuelType: true, customer: true },
      orderBy: { date: "desc" },
    });

    const expenses = await db.expense.findMany({
      where: { date: { gte: fromDate, lte: toDate } },
      orderBy: { date: "desc" },
    });

    const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalLiters = sales.reduce((sum, s) => sum + s.liters, 0);
    const totalProfit = sales.reduce(
      (sum, s) => sum + (s.pricePerLiter - s.fuelType.cost) * s.liters,
      0
    );
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalProfit - totalExpenses;

    // Sales by fuel type
    const fuelTypeMap = new Map<string, { name: string; nameDa: string | null; namePs: string | null; color: string; liters: number; amount: number; profit: number; cost: number }>();
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
          profit: 0,
          cost: s.fuelType.cost,
        });
      }
      const entry = fuelTypeMap.get(key)!;
      entry.liters += s.liters;
      entry.amount += s.totalAmount;
      entry.profit += (s.pricePerLiter - s.fuelType.cost) * s.liters;
    }

    // Expenses by category
    const expenseCategoryMap = new Map<string, number>();
    for (const e of expenses) {
      expenseCategoryMap.set(e.category, (expenseCategoryMap.get(e.category) || 0) + e.amount);
    }

    // Sales by day (with profit)
    const salesByDayMap = new Map<string, { amount: number; profit: number }>();
    for (const s of sales) {
      const dayKey = new Date(s.date).toISOString().split("T")[0];
      const existing = salesByDayMap.get(dayKey) || { amount: 0, profit: 0 };
      existing.amount += s.totalAmount;
      existing.profit += (s.pricePerLiter - s.fuelType.cost) * s.liters;
      salesByDayMap.set(dayKey, existing);
    }

    // Payment type breakdown
    const cashSales = sales.filter((s) => s.paymentType === "cash").reduce((sum, s) => sum + s.totalAmount, 0);
    const creditSales = sales.filter((s) => s.paymentType === "credit").reduce((sum, s) => sum + s.totalAmount, 0);

    return NextResponse.json({
      period: { from: fromDate, to: toDate },
      summary: {
        totalSales,
        totalLiters,
        totalProfit,
        totalExpenses,
        netProfit,
        cashSales,
        creditSales,
        saleCount: sales.length,
        expenseCount: expenses.length,
      },
      salesByFuelType: Array.from(fuelTypeMap.values()),
      expensesByCategory: Array.from(expenseCategoryMap.entries()).map(([category, amount]) => ({ category, amount })),
      salesByDay: Array.from(salesByDayMap.entries())
        .map(([date, val]) => ({ date, amount: val.amount, profit: val.profit }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      sales,
      expenses,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
