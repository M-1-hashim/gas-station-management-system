import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/gas-station/price-history - Get price history for all/specific fuel types
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fuelTypeId = searchParams.get("fuelTypeId");
    const days = parseInt(searchParams.get("days") || "30");

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    const where: { date?: { gte: Date }; fuelTypeId?: string } = {
      date: { gte: startDate },
    };
    if (fuelTypeId) where.fuelTypeId = fuelTypeId;

    const history = await db.priceHistory.findMany({
      where,
      include: { fuelType: true },
      orderBy: { date: "asc" },
    });

    // Group by fuel type
    const byFuelType = new Map<string, {
      fuelTypeId: string;
      name: string;
      nameDa: string | null;
      namePs: string | null;
      color: string;
      currentPrice: number;
      currentCost: number;
      history: { date: string; price: number; cost: number }[];
    }>();

    for (const h of history) {
      if (!byFuelType.has(h.fuelTypeId)) {
        byFuelType.set(h.fuelTypeId, {
          fuelTypeId: h.fuelTypeId,
          name: h.fuelType.name,
          nameDa: h.fuelType.nameDa,
          namePs: h.fuelType.namePs,
          color: h.fuelType.color,
          currentPrice: h.fuelType.price,
          currentCost: h.fuelType.cost,
          history: [],
        });
      }
      byFuelType.get(h.fuelTypeId)!.history.push({
        date: h.date.toISOString(),
        price: h.price,
        cost: h.cost,
      });
    }

    // Also include current fuel types without history (seed initial entries)
    const allFuelTypes = await db.fuelType.findMany();
    for (const ft of allFuelTypes) {
      if (!byFuelType.has(ft.id)) {
        byFuelType.set(ft.id, {
          fuelTypeId: ft.id,
          name: ft.name,
          nameDa: ft.nameDa,
          namePs: ft.namePs,
          color: ft.color,
          currentPrice: ft.price,
          currentCost: ft.cost,
          history: [{
            date: new Date().toISOString(),
            price: ft.price,
            cost: ft.cost,
          }],
        });
      }
    }

    return NextResponse.json(Array.from(byFuelType.values()));
  } catch (error) {
    console.error("Price history error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST - Record a price change (also updates the fuel type's current price)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fuelTypeId, price, cost, note } = body;

    if (!fuelTypeId || !price) {
      return NextResponse.json({ error: "fuelTypeId and price required" }, { status: 400 });
    }

    // Update fuel type current price/cost
    const fuelType = await db.fuelType.update({
      where: { id: fuelTypeId },
      data: {
        price: parseFloat(price),
        cost: parseFloat(cost || 0),
      },
    });

    // Create price history entry
    const history = await db.priceHistory.create({
      data: {
        fuelTypeId,
        price: parseFloat(price),
        cost: parseFloat(cost || 0),
        note: note || null,
      },
      include: { fuelType: true },
    });

    return NextResponse.json({ history, fuelType });
  } catch (error) {
    console.error("Price history create error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
