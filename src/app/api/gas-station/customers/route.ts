import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const customers = await db.customer.findMany({
      include: {
        _count: { select: { sales: true, payments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customer = await db.customer.create({
      data: {
        name: body.name,
        phone: body.phone || null,
        address: body.address || null,
        balance: parseFloat(body.balance || 0),
      },
    });
    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
