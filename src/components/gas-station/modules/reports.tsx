"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingCart,
  Droplet,
  Download,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "../hooks";
import { formatCurrency, formatLiters, formatDate, toISODate } from "@/lib/format";
import type { ReportData } from "@/lib/types";

const expenseColors: Record<string, string> = {
  electricity: "#f59e0b",
  salary: "#10b981",
  maintenance: "#8b5cf6",
  rent: "#3b82f6",
  transport: "#06b6d4",
  other: "#6b7280",
};

export function ReportsModule() {
  const { t, language } = useLanguage();
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [from, setFrom] = useState(toISODate(firstOfMonth));
  const [to, setTo] = useState(toISODate(now));
  const [activeQuery, setActiveQuery] = useState({ from: toISODate(firstOfMonth), to: toISODate(now) });

  const { data, isLoading, isFetching } = useQuery<ReportData>({
    queryKey: ["reports", activeQuery],
    queryFn: async () => {
      const res = await fetch(`/api/gas-station/reports?from=${activeQuery.from}&to=${activeQuery.to}`);
      if (!res.ok) throw new Error("Failed to load report");
      return res.json();
    },
  });

  const symbol = "؋";

  const fuelName = (ft: { name: string; nameDa: string | null; namePs: string | null }) => {
    if (language === "da") return ft.nameDa || ft.name;
    if (language === "ps") return ft.namePs || ft.name;
    return ft.name;
  };

  const generate = () => {
    setActiveQuery({ from, to });
  };

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ["Date", "Fuel Type", "Liters", "Price/L", "Total", "Payment", "Customer"],
      ...data.sales.map((s) => [
        formatDate(s.date),
        s.fuelType.name,
        s.liters,
        s.pricePerLiter,
        s.totalAmount,
        s.paymentType,
        s.customer?.name || "",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${activeQuery.from}-to-${activeQuery.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const setQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    const newFrom = toISODate(start);
    const newTo = toISODate(end);
    setFrom(newFrom);
    setTo(newTo);
    setActiveQuery({ from: newFrom, to: newTo });
  };

  return (
    <div className="space-y-4">
      {/* Date Range Selector */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-primary" />
            {t("selectPeriod")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("fromDate")}</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("toDate")}</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
              </div>
              <Button onClick={generate} disabled={isFetching} className="gap-2">
                <BarChart3 className="h-4 w-4" /> {t("generateReport")}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setQuickRange(0)}>{t("today")}</Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange(7)}>{t("thisWeek")}</Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange(30)}>{t("thisMonth")}</Button>
              {data && (
                <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
                  <Download className="h-3.5 w-3.5" /> {t("exportData")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading || isFetching || !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="border-border/60 card-hover">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t("totalSales")}</p>
                  <ShoppingCart className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-2 text-2xl font-bold num">{formatCurrency(data.summary.totalSales, symbol)}</p>
                <p className="mt-1 text-xs text-muted-foreground num">{data.summary.saleCount} {t("sales")}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60 card-hover">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t("totalExpenses")}</p>
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                </div>
                <p className="mt-2 text-2xl font-bold num text-rose-600 dark:text-rose-400">{formatCurrency(data.summary.totalExpenses, symbol)}</p>
                <p className="mt-1 text-xs text-muted-foreground num">{data.summary.expenseCount} {t("expenses")}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60 card-hover">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t("totalLiters")}</p>
                  <Droplet className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-2 text-2xl font-bold num">{formatLiters(data.summary.totalLiters)}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60 card-hover">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t("netProfit")}</p>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                <p className={`mt-2 text-2xl font-bold num ${data.summary.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {formatCurrency(data.summary.netProfit, symbol)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground num">{t("totalProfit")}: {formatCurrency(data.summary.totalProfit, symbol)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Payment breakdown */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-border/60">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t("cash")}</p>
                  <Wallet className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-2 text-xl font-bold num text-emerald-600 dark:text-emerald-400">{formatCurrency(data.summary.cashSales, symbol)}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t("credit")}</p>
                  <Wallet className="h-4 w-4 text-amber-600" />
                </div>
                <p className="mt-2 text-xl font-bold num text-amber-600 dark:text-amber-400">{formatCurrency(data.summary.creditSales, symbol)}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t("totalProfit")}</p>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-2 text-xl font-bold num">{formatCurrency(data.summary.totalProfit, symbol)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Sales by Day */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  {t("salesOverview")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {formatDate(data.period.from)} — {formatDate(data.period.to)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data.salesByDay} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="reportSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(v) => String(v).slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={50} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(value: number) => [formatCurrency(value, symbol), t("totalSales")]}
                    />
                    <Area type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={2} fill="url(#reportSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sales by Fuel Type - Bar */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Droplet className="h-4 w-4 text-primary" />
                  {t("salesByFuelType")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.salesByFuelType.length === 0 ? (
                  <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">{t("noData")}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.salesByFuelType} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" width={70} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                        formatter={(value: number) => [formatCurrency(value, symbol), t("totalSales")]}
                      />
                      <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                        {data.salesByFuelType.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profit Analysis Chart */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                {t("profitAnalysis")}
              </CardTitle>
              <CardDescription className="text-xs">{t("comparison")} • {formatDate(data.period.from)} — {formatDate(data.period.to)}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={data.salesByDay} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="reportProfitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(v) => String(v).slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={50} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value, symbol),
                      name === "amount" ? t("totalSales") : t("totalProfit"),
                    ]}
                  />
                  <Bar dataKey="amount" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={32} name="amount" />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 3 }} name="profit" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expense breakdown + Fuel detail */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Expenses by Category */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("expenseReport")}</CardTitle>
              </CardHeader>
              <CardContent>
                {data.expensesByCategory.length === 0 ? (
                  <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">{t("noData")}</div>
                ) : (
                  <div className="flex flex-col items-center gap-4 sm:flex-row">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={data.expensesByCategory} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80}>
                          {data.expensesByCategory.map((entry, i) => (
                            <Cell key={i} fill={expenseColors[entry.category] || "#6b7280"} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value, symbol)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="w-full space-y-2">
                      {data.expensesByCategory.map((e, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: expenseColors[e.category] || "#6b7280" }} />
                            <span className="truncate">{t(e.category as never)}</span>
                          </div>
                          <span className="font-medium num shrink-0">{formatCurrency(e.amount, symbol)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fuel Type Detail Table */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("salesByFuelType")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("fuelType")}</TableHead>
                      <TableHead className="text-end">{t("liters")}</TableHead>
                      <TableHead className="text-end">{t("total")}</TableHead>
                      <TableHead className="text-end">{t("netProfit")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.salesByFuelType.map((ft, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ft.color }} />
                            <span className="text-sm font-medium">{fuelName(ft)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-end num">{formatLiters(ft.liters)}</TableCell>
                        <TableCell className="text-end num font-medium">{formatCurrency(ft.amount, symbol)}</TableCell>
                        <TableCell className="text-end num text-emerald-600 dark:text-emerald-400">{formatCurrency(ft.profit, symbol)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Sales Table */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("salesReport")}</CardTitle>
              <CardDescription className="text-xs">{data.sales.length} {t("sales")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[400px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead>{t("date")}</TableHead>
                      <TableHead>{t("fuelType")}</TableHead>
                      <TableHead className="text-end">{t("liters")}</TableHead>
                      <TableHead className="text-end">{t("total")}</TableHead>
                      <TableHead>{t("paymentType")}</TableHead>
                      <TableHead>{t("customer")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.sales.map((sale) => (
                      <TableRow key={sale.id} className="hover:bg-muted/50">
                        <TableCell className="text-xs num whitespace-nowrap">{formatDate(sale.date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sale.fuelType.color }} />
                            <span className="text-sm">{fuelName(sale.fuelType)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-end num">{formatLiters(sale.liters)}</TableCell>
                        <TableCell className="text-end num font-medium">{formatCurrency(sale.totalAmount, symbol)}</TableCell>
                        <TableCell>
                          <Badge variant={sale.paymentType === "cash" ? "secondary" : "outline"} className="text-xs">
                            {sale.paymentType === "cash" ? t("cash") : t("credit")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{sale.customer?.name || <span className="text-muted-foreground">—</span>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
