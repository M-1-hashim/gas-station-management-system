import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/gas-station/tanks
export async function GET() {
  try {
    const tanks = await db.tank.findMany({
      include: {
        fuelType: true,
        pumps: true,
        _count: { select: { refills: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(tanks);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/gas-station/tanks
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tank = await db.tank.create({
      data: {
        name: body.name,
        fuelTypeId: body.fuelTypeId,
        capacity: parseFloat(body.capacity),
        currentLevel: parseFloat(body.currentLevel || 0),
        minLevel: parseFloat(body.minLevel || 0),
      },
      include: { fuelType: true },
    });
    return NextResponse.json(tank);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
