import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/gas-station/alerts - Aggregated alerts for notifications
export async function GET() {
  try {
    const alerts: Array<{
      id: string;
      type: "critical" | "warning" | "info";
      category: "tank" | "product" | "credit" | "shift";
      title: string;
      titleDa: string;
      titlePs: string;
      message: string;
      messageDa: string;
      messagePs: string;
      action?: string;
      entityId?: string;
    }> = [];

    // 1. Low stock tanks
    const tanks = await db.tank.findMany({
      include: { fuelType: true },
    });
    for (const tank of tanks) {
      const pct = (tank.currentLevel / tank.capacity) * 100;
      const isCritical = tank.currentLevel <= tank.minLevel * 0.5;
      const isLow = tank.currentLevel <= tank.minLevel;
      if (isLow) {
        const fuelName = tank.fuelType.nameDa || tank.fuelType.name;
        alerts.push({
          id: `tank-${tank.id}`,
          type: isCritical ? "critical" : "warning",
          category: "tank",
          title: `${tank.name} - Low`,
          titleDa: `${tank.name} - کم`,
          titlePs: `${tank.name} - کم`,
          message: `${tank.currentLevel.toFixed(0)}L / ${tank.capacity.toFixed(0)}L (${pct.toFixed(0)}%)`,
          messageDa: `${tank.currentLevel.toFixed(0)} لیتر / ${tank.capacity.toFixed(0)} لیتر (${pct.toFixed(0)}٪) - ${fuelName}`,
          messagePs: `${tank.currentLevel.toFixed(0)} لیټر / ${tank.capacity.toFixed(0)} لیټر (${pct.toFixed(0)}٪) - ${fuelName}`,
          action: "tanks",
          entityId: tank.id,
        });
      }
    }

    // 2. Low stock products
    const products = await db.product.findMany({
      where: { stock: { lte: db.product.fields.minStock } },
    });
    for (const prod of products) {
      alerts.push({
        id: `product-${prod.id}`,
        type: prod.stock === 0 ? "critical" : "warning",
        category: "product",
        title: `${prod.name} - Low Stock`,
        titleDa: `${prod.nameDa || prod.name} - کم`,
        titlePs: `${prod.namePs || prod.name} - کم`,
        message: `${prod.stock} ${prod.unit} (min: ${prod.minStock})`,
        messageDa: `${prod.stock} ${prod.unit} (حداقل: ${prod.minStock})`,
        messagePs: `${prod.stock} ${prod.unit} (لږ تر لږه: ${prod.minStock})`,
        action: "products",
        entityId: prod.id,
      });
    }

    // 3. High credit customers (balance > 10000)
    const customers = await db.customer.findMany({
      where: { balance: { gt: 10000 } },
    });
    for (const cust of customers) {
      alerts.push({
        id: `credit-${cust.id}`,
        type: "warning",
        category: "credit",
        title: `High Credit: ${cust.name}`,
        titleDa: `نسیه زیاد: ${cust.name}`,
        titlePs: `ډیره نسیه: ${cust.name}`,
        message: `Balance: ؋${cust.balance.toFixed(0)}`,
        messageDa: `باقی: ؋${cust.balance.toFixed(0)}`,
        messagePs: `پاتې: ؋${cust.balance.toFixed(0)}`,
        action: "customers",
        entityId: cust.id,
      });
    }

    // 4. Check for open shifts running too long (>10 hours)
    const openShifts = await db.shift.findMany({
      where: { status: "open" },
      include: { staff: true },
    });
    const now = new Date();
    for (const shift of openShifts) {
      const durationHours = (now.getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60);
      if (durationHours > 10) {
        alerts.push({
          id: `shift-${shift.id}`,
          type: "warning",
          category: "shift",
          title: `Long Shift: ${shift.staff.name}`,
          titleDa: `شفت طولانی: ${shift.staff.name}`,
          titlePs: `اوږد شیفټ: ${shift.staff.name}`,
          message: `${durationHours.toFixed(1)} hours`,
          messageDa: `${durationHours.toFixed(1)} ساعت`,
          messagePs: `${durationHours.toFixed(1)} ساعتونه`,
          action: "shifts",
          entityId: shift.id,
        });
      }
    }

    // Sort: critical first, then warnings, then info
    const priority = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => priority[a.type] - priority[b.type]);

    return NextResponse.json({
      alerts,
      counts: {
        total: alerts.length,
        critical: alerts.filter((a) => a.type === "critical").length,
        warning: alerts.filter((a) => a.type === "warning").length,
        info: alerts.filter((a) => a.type === "info").length,
      },
    });
  } catch (error) {
    console.error("Alerts error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
