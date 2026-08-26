import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/gas-station/restore - Restore data from JSON backup
// This wipes all existing data and restores from the backup file
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backup = body.data || body;

    // Validate backup structure
    if (!backup || typeof backup !== "object") {
      return NextResponse.json({ error: "Invalid backup format" }, { status: 400 });
    }

    // Use a transaction to ensure atomicity
    await db.$transaction(async (tx) => {
      // Delete existing data in correct order (respecting foreign keys)
      await tx.payment.deleteMany();
      await tx.productSale.deleteMany();
      await tx.sale.deleteMany();
      await tx.expense.deleteMany();
      await tx.refill.deleteMany();
      await tx.priceHistory.deleteMany();
      await tx.pump.deleteMany();
      await tx.tank.deleteMany();
      await tx.shift.deleteMany();
      await tx.product.deleteMany();
      await tx.customer.deleteMany();
      await tx.supplier.deleteMany();
      await tx.staff.deleteMany();
      await tx.fuelType.deleteMany();

      // Restore station
      if (backup.station) {
        await tx.station.upsert({
          where: { id: "default" },
          update: {
            name: backup.station.name,
            nameDa: backup.station.nameDa,
            namePs: backup.station.namePs,
            owner: backup.station.owner,
            phone: backup.station.phone,
            address: backup.station.address,
            currency: backup.station.currency,
            currencySymbol: backup.station.currencySymbol,
            dailyTarget: backup.station.dailyTarget || 50000,
          },
          create: {
            id: "default",
            name: backup.station.name || "تانک تیل",
            nameDa: backup.station.nameDa,
            namePs: backup.station.namePs,
            owner: backup.station.owner,
            phone: backup.station.phone,
            address: backup.station.address,
            currency: backup.station.currency || "AFN",
            currencySymbol: backup.station.currencySymbol || "؋",
            dailyTarget: backup.station.dailyTarget || 50000,
          },
        });
      }

      // Restore fuel types
      if (backup.fuelTypes && Array.isArray(backup.fuelTypes)) {
        for (const ft of backup.fuelTypes) {
          await tx.fuelType.create({
            data: {
              id: ft.id,
              name: ft.name,
              nameDa: ft.nameDa,
              namePs: ft.namePs,
              price: ft.price,
              cost: ft.cost,
              unit: ft.unit || "liter",
              color: ft.color || "#10b981",
              icon: ft.icon,
              active: ft.active ?? true,
            },
          });
        }
      }

      // Restore tanks
      if (backup.tanks && Array.isArray(backup.tanks)) {
        for (const tank of backup.tanks) {
          await tx.tank.create({
            data: {
              id: tank.id,
              name: tank.name,
              fuelTypeId: tank.fuelTypeId,
              capacity: tank.capacity,
              currentLevel: tank.currentLevel,
              minLevel: tank.minLevel,
            },
          });
        }
      }

      // Restore pumps
      if (backup.pumps && Array.isArray(backup.pumps)) {
        for (const pump of backup.pumps) {
          await tx.pump.create({
            data: {
              id: pump.id,
              name: pump.name,
              tankId: pump.tankId,
              reading: pump.reading || 0,
              active: pump.active ?? true,
            },
          });
        }
      }

      // Restore suppliers
      if (backup.suppliers && Array.isArray(backup.suppliers)) {
        for (const sup of backup.suppliers) {
          await tx.supplier.create({
            data: {
              id: sup.id,
              name: sup.name,
              nameDa: sup.nameDa,
              namePs: sup.namePs,
              phone: sup.phone,
              address: sup.address,
              contactPerson: sup.contactPerson,
              balance: sup.balance || 0,
              active: sup.active ?? true,
            },
          });
        }
      }

      // Restore customers
      if (backup.customers && Array.isArray(backup.customers)) {
        for (const c of backup.customers) {
          await tx.customer.create({
            data: {
              id: c.id,
              name: c.name,
              phone: c.phone,
              address: c.address,
              balance: c.balance || 0,
            },
          });
        }
      }

      // Restore staff
      if (backup.staff && Array.isArray(backup.staff)) {
        for (const s of backup.staff) {
          await tx.staff.create({
            data: {
              id: s.id,
              name: s.name,
              phone: s.phone,
              position: s.position,
              salary: s.salary || 0,
              active: s.active ?? true,
            },
          });
        }
      }

      // Restore products
      if (backup.products && Array.isArray(backup.products)) {
        for (const p of backup.products) {
          await tx.product.create({
            data: {
              id: p.id,
              name: p.name,
              nameDa: p.nameDa,
              namePs: p.namePs,
              category: p.category,
              price: p.price,
              cost: p.cost || 0,
              stock: p.stock || 0,
              minStock: p.minStock || 5,
              unit: p.unit || "piece",
            },
          });
        }
      }

      // Restore shifts
      if (backup.shifts && Array.isArray(backup.shifts)) {
        for (const sh of backup.shifts) {
          await tx.shift.create({
            data: {
              id: sh.id,
              staffId: sh.staffId,
              startTime: new Date(sh.startTime),
              endTime: sh.endTime ? new Date(sh.endTime) : null,
              openingCash: sh.openingCash || 0,
              closingCash: sh.closingCash,
              status: sh.status || "closed",
              note: sh.note,
            },
          });
        }
      }

      // Restore sales
      if (backup.sales && Array.isArray(backup.sales)) {
        for (const s of backup.sales) {
          await tx.sale.create({
            data: {
              id: s.id,
              date: new Date(s.date),
              fuelTypeId: s.fuelTypeId,
              pumpId: s.pumpId,
              liters: s.liters,
              pricePerLiter: s.pricePerLiter,
              totalAmount: s.totalAmount,
              paymentType: s.paymentType || "cash",
              customerId: s.customerId,
              shiftId: s.shiftId,
              staffId: s.staffId,
              note: s.note,
            },
          });
        }
      }

      // Restore expenses
      if (backup.expenses && Array.isArray(backup.expenses)) {
        for (const e of backup.expenses) {
          await tx.expense.create({
            data: {
              id: e.id,
              date: new Date(e.date),
              category: e.category,
              amount: e.amount,
              description: e.description,
            },
          });
        }
      }

      // Restore payments
      if (backup.payments && Array.isArray(backup.payments)) {
        for (const p of backup.payments) {
          await tx.payment.create({
            data: {
              id: p.id,
              customerId: p.customerId,
              amount: p.amount,
              method: p.method || "cash",
              note: p.note,
              date: new Date(p.date),
            },
          });
        }
      }

      // Restore refills
      if (backup.refills && Array.isArray(backup.refills)) {
        for (const r of backup.refills) {
          await tx.refill.create({
            data: {
              id: r.id,
              tankId: r.tankId,
              liters: r.liters,
              costPerLiter: r.costPerLiter,
              totalCost: r.totalCost,
              supplierId: r.supplierId,
              invoiceNo: r.invoiceNo,
              date: new Date(r.date),
              note: r.note,
            },
          });
        }
      }

      // Restore price history
      if (backup.priceHistory && Array.isArray(backup.priceHistory)) {
        for (const ph of backup.priceHistory) {
          await tx.priceHistory.create({
            data: {
              id: ph.id,
              fuelTypeId: ph.fuelTypeId,
              price: ph.price,
              cost: ph.cost,
              date: new Date(ph.date),
              note: ph.note,
            },
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Data restored successfully",
      counts: {
        fuelTypes: backup.fuelTypes?.length || 0,
        tanks: backup.tanks?.length || 0,
        pumps: backup.pumps?.length || 0,
        sales: backup.sales?.length || 0,
        customers: backup.customers?.length || 0,
        suppliers: backup.suppliers?.length || 0,
        expenses: backup.expenses?.length || 0,
        staff: backup.staff?.length || 0,
        shifts: backup.shifts?.length || 0,
        products: backup.products?.length || 0,
        refills: backup.refills?.length || 0,
        payments: backup.payments?.length || 0,
      },
    });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
