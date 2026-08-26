import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const shifts = await db.shift.findMany({
      include: { staff: true },
      orderBy: { startTime: "desc" },
      take: 100,
    });
    return NextResponse.json(shifts);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// Start a new shift
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const shift = await db.shift.create({
      data: {
        staffId: body.staffId,
        startTime: body.startTime ? new Date(body.startTime) : new Date(),
        openingCash: parseFloat(body.openingCash || 0),
        status: "open",
        note: body.note || null,
      },
      include: { staff: true },
    });
    return NextResponse.json(shift);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
