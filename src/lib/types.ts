// Shared types for the Gas Station Management System

export interface Station {
  id: string;
  name: string;
  nameDa: string | null;
  namePs: string | null;
  owner: string | null;
  phone: string | null;
  address: string | null;
  currency: string;
  currencySymbol: string;
}

export interface FuelType {
  id: string;
  name: string;
  nameDa: string | null;
  namePs: string | null;
  price: number;
  cost: number;
  unit: string;
  color: string;
  icon: string | null;
  active: boolean;
  _count?: { tanks: number; sales: number };
}

export interface Tank {
  id: string;
  name: string;
  fuelTypeId: string;
  fuelType: FuelType;
  capacity: number;
  currentLevel: number;
  minLevel: number;
  pumps?: Pump[];
  _count?: { refills: number };
}

export interface Pump {
  id: string;
  name: string;
  tankId: string;
  tank?: Tank;
  reading: number;
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  balance: number;
  _count?: { sales: number; payments: number };
}

export interface Sale {
  id: string;
  date: string;
  fuelTypeId: string;
  fuelType: FuelType;
  pumpId: string | null;
  pump?: Pump | null;
  liters: number;
  pricePerLiter: number;
  totalAmount: number;
  paymentType: string;
  customerId: string | null;
  customer?: Customer | null;
  shiftId: string | null;
  staffId: string | null;
  note: string | null;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string | null;
}

export interface Staff {
  id: string;
  name: string;
  phone: string | null;
  position: string;
  salary: number;
  active: boolean;
  _count?: { shifts: number };
}

export interface Shift {
  id: string;
  staffId: string;
  staff: Staff;
  startTime: string;
  endTime: string | null;
  openingCash: number;
  closingCash: number | null;
  status: string;
  note: string | null;
}

export interface Product {
  id: string;
  name: string;
  nameDa: string | null;
  namePs: string | null;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
}

export interface Refill {
  id: string;
  tankId: string;
  tank: Tank;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  supplier: string | null;
  invoiceNo: string | null;
  date: string;
  note: string | null;
}

export interface DashboardData {
  kpis: {
    todaySales: number;
    todayProfit: number;
    todayExpenses: number;
    weekSales: number;
    monthSales: number;
    totalCustomers: number;
    totalCredit: number;
    activeShifts: number;
    lowStockAlerts: number;
  };
  activeShifts: Shift[];
  tanks: Tank[];
  lowStockTanks: Tank[];
  lowStockProducts: Product[];
  salesByFuelType: { name: string; nameDa: string | null; namePs: string | null; color: string; liters: number; amount: number }[];
  last7Days: { date: string; label: string; total: number; profit: number; liters: number }[];
  recentSales: Sale[];
  recentExpenses: Expense[];
}

export interface ReportData {
  period: { from: string; to: string };
  summary: {
    totalSales: number;
    totalLiters: number;
    totalProfit: number;
    totalExpenses: number;
    netProfit: number;
    cashSales: number;
    creditSales: number;
    saleCount: number;
    expenseCount: number;
  };
  salesByFuelType: { name: string; nameDa: string | null; namePs: string | null; color: string; liters: number; amount: number; profit: number; cost: number }[];
  expensesByCategory: { category: string; amount: number }[];
  salesByDay: { date: string; amount: number }[];
  sales: Sale[];
  expenses: Expense[];
}

export type ViewKey =
  | "dashboard"
  | "tanks"
  | "fuelTypes"
  | "pumps"
  | "sales"
  | "customers"
  | "expenses"
  | "staff"
  | "shifts"
  | "products"
  | "refills"
  | "reports"
  | "settings";
