import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/gas-station/suppliers
export async function GET() {
  try {
    const suppliers = await db.supplier.findMany({
      include: {
        _count: { select: { refills: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/gas-station/suppliers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supplier = await db.supplier.create({
      data: {
        name: body.name,
        nameDa: body.nameDa || null,
        namePs: body.namePs || null,
        phone: body.phone || null,
        address: body.address || null,
        contactPerson: body.contactPerson || null,
        balance: parseFloat(body.balance || 0),
        active: body.active ?? true,
      },
    });
    return NextResponse.json(supplier);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
