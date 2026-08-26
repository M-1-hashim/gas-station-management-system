import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/gas-station/customer-statement/[id]?from=...&to=...
// Returns a printable customer statement with opening balance, transactions, closing balance
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const customer = await db.customer.findUnique({ where: { id } });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Determine date range
    const now = new Date();
    let fromDate: Date;
    let toDate: Date;

    if (from && to) {
      fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
    } else {
      // Default: last 30 days
      fromDate = new Date(now);
      fromDate.setDate(fromDate.getDate() - 30);
      toDate = now;
    }

    // Sales before the from date (to calculate opening balance)
    const beforeSales = await db.sale.findMany({
      where: { customerId: id, date: { lt: fromDate }, paymentType: "credit" },
      select: { totalAmount: true },
    });
    const beforePayments = await db.payment.findMany({
      where: { customerId: id, date: { lt: fromDate } },
      select: { amount: true },
    });
    const openingBalance = beforeSales.reduce((sum, s) => sum + s.totalAmount, 0) - beforePayments.reduce((sum, p) => sum + p.amount, 0);

    // Transactions in the period
    const periodSales = await db.sale.findMany({
      where: { customerId: id, date: { gte: fromDate, lte: toDate } },
      include: { fuelType: true },
      orderBy: { date: "asc" },
    });
    const periodPayments = await db.payment.findMany({
      where: { customerId: id, date: { gte: fromDate, lte: toDate } },
      orderBy: { date: "asc" },
    });

    // Merge into a single transaction list
    type Transaction = {
      id: string;
      date: string;
      type: "sale" | "payment";
      description: string;
      debit: number; // increases balance (credit sale)
      credit: number; // decreases balance (payment)
      balance: number;
    };

    const transactions: Transaction[] = [];
    let runningBalance = openingBalance;

    for (const s of periodSales) {
      runningBalance += s.totalAmount;
      transactions.push({
        id: s.id,
        date: s.date.toISOString(),
        type: "sale",
        description: `${s.fuelType.name} - ${s.liters}L`,
        debit: s.totalAmount,
        credit: 0,
        balance: runningBalance,
      });
    }
    for (const p of periodPayments) {
      runningBalance -= p.amount;
      transactions.push({
        id: p.id,
        date: p.date.toISOString(),
        type: "payment",
        description: p.note || t_payment(p.method),
        debit: 0,
        credit: p.amount,
        balance: runningBalance,
      });
    }

    // Sort by date
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Recalculate running balance after sort
    let bal = openingBalance;
    for (const tx of transactions) {
      bal += tx.debit - tx.credit;
      tx.balance = bal;
    }

    const totalDebit = transactions.reduce((sum, t) => sum + t.debit, 0);
    const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0);
    const closingBalance = openingBalance + totalDebit - totalCredit;

    return NextResponse.json({
      customer,
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      openingBalance,
      closingBalance,
      totalDebit,
      totalCredit,
      transactions,
      summary: {
        saleCount: periodSales.length,
        paymentCount: periodPayments.length,
        totalLiters: periodSales.reduce((sum, s) => sum + s.liters, 0),
      },
    });
  } catch (error) {
    console.error("Customer statement error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

function t_payment(method: string): string {
  return method === "cash" ? "Cash Payment" : method === "bank" ? "Bank Transfer" : "Payment";
}
