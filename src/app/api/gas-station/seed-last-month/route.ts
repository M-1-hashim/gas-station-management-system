import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/gas-station/seed-last-month - Generate sales & expenses for the previous month
// This makes the monthly comparison feature demonstrate real value
export async function POST() {
  try {
    const fuelTypes = await db.fuelType.findMany();
    const pumps = await db.pump.findMany({ include: { tank: true } });
    const customers = await db.customer.findMany();
    const staff = await db.staff.findMany();
    if (fuelTypes.length === 0 || pumps.length === 0) {
      return NextResponse.json({ error: "No fuel types or pumps found. Run /seed first." }, { status: 400 });
    }

    const attendant = staff.find((s) => s.position === "attendant") || staff[0];
    const now = new Date();
    // Previous month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const daysInLastMonth = lastMonthEnd.getDate();
    let created = 0;

    // Create a closed shift for every other day of last month
    for (let d = 1; d <= daysInLastMonth; d += 2) {
      const dayDate = new Date(lastMonthStart.getFullYear(), lastMonthStart.getMonth(), d);
      dayDate.setHours(9, 0, 0, 0);

      const shift = await db.shift.create({
        data: {
          staffId: attendant.id,
          startTime: dayDate,
          endTime: new Date(dayDate.getTime() + 8 * 60 * 60 * 1000),
          openingCash: 5000,
          closingCash: 5000 + Math.random() * 10000,
          status: "closed",
        },
      });

      // 5-10 sales per shift day
      const salesCount = 5 + Math.floor(Math.random() * 6);
      for (let i = 0; i < salesCount; i++) {
        const ft = fuelTypes[Math.floor(Math.random() * fuelTypes.length)];
        const pump = pumps.find((p) => p.tank.fuelTypeId === ft.id) || pumps[0];
        const liters = Math.round((5 + Math.random() * 50) * 10) / 10;
        const isCredit = Math.random() < 0.2;
        const customer = isCredit && customers.length > 0
          ? customers[Math.floor(Math.random() * customers.length)]
          : null;
        const saleHour = 9 + Math.floor((i / salesCount) * 10);
        const saleDate = new Date(dayDate);
        saleDate.setHours(saleHour, Math.floor(Math.random() * 60), 0, 0);

        await db.sale.create({
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
        created++;
      }

      // 1-2 expenses per shift day
      const categories = ["electricity", "maintenance", "transport", "salary", "rent"];
      const expCount = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < expCount; i++) {
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
    }

    return NextResponse.json({
      success: true,
      created,
      daysInLastMonth: Math.ceil(daysInLastMonth / 2),
      message: `Generated ${created} sales for last month across ${Math.ceil(daysInLastMonth / 2)} days`,
    });
  } catch (error) {
    console.error("Seed last month error:", error);
    return NextResponse.json({ error: "Failed to seed", detail: String(error) }, { status: 500 });
  }
}
