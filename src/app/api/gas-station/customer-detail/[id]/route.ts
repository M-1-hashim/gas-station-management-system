import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/gas-station/customer-detail/[id] - Full customer profile
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await db.customer.findUnique({
      where: { id },
    });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // All sales for this customer
    const sales = await db.sale.findMany({
      where: { customerId: id },
      include: { fuelType: true, pump: true },
      orderBy: { date: "desc" },
    });

    // All payments
    const payments = await db.payment.findMany({
      where: { customerId: id },
      orderBy: { date: "desc" },
    });

    // Stats
    const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalLiters = sales.reduce((sum, s) => sum + s.liters, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const creditSales = sales.filter((s) => s.paymentType === "credit");
    const creditTotal = creditSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const cashTotal = totalSales - creditTotal;

    // Sales by fuel type
    const fuelMap = new Map<string, { name: string; nameDa: string | null; namePs: string | null; color: string; liters: number; amount: number; count: number }>();
    for (const s of sales) {
      if (!fuelMap.has(s.fuelTypeId)) {
        fuelMap.set(s.fuelTypeId, {
          name: s.fuelType.name,
          nameDa: s.fuelType.nameDa,
          namePs: s.fuelType.namePs,
          color: s.fuelType.color,
          liters: 0,
          amount: 0,
          count: 0,
        });
      }
      const entry = fuelMap.get(s.fuelTypeId)!;
      entry.liters += s.liters;
      entry.amount += s.totalAmount;
      entry.count += 1;
    }

    // Last 30 days activity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSales = sales.filter((s) => new Date(s.date) >= thirtyDaysAgo);

    // Monthly activity (last 6 months)
    const monthlyActivity: { month: string; label: string; amount: number; count: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthSales = sales.filter((s) => {
        const d = new Date(s.date);
        return d >= monthStart && d < monthEnd;
      });
      monthlyActivity.push({
        month: monthStart.toISOString().slice(0, 7),
        label: monthStart.toLocaleDateString("en", { month: "short" }),
        amount: monthSales.reduce((sum, s) => sum + s.totalAmount, 0),
        count: monthSales.length,
      });
    }

    return NextResponse.json({
      customer,
      summary: {
        totalSales,
        totalLiters,
        totalPaid,
        currentBalance: customer.balance,
        creditTotal,
        cashTotal,
        saleCount: sales.length,
        paymentCount: payments.length,
        avgSaleValue: sales.length > 0 ? totalSales / sales.length : 0,
        lastSaleDate: sales[0]?.date || null,
        recentSaleCount: recentSales.length,
        recentSaleTotal: recentSales.reduce((sum, s) => sum + s.totalAmount, 0),
      },
      salesByFuelType: Array.from(fuelMap.values()).sort((a, b) => b.amount - a.amount),
      monthlyActivity,
      sales: sales.slice(0, 50), // Last 50 sales
      payments,
    });
  } catch (error) {
    console.error("Customer detail error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
