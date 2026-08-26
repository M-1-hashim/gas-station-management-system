import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH/DELETE /api/gas-station/fuel-types/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const fuelType = await db.fuelType.update({
      where: { id },
      data: {
        name: body.name,
        namePs: body.namePs || null,
        nameDa: body.nameDa || null,
        price: parseFloat(body.price),
        cost: parseFloat(body.cost ?? 0),
        color: body.color,
        icon: body.icon,
        active: body.active,
      },
    });
    return NextResponse.json(fuelType);
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
    await db.fuelType.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
