import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // End shift
    if (body.action === "end") {
      const shift = await db.shift.update({
        where: { id },
        data: {
          endTime: new Date(),
          closingCash: parseFloat(body.closingCash || 0),
          status: "closed",
          note: body.note,
        },
        include: { staff: true },
      });
      return NextResponse.json(shift);
    }

    const shift = await db.shift.update({
      where: { id },
      data: {
        staffId: body.staffId,
        openingCash: parseFloat(body.openingCash),
        note: body.note,
      },
      include: { staff: true },
    });
    return NextResponse.json(shift);
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
    await db.shift.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
