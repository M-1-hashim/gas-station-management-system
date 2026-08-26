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
  User,
  Phone,
  MapPin,
  Receipt,
  Wallet,
  TrendingUp,
  Droplet,
  CreditCard,
  Calendar,
  Banknote,
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
import { formatCurrency, formatLiters, formatDateTime, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CustomerDetail, Station } from "@/lib/types";

interface CustomerDetailDialogProps {
  customerId: string | null;
  station: Station | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailDialog({ customerId, station, open, onOpenChange }: CustomerDetailDialogProps) {
  const { t, language } = useLanguage();
  const symbol = station?.currencySymbol || "؋";

  const { data, isLoading } = useQuery<CustomerDetail>({
    queryKey: ["customer-detail", customerId],
    queryFn: async () => {
      const res = await fetch(`/api/gas-station/customer-detail/${customerId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!customerId && open,
  });

  const fuelName = (ft: { name: string; nameDa: string | null; namePs: string | null }) => {
    if (language === "da") return ft.nameDa || ft.name;
    if (language === "ps") return ft.namePs || ft.name;
    return ft.name;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden max-h-[90vh]">
        <DialogTitle className="sr-only">{t("customerDetails")}</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-primary to-emerald-600 px-5 py-4 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">{t("customerProfile")}</h2>
              <p className="text-xs opacity-90">{data?.customer.name || ""}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isLoading || !data ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-2">{t("loading")}</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[calc(90vh-72px)]">
            <div className="p-5 space-y-4">
              {/* Customer Info + Balance Banner */}
              <div className={cn(
                "rounded-xl border-2 p-4 flex items-center justify-between",
                data.customer.balance > 0
                  ? "border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
                  : "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
              )}>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold">
                    {data.customer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{data.customer.name}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      {data.customer.phone && (
                        <span className="flex items-center gap-1" dir="ltr">
                          <Phone className="h-3 w-3" /> {data.customer.phone}
                        </span>
                      )}
                      {data.customer.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {data.customer.address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <p className="text-xs text-muted-foreground">{t("outstandingBalance")}</p>
                  <p className={cn(
                    "text-2xl font-bold num",
                    data.customer.balance > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                  )}>
                    {formatCurrency(data.customer.balance, symbol)}
                  </p>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Card className="border-border/60">
                  <CardContent className="p-4">
                    <Receipt className="h-4 w-4 text-primary" />
                    <p className="mt-2 text-xs text-muted-foreground">{t("totalSales")}</p>
                    <p className="text-lg font-bold num">{formatCurrency(data.summary.totalSales, symbol)}</p>
                    <p className="text-[10px] text-muted-foreground num">{data.summary.saleCount} {t("sales")}</p>
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
                    <Banknote className="h-4 w-4 text-emerald-600" />
                    <p className="mt-2 text-xs text-muted-foreground">{t("totalPaid")}</p>
                    <p className="text-lg font-bold num text-emerald-600 dark:text-emerald-400">{formatCurrency(data.summary.totalPaid, symbol)}</p>
                  </CardContent>
                </Card>
                <Card className="border-border/60">
                  <CardContent className="p-4">
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                    <p className="mt-2 text-xs text-muted-foreground">{t("avgSaleValue")}</p>
                    <p className="text-lg font-bold num">{formatCurrency(data.summary.avgSaleValue, symbol)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Payment breakdown + Monthly chart */}
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
                        <p className="font-bold num text-emerald-600 dark:text-emerald-400">{formatCurrency(data.summary.cashTotal, symbol)}</p>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-sm font-medium">{t("credit")}</span>
                        </div>
                        <p className="font-bold num text-amber-600 dark:text-amber-400">{formatCurrency(data.summary.creditTotal, symbol)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold mb-3">{t("monthlyActivity")}</h3>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={data.monthlyActivity} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "11px" }}
                          formatter={(value: number) => [formatCurrency(value, symbol), t("totalSales")]}
                        />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={32}>
                          {data.monthlyActivity.map((_, i) => (
                            <Cell key={i} fill="var(--primary)" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Sales by fuel type */}
              {data.salesByFuelType.length > 0 && (
                <Card className="border-border/60">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold mb-3">{t("salesByFuelType")}</h3>
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
              )}

              {/* Recent Sales */}
              <Card className="border-border/60">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-3">{t("salesHistory")}</h3>
                  {data.sales.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">{t("noSalesHistory")}</p>
                  ) : (
                    <ScrollArea className="max-h-[300px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-card z-10">
                          <TableRow>
                            <TableHead>{t("date")}</TableHead>
                            <TableHead>{t("fuelType")}</TableHead>
                            <TableHead className="text-end">{t("liters")}</TableHead>
                            <TableHead className="text-end">{t("total")}</TableHead>
                            <TableHead>{t("paymentType")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.sales.map((sale) => (
                            <TableRow key={sale.id} className="hover:bg-muted/50">
                              <TableCell className="text-xs num whitespace-nowrap">{formatDateTime(sale.date)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sale.fuelType.color }} />
                                  <span className="text-sm">{fuelName(sale.fuelType)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-end num text-sm">{formatLiters(sale.liters)}</TableCell>
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
                  )}
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card className="border-border/60">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-3">{t("paymentHistory")}</h3>
                  {data.payments.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">{t("noPayments")}</p>
                  ) : (
                    <ScrollArea className="max-h-[200px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-card z-10">
                          <TableRow>
                            <TableHead>{t("date")}</TableHead>
                            <TableHead className="text-end">{t("amount")}</TableHead>
                            <TableHead>{t("method")}</TableHead>
                            <TableHead>{t("note")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.payments.map((p) => (
                            <TableRow key={p.id} className="hover:bg-muted/50">
                              <TableCell className="text-xs num whitespace-nowrap">{formatDate(p.date)}</TableCell>
                              <TableCell className="text-end num font-medium text-emerald-600 dark:text-emerald-400">
                                +{formatCurrency(p.amount, symbol)}
                              </TableCell>
                              <TableCell className="text-sm">{p.method}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{p.note || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
