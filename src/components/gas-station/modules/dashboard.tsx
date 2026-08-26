"use client";

import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Clock,
  AlertTriangle,
  Fuel,
  ShoppingCart,
  Plus,
  Truck,
  BarChart3,
  Cylinder,
  Receipt,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "../stat-card";
import { DailyTargetCard } from "../daily-target-card";
import { PriceHistoryChart } from "../price-history-chart";
import { useLanguage } from "../hooks";
import { formatCurrency, formatLiters, formatTime, isToday } from "@/lib/format";
import type { DashboardData, ViewKey } from "@/lib/types";

export function DashboardModule({ onNavigate }: { onNavigate?: (v: ViewKey) => void }) {
  const { t, language } = useLanguage();
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/gas-station/dashboard");
      return res.json();
    },
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const { kpis } = data;
  const symbol = "؋";

  const fuelTypeName = (ft: { name: string; nameDa: string | null; namePs: string | null }) => {
    if (language === "da") return ft.nameDa || ft.name;
    if (language === "ps") return ft.namePs || ft.name;
    return ft.name;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner + Daily Target */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-accent/10 to-transparent lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">{t("welcome")} 👋</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("manageYourStation")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => onNavigate?.("sales")} className="gap-2">
                  <Plus className="h-4 w-4" /> {t("newSale")}
                </Button>
                <Button variant="outline" onClick={() => onNavigate?.("expenses")} className="gap-2">
                  <Wallet className="h-4 w-4" /> {t("addExpense")}
                </Button>
                <Button variant="outline" onClick={() => onNavigate?.("refills")} className="gap-2">
                  <Truck className="h-4 w-4" /> {t("newRefill")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <DailyTargetCard />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title={t("todaysSales")}
          value={formatCurrency(kpis.todaySales, symbol)}
          subtitle={t("today")}
          icon={ShoppingCart}
          color="emerald"
          onClick={() => onNavigate?.("sales")}
        />
        <StatCard
          title={t("todaysProfit")}
          value={formatCurrency(kpis.todayProfit, symbol)}
          subtitle={t("today")}
          icon={TrendingUp}
          color="primary"
        />
        <StatCard
          title={t("todaysExpenses")}
          value={formatCurrency(kpis.todayExpenses, symbol)}
          subtitle={t("today")}
          icon={TrendingDown}
          color="rose"
          onClick={() => onNavigate?.("expenses")}
        />
        <StatCard
          title={t("creditBalance")}
          value={formatCurrency(kpis.totalCredit, symbol)}
          subtitle={`${kpis.totalCustomers} ${t("customers")}`}
          icon={Users}
          color="amber"
          onClick={() => onNavigate?.("customers")}
        />
      </div>

      {/* Secondary KPIs - with weekly growth comparison */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title={t("salesThisWeek")}
          value={formatCurrency(kpis.weekSales, symbol)}
          subtitle={`${t("lastWeek")}: ${formatCurrency(kpis.lastWeekSales, symbol)}`}
          icon={BarChart3}
          color="blue"
          trend={{
            value: `${kpis.weekGrowth >= 0 ? "+" : ""}${kpis.weekGrowth.toFixed(1)}%`,
            positive: kpis.weekGrowth >= 0,
          }}
        />
        <StatCard title={t("thisMonth")} value={formatCurrency(kpis.monthSales, symbol)} icon={BarChart3} color="violet" />
        <StatCard
          title={t("activeShifts")}
          value={String(kpis.activeShifts)}
          icon={Clock}
          color="emerald"
          onClick={() => onNavigate?.("shifts")}
        />
        <StatCard
          title={t("lowStockAlerts")}
          value={String(kpis.lowStockAlerts)}
          icon={AlertTriangle}
          color={kpis.lowStockAlerts > 0 ? "rose" : "emerald"}
          onClick={() => onNavigate?.("tanks")}
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title={t("transactionsToday")} value={String(kpis.transactionsToday)} icon={Receipt} color="emerald" />
        <StatCard title={t("avgSaleValue")} value={formatCurrency(kpis.avgSaleValue, symbol)} icon={TrendingUp} color="amber" />
        <StatCard
          title={t("busiestHour")}
          value={kpis.busiestHour >= 0 ? `${kpis.busiestHour}:00` : "—"}
          icon={Clock}
          color="violet"
        />
        <StatCard title={t("totalProfit")} value={formatCurrency(kpis.todayProfit, symbol)} icon={TrendingUp} color="primary" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sales & Profit Overview - 7 days */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-primary" />
                {t("salesOverview")}
              </CardTitle>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary" /> {t("totalSales")}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> {t("totalProfit")}
                </span>
              </div>
            </div>
            <CardDescription className="text-xs">{t("thisWeek")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={data.last7Days} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={50} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, name: string) => [
                    formatCurrency(value, symbol),
                    name === "total" ? t("totalSales") : t("totalProfit"),
                  ]}
                />
                <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ fill: "#f59e0b", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales by Fuel Type */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Fuel className="h-4 w-4 text-primary" />
              {t("salesByFuelType")}
            </CardTitle>
            <CardDescription className="text-xs">{t("today")}</CardDescription>
          </CardHeader>
          <CardContent>
            {data.salesByFuelType.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                {t("noData")}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.salesByFuelType}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {data.salesByFuelType.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value, symbol)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full space-y-2">
                  {data.salesByFuelType.map((ft, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: ft.color }} />
                        <span className="truncate">{fuelTypeName(ft)}</span>
                      </div>
                      <div className="text-end">
                        <p className="font-medium num">{formatLiters(ft.liters)}</p>
                        <p className="text-xs text-muted-foreground num">{formatCurrency(ft.amount, symbol)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tank Levels */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Cylinder className="h-4 w-4 text-primary" />
              {t("tankLevels")}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate?.("tanks")} className="text-xs">
              {t("viewAll")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.tanks.map((tank) => {
              const pct = Math.min(100, (tank.currentLevel / tank.capacity) * 100);
              const isLow = tank.currentLevel <= tank.minLevel;
              return (
                <div
                  key={tank.id}
                  className={`rounded-xl border p-4 ${isLow ? "border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30" : "border-border bg-card"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{tank.name}</p>
                      <p className="text-xs text-muted-foreground">{fuelTypeName(tank.fuelType)}</p>
                    </div>
                    {isLow && (
                      <Badge variant="destructive" className="pulse-warning shrink-0">
                        <AlertTriangle className="me-1 h-3 w-3" />
                        {t("lowStockAlerts")}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="num">{formatLiters(tank.currentLevel)}</span>
                      <span className="num text-muted-foreground">/ {formatLiters(tank.capacity)}</span>
                    </div>
                    <Progress
                      value={pct}
                      className="h-2"
                      style={{
                        background: isLow ? "oklch(0.92 0.04 25)" : undefined,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Sales */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-4 w-4 text-primary" />
                {t("recentSales")}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate?.("sales")} className="text-xs">
                {t("viewAll")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentSales.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{t("noData")}</p>
              ) : (
                data.recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: sale.fuelType.color }}
                      >
                        {fuelTypeName(sale.fuelType).charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {formatLiters(sale.liters)} {fuelTypeName(sale.fuelType)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {sale.customer?.name ?? t("walkInCustomer")} • {formatTime(sale.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-sm font-semibold num">{formatCurrency(sale.totalAmount, symbol)}</p>
                      <Badge variant={sale.paymentType === "cash" ? "secondary" : "outline"} className="text-xs">
                        {sale.paymentType === "cash" ? t("cash") : t("credit")}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-4 w-4 text-primary" />
                {t("recentExpenses")}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate?.("expenses")} className="text-xs">
                {t("viewAll")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentExpenses.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{t("noData")}</p>
              ) : (
                data.recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {t(expense.category as never) || expense.category}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {expense.description || "—"} • {formatTime(expense.date)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold num shrink-0 text-rose-600 dark:text-rose-400">
                      -{formatCurrency(expense.amount, symbol)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers & Top Fuel Types */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Customers */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              {t("topCustomers")}
            </CardTitle>
            <CardDescription className="text-xs">{t("thisMonth")}</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topCustomers.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">{t("noData")}</div>
            ) : (
              <div className="space-y-2">
                {data.topCustomers.map((cust, i) => {
                  const maxTotal = data.topCustomers[0]?.total || 1;
                  const pct = (cust.total / maxTotal) * 100;
                  return (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 p-2.5 hover:bg-muted/50 transition-colors">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">{cust.name}</p>
                          <p className="text-sm font-bold num shrink-0">{formatCurrency(cust.total, symbol)}</p>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground num shrink-0">{cust.count} {t("sales")}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Fuel Types */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Fuel className="h-4 w-4 text-primary" />
              {t("topFuelTypes")}
            </CardTitle>
            <CardDescription className="text-xs">{t("thisMonth")}</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topFuelTypes.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">{t("noData")}</div>
            ) : (
              <div className="space-y-3">
                {data.topFuelTypes.map((ft, i) => {
                  const maxAmount = data.topFuelTypes[0]?.amount || 1;
                  const pct = (ft.amount / maxAmount) * 100;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: ft.color }} />
                          <span className="truncate text-sm font-medium">{fuelTypeName(ft)}</span>
                        </div>
                        <div className="text-end shrink-0">
                          <p className="text-sm font-bold num">{formatCurrency(ft.amount, symbol)}</p>
                          <p className="text-[10px] text-muted-foreground num">{formatLiters(ft.liters)}</p>
                        </div>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: ft.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Price History Chart */}
      <PriceHistoryChart />
    </div>
  );
}
