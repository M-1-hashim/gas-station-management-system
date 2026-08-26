import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/gas-station/seed-prices - Seed 15 days of price history
export async function POST() {
  try {
    const fuelTypes = await db.fuelType.findMany();
    const now = new Date();
    let created = 0;

    for (const ft of fuelTypes) {
      // Generate 15 days of price history with slight variations
      for (let i = 15; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const priceVar = (Math.random() - 0.5) * 4;
        const costVar = (Math.random() - 0.5) * 3;
        const price = Math.round((ft.price + priceVar) * 10) / 10;
        const cost = Math.round((ft.cost + costVar) * 10) / 10;
        await db.priceHistory.create({
          data: {
            fuelTypeId: ft.id,
            price,
            cost,
            date,
          },
        });
        created++;
      }
    }

    return NextResponse.json({ success: true, created, message: `Seeded ${created} price history entries` });
  } catch (error) {
    console.error("Seed prices error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
