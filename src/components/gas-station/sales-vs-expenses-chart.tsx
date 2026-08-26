"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "./hooks";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Station } from "@/lib/types";

interface DailyData {
  date: string;
  label: string;
  total: number;
  profit: number;
  liters: number;
}

interface DashboardData {
  last7Days: DailyData[];
  expenseTrend: { date: string; label: string; amount: number; count: number }[];
}

export function SalesVsExpensesChart({ station }: { station?: Station | null }) {
  const { t } = useLanguage();
  const symbol = station?.currencySymbol || "؋";

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/gas-station/dashboard");
      return res.json();
    },
  });

  if (isLoading || !data) {
    return (
      <Card className="border-border/60">
        <CardContent className="p-5">
          <Skeleton className="h-48" />
        </CardContent>
      </Card>
    );
  }

  // Merge sales and expenses by date label
  const expenseMap = new Map<string, number>();
  for (const e of data.expenseTrend) {
    expenseMap.set(e.label, e.amount);
  }

  const chartData = data.last7Days.map((d) => ({
    label: d.label,
    sales: d.total,
    expenses: expenseMap.get(d.label) || 0,
    net: d.total - (expenseMap.get(d.label) || 0),
  }));

  const totalSales = chartData.reduce((sum, d) => sum + d.sales, 0);
  const totalExpenses = chartData.reduce((sum, d) => sum + d.expenses, 0);
  const netResult = totalSales - totalExpenses;
  const isProfit = netResult >= 0;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-4 w-4 text-primary" />
            {t("salesVsExpenses")}
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(
              "num gap-1",
              isProfit
                ? "border-emerald-400 text-emerald-600 dark:text-emerald-400"
                : "border-rose-400 text-rose-600 dark:text-rose-400"
            )}
          >
            {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isProfit ? t("profit") : t("loss")}: {formatCurrency(Math.abs(netResult), symbol)}
          </Badge>
        </div>
        <CardDescription className="text-xs">{t("comparison")} • 7 {t("days")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
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
                name === "sales" ? t("sales") : name === "expenses" ? t("expenses") : t("netResult"),
              ]}
            />
            <Legend
              formatter={(value) => (
                <span className="text-xs">
                  {value === "sales" ? t("sales") : value === "expenses" ? t("expenses") : t("netResult")}
                </span>
              )}
            />
            <Bar dataKey="sales" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>

        {/* Summary stats */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/30">
            <p className="text-[10px] text-muted-foreground">{t("sales")}</p>
            <p className="text-sm font-bold num text-emerald-600 dark:text-emerald-400">{formatCurrency(totalSales, symbol)}</p>
          </div>
          <div className="rounded-lg bg-rose-50 p-2 dark:bg-rose-950/30">
            <p className="text-[10px] text-muted-foreground">{t("expenses")}</p>
            <p className="text-sm font-bold num text-rose-600 dark:text-rose-400">{formatCurrency(totalExpenses, symbol)}</p>
          </div>
          <div className={cn(
            "rounded-lg p-2",
            isProfit ? "bg-primary/10" : "bg-rose-50 dark:bg-rose-950/30"
          )}>
            <p className="text-[10px] text-muted-foreground">{t("netResult")}</p>
            <p className={cn(
              "text-sm font-bold num",
              isProfit ? "text-primary" : "text-rose-600 dark:text-rose-400"
            )}>
              {isProfit ? "+" : ""}{formatCurrency(netResult, symbol)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
