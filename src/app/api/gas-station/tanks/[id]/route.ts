import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const tank = await db.tank.update({
      where: { id },
      data: {
        name: body.name,
        fuelTypeId: body.fuelTypeId,
        capacity: parseFloat(body.capacity),
        currentLevel: parseFloat(body.currentLevel),
        minLevel: parseFloat(body.minLevel),
      },
      include: { fuelType: true },
    });
    return NextResponse.json(tank);
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
    await db.tank.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
