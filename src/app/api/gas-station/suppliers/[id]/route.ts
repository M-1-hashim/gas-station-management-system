import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const supplier = await db.supplier.update({
      where: { id },
      data: {
        name: body.name,
        nameDa: body.nameDa || null,
        namePs: body.namePs || null,
        phone: body.phone || null,
        address: body.address || null,
        contactPerson: body.contactPerson || null,
        active: body.active,
      },
    });
    return NextResponse.json(supplier);
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
    await db.supplier.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// Record payment to supplier (reduces balance)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const amount = parseFloat(body.amount);

    const supplier = await db.supplier.update({
      where: { id },
      data: { balance: { decrement: amount } },
    });
    return NextResponse.json(supplier);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
