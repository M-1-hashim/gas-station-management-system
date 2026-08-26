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
        include: { fuelType: true },
      });
      const dayTotal = daySales.reduce((sum, s) => sum + s.totalAmount, 0);
      const dayProfit = daySales.reduce(
        (sum, s) => sum + (s.pricePerLiter - s.fuelType.cost) * s.liters,
        0
      );
      const dayLiters = daySales.reduce((sum, s) => sum + s.liters, 0);
      last7Days.push({
        date: dayStart.toISOString().split("T")[0],
        label: dayStart.toLocaleDateString("en", { weekday: "short" }),
        total: dayTotal,
        profit: dayProfit,
        liters: dayLiters,
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

    // Weekly comparison: last week vs this week
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const lastWeekSales = await db.sale.findMany({
      where: { date: { gte: startOfLastWeek, lt: startOfWeek } },
      select: { totalAmount: true, liters: true },
    });
    const lastWeekTotal = lastWeekSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const weekGrowth = lastWeekTotal > 0
      ? ((weekSalesTotal - lastWeekTotal) / lastWeekTotal) * 100
      : weekSalesTotal > 0 ? 100 : 0;

    // Top customers by purchase amount (last 30 days)
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCustomerSales = await db.sale.findMany({
      where: { date: { gte: thirtyDaysAgo }, customerId: { not: null } },
      include: { customer: true },
    });
    const customerTotals = new Map<string, { name: string; total: number; count: number }>();
    for (const s of recentCustomerSales) {
      if (!s.customerId || !s.customer) continue;
      const existing = customerTotals.get(s.customerId);
      if (existing) {
        existing.total += s.totalAmount;
        existing.count += 1;
      } else {
        customerTotals.set(s.customerId, { name: s.customer.name, total: s.totalAmount, count: 1 });
      }
    }
    const topCustomers = Array.from(customerTotals.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Top fuel types by sales amount (last 30 days)
    const recentSalesAll = await db.sale.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      include: { fuelType: true },
    });
    const fuelTotals = new Map<string, { name: string; nameDa: string | null; namePs: string | null; color: string; liters: number; amount: number }>();
    for (const s of recentSalesAll) {
      const existing = fuelTotals.get(s.fuelTypeId);
      if (existing) {
        existing.liters += s.liters;
        existing.amount += s.totalAmount;
      } else {
        fuelTotals.set(s.fuelTypeId, {
          name: s.fuelType.name,
          nameDa: s.fuelType.nameDa,
          namePs: s.fuelType.namePs,
          color: s.fuelType.color,
          liters: s.liters,
          amount: s.totalAmount,
        });
      }
    }
    const topFuelTypes = Array.from(fuelTotals.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Avg sale value today
    const avgSaleValue = todaySales.length > 0 ? todaySalesTotal / todaySales.length : 0;

    // Busiest hour today
    const hourMap = new Map<number, number>();
    for (const s of todaySales) {
      const h = new Date(s.date).getHours();
      hourMap.set(h, (hourMap.get(h) || 0) + 1);
    }
    let busiestHour = -1;
    let busiestHourCount = 0;
    for (const [h, c] of hourMap) {
      if (c > busiestHourCount) { busiestHourCount = c; busiestHour = h; }
    }

    return NextResponse.json({
      kpis: {
        todaySales: todaySalesTotal,
        todayProfit,
        todayExpenses: todayExpensesTotal,
        weekSales: weekSalesTotal,
        lastWeekSales: lastWeekTotal,
        weekGrowth,
        monthSales: monthSalesTotal,
        totalCustomers,
        totalCredit,
        activeShifts: activeShifts.length,
        lowStockAlerts: lowStockTanks.length + lowStockProducts.length,
        avgSaleValue,
        busiestHour,
        transactionsToday: todaySales.length,
      },
      activeShifts,
      tanks,
      lowStockTanks,
      lowStockProducts,
      salesByFuelType,
      last7Days,
      topCustomers,
      topFuelTypes,
      recentSales,
      recentExpenses,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to load dashboard", detail: String(error) }, { status: 500 });
  }
}
