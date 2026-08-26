import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/gas-station/daily-target - Today's sales vs target
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customTarget = searchParams.get("target");
    const DEFAULT_TARGET = 50000;

    const station = await db.station.findUnique({ where: { id: "default" } });
    const target = customTarget
      ? parseFloat(customTarget)
      : station?.dailyTarget || DEFAULT_TARGET;

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const todaySales = await db.sale.findMany({
      where: { date: { gte: startOfToday } },
      select: { totalAmount: true, liters: true },
    });
    const todayTotal = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const todayLiters = todaySales.reduce((sum, s) => sum + s.liters, 0);

    const progress = target > 0 ? Math.min(100, (todayTotal / target) * 100) : 0;
    const remaining = Math.max(0, target - todayTotal);
    const isAchieved = todayTotal >= target;

    // Yesterday's total for comparison
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const yesterdaySales = await db.sale.findMany({
      where: { date: { gte: startOfYesterday, lt: startOfToday } },
      select: { totalAmount: true },
    });
    const yesterdayTotal = yesterdaySales.reduce((sum, s) => sum + s.totalAmount, 0);

    // Projected end-of-day based on current pace
    const hoursElapsed = now.getHours() + now.getMinutes() / 60;
    const projectedTotal = hoursElapsed > 0 ? (todayTotal / hoursElapsed) * 24 : todayTotal;

    return NextResponse.json({
      target,
      todayTotal,
      todayLiters,
      progress,
      remaining,
      isAchieved,
      yesterdayTotal,
      projectedTotal,
      saleCount: todaySales.length,
    });
  } catch (error) {
    console.error("Daily target error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
