import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const pumps = await db.pump.findMany({
      include: { tank: { include: { fuelType: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(pumps);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pump = await db.pump.create({
      data: {
        name: body.name,
        tankId: body.tankId,
        reading: parseFloat(body.reading || 0),
        active: body.active ?? true,
      },
      include: { tank: { include: { fuelType: true } } },
    });
    return NextResponse.json(pump);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
