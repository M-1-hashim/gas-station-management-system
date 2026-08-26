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
  Cell,
} from "recharts";
import {
  X,
  Printer,
  Clock,
  TrendingUp,
  Wallet,
  Banknote,
  CreditCard,
  Droplet,
  Receipt,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "./hooks";
import { formatCurrency, formatLiters, formatDateTime, formatNumber, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ShiftSummary, Station } from "@/lib/types";

interface ShiftSummaryDialogProps {
  shiftId: string | null;
  station: Station | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShiftSummaryDialog({ shiftId, station, open, onOpenChange }: ShiftSummaryDialogProps) {
  const { t, language } = useLanguage();
  const symbol = station?.currencySymbol || "؋";

  const { data, isLoading } = useQuery<ShiftSummary>({
    queryKey: ["shift-summary", shiftId],
    queryFn: async () => {
      const res = await fetch(`/api/gas-station/shifts/${shiftId}/summary`);
      if (!res.ok) throw new Error("Failed to load shift summary");
      return res.json();
    },
    enabled: !!shiftId && open,
  });

  const fuelName = (ft: { name: string; nameDa: string | null; namePs: string | null }) => {
    if (language === "da") return ft.nameDa || ft.name;
    if (language === "ps") return ft.namePs || ft.name;
    return ft.name;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden no-print max-h-[90vh]">
        <DialogTitle className="sr-only">{t("shiftSummary")}</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-primary to-emerald-600 px-5 py-4 text-primary-foreground no-print">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">{t("shiftSummary")}</h2>
              <p className="text-xs opacity-90">
                {data?.shift.staff.name} • {data && formatDateTime(data.shift.startTime)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handlePrint} className="gap-2 text-primary-foreground hover:bg-white/20">
              <Printer className="h-4 w-4" /> <span className="hidden sm:inline">{t("printShiftReport")}</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading || !data ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-2">{t("loading")}</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[calc(90vh-72px)]">
            <div className="p-5 space-y-4">
              {/* Status Banner */}
              <div className={cn(
                "flex items-center justify-between rounded-xl border-2 p-4",
                data.shift.status === "open"
                  ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                  : "border-border bg-muted/30"
              )}>
                <div className="flex items-center gap-3">
                  {data.shift.status === "open" ? (
                    <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {data.shift.status === "open" ? t("shiftActive") : t("shiftClosed")}
                    </p>
                    <p className="text-xs text-muted-foreground num">
                      {t("duration")}: {data.summary.durationHours} {t("hours")}
                    </p>
                  </div>
                </div>
                <Badge variant={data.shift.status === "open" ? "default" : "secondary"}>
                  {data.shift.status === "open" ? t("open") : t("closed")}
                </Badge>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Card className="border-border/60">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <Receipt className="h-4 w-4 text-primary" />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{t("totalSales")}</p>
                    <p className="text-lg font-bold num">{formatCurrency(data.summary.totalSales, symbol)}</p>
                    <p className="text-[10px] text-muted-foreground num">{data.summary.saleCount} {t("sales")}</p>
                  </CardContent>
                </Card>
                <Card className="border-border/60">
                  <CardContent className="p-4">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <p className="mt-2 text-xs text-muted-foreground">{t("netProfit")}</p>
                    <p className="text-lg font-bold num text-emerald-600 dark:text-emerald-400">{formatCurrency(data.summary.totalProfit, symbol)}</p>
                  </CardContent>
                </Card>
                <Card className="border-border/60">
                  <CardContent className="p-4">
                    <Droplet className="h-4 w-4 text-primary" />
                    <p className="mt-2 text-xs text-muted-foreground">{t("totalLiters")}</p>
                    <p className="text-lg font-bold num">{formatLiters(data.summary.totalLiters)}</p>
                  </CardContent>
                </Card>
                <Card className="border-border/60">
                  <CardContent className="p-4">
                    <Wallet className="h-4 w-4 text-rose-600" />
                    <p className="mt-2 text-xs text-muted-foreground">{t("totalExpenses")}</p>
                    <p className="text-lg font-bold num text-rose-600 dark:text-rose-400">{formatCurrency(data.summary.totalExpenses, symbol)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Cash Reconciliation - Key Feature */}
              <Card className={cn(
                "border-2",
                data.summary.cashDifference === 0
                  ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
                  : data.summary.cashDifference > 0
                  ? "border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
                  : "border-rose-300 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/20"
              )}>
                <CardContent className="p-5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold mb-4">
                    <Banknote className="h-4 w-4 text-primary" />
                    {t("reconciliation")}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">{t("openingCash")}</p>
                      <p className="mt-1 text-lg font-bold num">{formatCurrency(data.shift.openingCash, symbol)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">{t("cash")}</p>
                      <p className="mt-1 text-lg font-bold num text-emerald-600 dark:text-emerald-400">+{formatCurrency(data.summary.cashTotal, symbol)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">{t("actualCash")}</p>
                      <p className="mt-1 text-lg font-bold num">
                        {data.shift.closingCash != null ? formatCurrency(data.shift.closingCash, symbol) : "—"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">{t("cashDifference")}</p>
                      {data.shift.closingCash == null ? (
                        <p className="mt-1 text-lg font-bold text-muted-foreground">—</p>
                      ) : data.summary.cashDifference === 0 ? (
                        <div className="mt-1 flex flex-col items-center">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t("balanced")}</p>
                        </div>
                      ) : (
                        <p className={cn(
                          "mt-1 text-lg font-bold num flex items-center justify-center gap-1",
                          data.summary.cashDifference > 0 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                        )}>
                          {data.summary.cashDifference > 0 ? (
                            <><AlertTriangle className="h-4 w-4" /> +{formatCurrency(data.summary.cashDifference, symbol)}</>
                          ) : (
                            <><AlertCircle className="h-4 w-4" /> {formatCurrency(Math.abs(data.summary.cashDifference), symbol)}</>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  {data.shift.closingCash == null && (
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      {t("expectedCash")}: <span className="font-bold num">{formatCurrency(data.summary.expectedCash, symbol)}</span>
                    </p>
                  )}
                  {data.shift.closingCash != null && data.summary.cashDifference > 0 && (
                    <p className="mt-3 text-center text-xs text-amber-600 dark:text-amber-400">
                      {t("cashSurplus")}: {formatCurrency(data.summary.cashDifference, symbol)}
                    </p>
                  )}
                  {data.shift.closingCash != null && data.summary.cashDifference < 0 && (
                    <p className="mt-3 text-center text-xs text-rose-600 dark:text-rose-400">
                      {t("cashShortage")}: {formatCurrency(Math.abs(data.summary.cashDifference), symbol)}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Payment breakdown + Hourly chart */}
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-border/60">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold mb-3">{t("paymentMethods")}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-sm font-medium">{t("cash")}</span>
                        </div>
                        <div className="text-end">
                          <p className="font-bold num text-emerald-600 dark:text-emerald-400">{formatCurrency(data.summary.cashTotal, symbol)}</p>
                          <p className="text-xs text-muted-foreground num">{data.summary.cashCount} {t("sales")}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-sm font-medium">{t("credit")}</span>
                        </div>
                        <div className="text-end">
                          <p className="font-bold num text-amber-600 dark:text-amber-400">{formatCurrency(data.summary.creditTotal, symbol)}</p>
                          <p className="text-xs text-muted-foreground num">{data.summary.creditCount} {t("sales")}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold mb-3">{t("hourlyActivity")}</h3>
                    {data.hourlyActivity.length === 0 ? (
                      <div className="flex h-[140px] items-center justify-center text-xs text-muted-foreground">{t("noData")}</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={data.hourlyActivity} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis
                            dataKey="hour"
                            tick={{ fontSize: 10 }}
                            stroke="var(--muted-foreground)"
                            tickFormatter={(v) => `${v}:00`}
                          />
                          <YAxis hide />
                          <Tooltip
                            contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "11px" }}
                            formatter={(value: number) => [formatCurrency(value, symbol), t("totalSales")]}
                            labelFormatter={(v) => `${v}:00`}
                          />
                          <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={28}>
                            {data.hourlyActivity.map((_, i) => (
                              <Cell key={i} fill="var(--primary)" />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sales by fuel type */}
              <Card className="border-border/60">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-3">{t("salesBreakdown")}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("fuelType")}</TableHead>
                        <TableHead className="text-end">{t("liters")}</TableHead>
                        <TableHead className="text-end">{t("total")}</TableHead>
                        <TableHead className="text-end">{t("salesCount")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.salesByFuelType.map((ft, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: ft.color }} />
                              <span className="text-sm font-medium">{fuelName(ft)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-end num">{formatLiters(ft.liters)}</TableCell>
                          <TableCell className="text-end num font-medium">{formatCurrency(ft.amount, symbol)}</TableCell>
                          <TableCell className="text-end num text-muted-foreground">{ft.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Recent sales in shift */}
              <Card className="border-border/60">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-3">{t("recentSales")}</h3>
                  <ScrollArea className="max-h-[300px]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                          <TableHead>{t("time")}</TableHead>
                          <TableHead>{t("fuelType")}</TableHead>
                          <TableHead className="text-end">{t("liters")}</TableHead>
                          <TableHead className="text-end">{t("total")}</TableHead>
                          <TableHead>{t("paymentType")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.sales.slice().reverse().map((sale) => (
                          <TableRow key={sale.id} className="hover:bg-muted/50">
                            <TableCell className="text-xs num whitespace-nowrap">{formatTime(sale.date)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sale.fuelType.color }} />
                                <span className="text-sm">{fuelName(sale.fuelType)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-end num text-sm">{formatNumber(sale.liters, 1)} L</TableCell>
                            <TableCell className="text-end num font-medium">{formatCurrency(sale.totalAmount, symbol)}</TableCell>
                            <TableCell>
                              <Badge variant={sale.paymentType === "cash" ? "secondary" : "outline"} className="text-xs">
                                {sale.paymentType === "cash" ? t("cash") : t("credit")}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
