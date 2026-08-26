import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/gas-station/seed - Seed initial data
export async function POST(req: NextRequest) {
  try {
    // Create station
    const station = await db.station.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        name: "تانک تیل افغانستان",
        nameDa: "تانک تیل افغانستان",
        namePs: "د افغانستان د تیلو ټانک",
        owner: "احمد خان",
        phone: "0700123456",
        address: "کابل، افغانستان",
        currency: "AFN",
        currencySymbol: "؋",
      },
    });

    // Create fuel types
    const petrol = await db.fuelType.upsert({
      where: { id: "fuel-petrol" },
      update: {},
      create: {
        id: "fuel-petrol",
        name: "Petrol",
        nameDa: "بنزین",
        namePs: "بینزین",
        price: 65,
        cost: 58,
        color: "#10b981",
        icon: "fuel",
      },
    });

    const diesel = await db.fuelType.upsert({
      where: { id: "fuel-diesel" },
      update: {},
      create: {
        id: "fuel-diesel",
        name: "Diesel",
        nameDa: "ډیزل",
        namePs: "ډیزل",
        price: 68,
        cost: 60,
        color: "#f59e0b",
        icon: "fuel",
      },
    });

    const kerosene = await db.fuelType.upsert({
      where: { id: "fuel-kerosene" },
      update: {},
      create: {
        id: "fuel-kerosene",
        name: "Kerosene",
        nameDa: "نفط",
        namePs: "نفط",
        price: 55,
        cost: 48,
        color: "#8b5cf6",
        icon: "fuel",
      },
    });

    // Create tanks
    const tanks = await Promise.all([
      db.tank.upsert({
        where: { id: "tank-1" },
        update: {},
        create: {
          id: "tank-1",
          name: "Tank 1 - Petrol",
          fuelTypeId: petrol.id,
          capacity: 20000,
          currentLevel: 8500,
          minLevel: 2000,
        },
      }),
      db.tank.upsert({
        where: { id: "tank-2" },
        update: {},
        create: {
          id: "tank-2",
          name: "Tank 2 - Diesel",
          fuelTypeId: diesel.id,
          capacity: 25000,
          currentLevel: 15200,
          minLevel: 2500,
        },
      }),
      db.tank.upsert({
        where: { id: "tank-3" },
        update: {},
        create: {
          id: "tank-3",
          name: "Tank 3 - Kerosene",
          fuelTypeId: kerosene.id,
          capacity: 15000,
          currentLevel: 1800,
          minLevel: 1500,
        },
      }),
    ]);

    // Create pumps
    const pumps = await Promise.all([
      db.pump.upsert({
        where: { id: "pump-1" },
        update: {},
        create: { id: "pump-1", name: "Pump 1", tankId: tanks[0].id, reading: 45230.5 },
      }),
      db.pump.upsert({
        where: { id: "pump-2" },
        update: {},
        create: { id: "pump-2", name: "Pump 2", tankId: tanks[0].id, reading: 32100.2 },
      }),
      db.pump.upsert({
        where: { id: "pump-3" },
        update: {},
        create: { id: "pump-3", name: "Pump 3", tankId: tanks[1].id, reading: 58900.8 },
      }),
      db.pump.upsert({
        where: { id: "pump-4" },
        update: {},
        create: { id: "pump-4", name: "Pump 4", tankId: tanks[2].id, reading: 12400.3 },
      }),
    ]);

    // Create staff
    const staff = await Promise.all([
      db.staff.upsert({
        where: { id: "staff-1" },
        update: {},
        create: {
          id: "staff-1",
          name: "محمد یوسف",
          phone: "0700111222",
          position: "manager",
          salary: 25000,
        },
      }),
      db.staff.upsert({
        where: { id: "staff-2" },
        update: {},
        create: {
          id: "staff-2",
          name: "عبدالله",
          phone: "0700333444",
          position: "attendant",
          salary: 15000,
        },
      }),
      db.staff.upsert({
        where: { id: "staff-3" },
        update: {},
        create: {
          id: "staff-3",
          name: "نجیب الله",
          phone: "0700555666",
          position: "attendant",
          salary: 14000,
        },
      }),
    ]);

    // Create customers
    const customers = await Promise.all([
      db.customer.upsert({
        where: { id: "cust-1" },
        update: {},
        create: {
          id: "cust-1",
          name: "تجارت خانه ابراهیمی",
          phone: "0700777888",
          address: "کابل، شهر نو",
          balance: 4500,
        },
      }),
      db.customer.upsert({
        where: { id: "cust-2" },
        update: {},
        create: {
          id: "cust-2",
          name: "شرکت حمل و نقل آرمان",
          phone: "0700999000",
          address: "کابل، پل سرخ",
          balance: 12000,
        },
      }),
      db.customer.upsert({
        where: { id: "cust-3" },
        update: {},
        create: {
          id: "cust-3",
          name: "احمد گل",
          phone: "0700222333",
          address: "کابل، خیرخانه",
          balance: 0,
        },
      }),
    ]);

    // Create products
    await Promise.all([
      db.product.upsert({
        where: { id: "prod-1" },
        update: {},
        create: {
          id: "prod-1",
          name: "Engine Oil 5W-30",
          nameDa: "تیل موتور 5W-30",
          namePs: "د موټر تیل 5W-30",
          category: "oil",
          price: 800,
          cost: 650,
          stock: 45,
          minStock: 10,
          unit: "piece",
        },
      }),
      db.product.upsert({
        where: { id: "prod-2" },
        update: {},
        create: {
          id: "prod-2",
          name: "Engine Oil 20W-50",
          nameDa: "تیل موتور 20W-50",
          namePs: "د موټر تیل 20W-50",
          category: "oil",
          price: 700,
          cost: 550,
          stock: 8,
          minStock: 10,
          unit: "piece",
        },
      }),
      db.product.upsert({
        where: { id: "prod-3" },
        update: {},
        create: {
          id: "prod-3",
          name: "Oil Filter",
          nameDa: "فیلتر تیل",
          namePs: "د تیلو فلټر",
          category: "filter",
          price: 250,
          cost: 180,
          stock: 30,
          minStock: 10,
          unit: "piece",
        },
      }),
      db.product.upsert({
        where: { id: "prod-4" },
        update: {},
        create: {
          id: "prod-4",
          name: "Air Filter",
          nameDa: "فیلتر هوا",
          namePs: "د هوا فلټر",
          category: "filter",
          price: 350,
          cost: 250,
          stock: 5,
          minStock: 10,
          unit: "piece",
        },
      }),
    ]);

    // Create a shift
    const shift = await db.shift.create({
      data: {
        staffId: staff[1].id,
        startTime: new Date(new Date().setHours(8, 0, 0, 0)),
        openingCash: 5000,
        status: "open",
      },
    });

    // Create some sample sales for today
    const now = new Date();
    const todaySales = [
      { fuelTypeId: petrol.id, pumpId: pumps[0].id, liters: 20, pricePerLiter: 65, hoursAgo: 1 },
      { fuelTypeId: diesel.id, pumpId: pumps[2].id, liters: 40, pricePerLiter: 68, hoursAgo: 2 },
      { fuelTypeId: petrol.id, pumpId: pumps[1].id, liters: 15, pricePerLiter: 65, hoursAgo: 3 },
      { fuelTypeId: diesel.id, pumpId: pumps[2].id, liters: 60, pricePerLiter: 68, hoursAgo: 4, customerId: customers[1].id, paymentType: "credit" },
      { fuelTypeId: petrol.id, pumpId: pumps[0].id, liters: 30, pricePerLiter: 65, hoursAgo: 5 },
      { fuelTypeId: kerosene.id, pumpId: pumps[3].id, liters: 10, pricePerLiter: 55, hoursAgo: 6 },
    ];

    for (const s of todaySales) {
      const saleDate = new Date(now.getTime() - s.hoursAgo * 60 * 60 * 1000);
      await db.sale.create({
        data: {
          date: saleDate,
          fuelTypeId: s.fuelTypeId,
          pumpId: s.pumpId,
          liters: s.liters,
          pricePerLiter: s.pricePerLiter,
          totalAmount: s.liters * s.pricePerLiter,
          paymentType: (s as { paymentType?: string }).paymentType ?? "cash",
          customerId: (s as { customerId?: string }).customerId ?? null,
          shiftId: shift.id,
          staffId: staff[1].id,
        },
      });
    }

    // Create some expenses for today
    const expenses = [
      { category: "electricity", amount: 1500, description: "برق ماهانه" },
      { category: "maintenance", amount: 800, description: "ترمیم پمپ" },
      { category: "transport", amount: 500, description: "ترانسپورت" },
    ];

    for (const e of expenses) {
      await db.expense.create({
        data: { ...e, date: now },
      });
    }

    return NextResponse.json({ success: true, message: "Data seeded successfully", station });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed data", detail: String(error) }, { status: 500 });
  }
}
