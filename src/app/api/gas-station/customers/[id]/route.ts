import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const customer = await db.customer.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone || null,
        address: body.address || null,
      },
    });
    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// Record payment - reduces customer balance
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const amount = parseFloat(body.amount);

    const payment = await db.payment.create({
      data: {
        customerId: id,
        amount,
        method: body.method || "cash",
        note: body.note || null,
        date: body.date ? new Date(body.date) : new Date(),
      },
    });

    // Reduce customer balance
    await db.customer.update({
      where: { id },
      data: { balance: { decrement: amount } },
    });

    return NextResponse.json(payment);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
