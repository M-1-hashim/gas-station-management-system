import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const expenses = await db.expense.findMany({
      orderBy: { date: "desc" },
      take: 200,
    });
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const expense = await db.expense.create({
      data: {
        date: body.date ? new Date(body.date) : new Date(),
        category: body.category,
        amount: parseFloat(body.amount),
        description: body.description || null,
      },
    });
    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
