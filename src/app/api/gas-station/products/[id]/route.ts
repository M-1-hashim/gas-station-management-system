import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const product = await db.product.update({
      where: { id },
      data: {
        name: body.name,
        namePs: body.namePs || null,
        nameDa: body.nameDa || null,
        category: body.category,
        price: parseFloat(body.price),
        cost: parseFloat(body.cost),
        stock: parseFloat(body.stock),
        minStock: parseFloat(body.minStock),
        unit: body.unit,
      },
    });
    return NextResponse.json(product);
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
    await db.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
