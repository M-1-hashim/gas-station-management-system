import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const products = await db.product.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const product = await db.product.create({
      data: {
        name: body.name,
        namePs: body.namePs || null,
        nameDa: body.nameDa || null,
        category: body.category,
        price: parseFloat(body.price),
        cost: parseFloat(body.cost || 0),
        stock: parseFloat(body.stock || 0),
        minStock: parseFloat(body.minStock || 5),
        unit: body.unit || "piece",
      },
    });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
