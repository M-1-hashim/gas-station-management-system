import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/gas-station/dashboard - Dashboard statistics
export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's sales
    const todaySales = await db.sale.findMany({
      where: { date: { gte: startOfToday } },
      include: { fuelType: true, customer: true },
    });
    const todaySalesTotal = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const todayProfit = todaySales.reduce(
      (sum, s) => sum + (s.pricePerLiter - s.fuelType.cost) * s.liters,
      0
    );

    // Today's expenses
    const todayExpenses = await db.expense.findMany({
      where: { date: { gte: startOfToday } },
    });
    const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

    // This week sales
    const weekSales = await db.sale.findMany({
      where: { date: { gte: startOfWeek } },
      select: { totalAmount: true, date: true },
    });
    const weekSalesTotal = weekSales.reduce((sum, s) => sum + s.totalAmount, 0);

    // This month sales
    const monthSales = await db.sale.findMany({
      where: { date: { gte: startOfMonth } },
      select: { totalAmount: true, date: true },
    });
    const monthSalesTotal = monthSales.reduce((sum, s) => sum + s.totalAmount, 0);

    // Customers
    const totalCustomers = await db.customer.count();
    const creditCustomers = await db.customer.findMany({
      where: { balance: { gt: 0 } },
      select: { balance: true },
    });
    const totalCredit = creditCustomers.reduce((sum, c) => sum + c.balance, 0);

    // Active shifts
    const activeShifts = await db.shift.findMany({
      where: { status: "open" },
      include: { staff: true },
    });

    // Tanks with levels
    const tanks = await db.tank.findMany({
      include: { fuelType: true },
    });
    const lowStockTanks = tanks.filter((t) => t.currentLevel <= t.minLevel);

    // Low stock products
    const lowStockProducts = await db.product.findMany({
      where: { stock: { lte: db.product.fields.minStock } },
    });

    // Sales by fuel type (today)
    const fuelTypeSales = await db.fuelType.findMany({
      include: {
        sales: { where: { date: { gte: startOfToday } } },
      },
    });
    const salesByFuelType = fuelTypeSales.map((ft) => ({
      name: ft.name,
      nameDa: ft.nameDa,
      namePs: ft.namePs,
      color: ft.color,
      liters: ft.sales.reduce((sum, s) => sum + s.liters, 0),
      amount: ft.sales.reduce((sum, s) => sum + s.totalAmount, 0),
    }));

    // Last 7 days sales
    const last7Days: { date: string; label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const daySales = await db.sale.findMany({
        where: { date: { gte: dayStart, lt: dayEnd } },
        select: { totalAmount: true },
      });
      const dayTotal = daySales.reduce((sum, s) => sum + s.totalAmount, 0);
      last7Days.push({
        date: dayStart.toISOString().split("T")[0],
        label: dayStart.toLocaleDateString("en", { weekday: "short" }),
        total: dayTotal,
      });
    }

    // Recent sales
    const recentSales = await db.sale.findMany({
      take: 8,
      orderBy: { date: "desc" },
      include: { fuelType: true, customer: true },
    });

    // Recent expenses
    const recentExpenses = await db.expense.findMany({
      take: 5,
      orderBy: { date: "desc" },
    });

    return NextResponse.json({
      kpis: {
        todaySales: todaySalesTotal,
        todayProfit,
        todayExpenses: todayExpensesTotal,
        weekSales: weekSalesTotal,
        monthSales: monthSalesTotal,
        totalCustomers,
        totalCredit,
        activeShifts: activeShifts.length,
        lowStockAlerts: lowStockTanks.length + lowStockProducts.length,
      },
      activeShifts,
      tanks,
      lowStockTanks,
      lowStockProducts,
      salesByFuelType,
      last7Days,
      recentSales,
      recentExpenses,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to load dashboard", detail: String(error) }, { status: 500 });
  }
}
