import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/gas-station/fuel-types
export async function GET() {
  try {
    const fuelTypes = await db.fuelType.findMany({
      include: { _count: { select: { tanks: true, sales: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(fuelTypes);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/gas-station/fuel-types
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fuelType = await db.fuelType.create({
      data: {
        name: body.name,
        namePs: body.namePs || null,
        nameDa: body.nameDa || null,
        price: parseFloat(body.price),
        cost: parseFloat(body.cost || 0),
        color: body.color || "#10b981",
        icon: body.icon || "fuel",
        active: body.active ?? true,
      },
    });
    return NextResponse.json(fuelType);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
