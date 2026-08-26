import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const staff = await db.staff.findMany({
      include: { _count: { select: { shifts: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(staff);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const staff = await db.staff.create({
      data: {
        name: body.name,
        phone: body.phone || null,
        position: body.position,
        salary: parseFloat(body.salary || 0),
        active: body.active ?? true,
      },
    });
    return NextResponse.json(staff);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
