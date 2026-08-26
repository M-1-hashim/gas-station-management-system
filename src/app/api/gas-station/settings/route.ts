import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET station settings
export async function GET() {
  try {
    let station = await db.station.findUnique({ where: { id: "default" } });
    if (!station) {
      station = await db.station.create({
        data: {
          id: "default",
          name: "تانک تیل",
          currency: "AFN",
          currencySymbol: "؋",
        },
      });
    }
    return NextResponse.json(station);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PUT - update station settings
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const station = await db.station.upsert({
      where: { id: "default" },
      update: {
        name: body.name,
        nameDa: body.nameDa || null,
        namePs: body.namePs || null,
        owner: body.owner || null,
        phone: body.phone || null,
        address: body.address || null,
        currency: body.currency,
        currencySymbol: body.currencySymbol,
        dailyTarget: body.dailyTarget != null ? parseFloat(body.dailyTarget) : undefined,
      },
      create: {
        id: "default",
        name: body.name,
        nameDa: body.nameDa || null,
        namePs: body.namePs || null,
        owner: body.owner || null,
        phone: body.phone || null,
        address: body.address || null,
        currency: body.currency,
        currencySymbol: body.currencySymbol,
        dailyTarget: body.dailyTarget != null ? parseFloat(body.dailyTarget) : 50000,
      },
    });
    return NextResponse.json(station);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
