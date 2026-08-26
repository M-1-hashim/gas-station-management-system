import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/gas-station/seed-history - Generate historical sales data for the last 7 days
// This makes the dashboard charts look populated for demo/initial setup purposes
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const days = body.days || 7;
    const salesPerDay = body.salesPerDay || 8;

    const fuelTypes = await db.fuelType.findMany();
    const pumps = await db.pump.findMany({ include: { tank: true } });
    const customers = await db.customer.findMany();
    const staff = await db.staff.findMany();
    if (fuelTypes.length === 0 || pumps.length === 0) {
      return NextResponse.json({ error: "No fuel types or pumps found. Run /seed first." }, { status: 400 });
    }

    const attendant = staff.find((s) => s.position === "attendant") || staff[0];
    const now = new Date();
    let created = 0;

    for (let d = days; d >= 1; d--) {
      const dayDate = new Date(now);
      dayDate.setDate(dayDate.getDate() - d);
      dayDate.setHours(9, 0, 0, 0);

      const shift = await db.shift.create({
        data: {
          staffId: attendant.id,
          startTime: dayDate,
          endTime: new Date(dayDate.getTime() + 8 * 60 * 60 * 1000),
          openingCash: 5000,
          closingCash: 5000 + Math.random() * 8000,
          status: "closed",
        },
      });

      for (let i = 0; i < salesPerDay; i++) {
        const ft = fuelTypes[Math.floor(Math.random() * fuelTypes.length)];
        const pump = pumps.find((p) => p.tank.fuelTypeId === ft.id) || pumps[0];
        const liters = Math.round((5 + Math.random() * 50) * 10) / 10;
        const isCredit = Math.random() < 0.25;
        const customer = isCredit ? customers[Math.floor(Math.random() * customers.length)] : null;
        const saleHour = 9 + Math.floor((i / salesPerDay) * 10);
        const saleDate = new Date(dayDate);
        saleDate.setHours(saleHour, Math.floor(Math.random() * 60), 0, 0);

        const sale = await db.sale.create({
          data: {
            date: saleDate,
            fuelTypeId: ft.id,
            pumpId: pump.id,
            liters,
            pricePerLiter: ft.price,
            totalAmount: liters * ft.price,
            paymentType: isCredit ? "credit" : "cash",
            customerId: customer?.id || null,
            shiftId: shift.id,
            staffId: attendant.id,
          },
        });

        if (isCredit && customer) {
          await db.customer.update({
            where: { id: customer.id },
            data: { balance: { increment: sale.totalAmount } },
          });
        }

        created++;
      }

      const categories = ["electricity", "maintenance", "transport", "salary", "rent"];
      const cat = categories[Math.floor(Math.random() * categories.length)];
      await db.expense.create({
        data: {
          date: dayDate,
          category: cat,
          amount: Math.round((200 + Math.random() * 1500) / 10) * 10,
          description: cat === "electricity" ? "برق" : cat === "maintenance" ? "ترمیم" : cat === "transport" ? "ترانسپورت" : cat === "salary" ? "معاش" : "کرایه",
        },
      });
    }

    return NextResponse.json({ success: true, created, days, message: `Generated ${created} historical sales across ${days} days` });
  } catch (error) {
    console.error("Seed history error:", error);
    return NextResponse.json({ error: "Failed to seed history", detail: String(error) }, { status: 500 });
  }
}
