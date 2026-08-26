"use client";

import { useQuery } from "@tanstack/react-query";
import { X, Printer, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { Station } from "@/lib/types";

interface CustomerStatementProps {
  customerId: string | null;
  station: Station | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StatementData {
  customer: { id: string; name: string; phone: string | null; address: string | null };
  period: { from: string; to: string };
  openingBalance: number;
  closingBalance: number;
  totalDebit: number;
  totalCredit: number;
  transactions: {
    id: string;
    date: string;
    type: "sale" | "payment";
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }[];
  summary: { saleCount: number; paymentCount: number; totalLiters: number };
}

export function CustomerStatementDialog({ customerId, station, open, onOpenChange }: CustomerStatementProps) {
  const { t } = useLanguage();
  const symbol = station?.currencySymbol || "؋";

  const { data, isLoading } = useQuery<StatementData>({
    queryKey: ["customer-statement", customerId],
    queryFn: async () => {
      const res = await fetch(`/api/gas-station/customer-statement/${customerId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!customerId && open,
  });

  const handlePrint = () => window.print();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden no-print max-h-[90vh]">
        <DialogTitle className="sr-only">{t("customerStatement")}</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-primary to-emerald-600 px-5 py-4 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">{t("customerStatement")}</h2>
              <p className="text-xs opacity-90">{data?.customer.name || ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handlePrint} className="gap-2 text-primary-foreground hover:bg-white/20">
              <Printer className="h-4 w-4" /> <span className="hidden sm:inline">{t("printStatement")}</span>
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
            <div className="p-5 space-y-4 summary-print">
              {/* Customer + Period Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">{t("customer")}</p>
                  <p className="font-semibold">{data.customer.name}</p>
                  {data.customer.phone && <p className="text-xs text-muted-foreground" dir="ltr">{data.customer.phone}</p>}
                  {data.customer.address && <p className="text-xs text-muted-foreground">{data.customer.address}</p>}
                </div>
                <div className="text-end">
                  <p className="text-xs text-muted-foreground">{t("statementReport")}</p>
                  <p className="text-xs num">{formatDate(data.period.from)} — {formatDate(data.period.to)}</p>
                  <p className="text-xs text-muted-foreground num">{data.summary.saleCount} {t("sales")} • {data.summary.paymentCount} {t("payment")}</p>
                </div>
              </div>

              {/* Balance Summary */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Card className="border-border/60">
                  <CardContent className="p-3">
                    <p className="text-[10px] text-muted-foreground">{t("openingBalance")}</p>
                    <p className="text-sm font-bold num">{formatCurrency(data.openingBalance, symbol)}</p>
                  </CardContent>
                </Card>
                <Card className="border-border/60">
                  <CardContent className="p-3">
                    <p className="text-[10px] text-muted-foreground">{t("debit")}</p>
                    <p className="text-sm font-bold num text-rose-600 dark:text-rose-400">+{formatCurrency(data.totalDebit, symbol)}</p>
                  </CardContent>
                </Card>
                <Card className="border-border/60">
                  <CardContent className="p-3">
                    <p className="text-[10px] text-muted-foreground">{t("credit")}</p>
                    <p className="text-sm font-bold num text-emerald-600 dark:text-emerald-400">-{formatCurrency(data.totalCredit, symbol)}</p>
                  </CardContent>
                </Card>
                <Card className={data.closingBalance > 0 ? "border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20" : "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"}>
                  <CardContent className="p-3">
                    <p className="text-[10px] text-muted-foreground">{t("closingBalance")}</p>
                    <p className={`text-sm font-bold num ${data.closingBalance > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {formatCurrency(data.closingBalance, symbol)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Transactions Table */}
              <Card className="border-border/60">
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[400px]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                          <TableHead>{t("date")}</TableHead>
                          <TableHead>{t("description")}</TableHead>
                          <TableHead className="text-end">{t("debit")}</TableHead>
                          <TableHead className="text-end">{t("credit")}</TableHead>
                          <TableHead className="text-end">{t("balance")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              {t("noData")}
                            </TableCell>
                          </TableRow>
                        ) : (
                          data.transactions.map((tx) => (
                            <TableRow key={tx.id} className="hover:bg-muted/50">
                              <TableCell className="text-xs num whitespace-nowrap">{formatDateTime(tx.date)}</TableCell>
                              <TableCell className="text-sm">
                                <div className="flex items-center gap-2">
                                  {tx.type === "sale" ? (
                                    <TrendingUp className="h-3 w-3 text-rose-600" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3 text-emerald-600" />
                                  )}
                                  {tx.description}
                                </div>
                              </TableCell>
                              <TableCell className="text-end num text-sm text-rose-600 dark:text-rose-400">
                                {tx.debit > 0 ? `+${formatCurrency(tx.debit, symbol)}` : "—"}
                              </TableCell>
                              <TableCell className="text-end num text-sm text-emerald-600 dark:text-emerald-400">
                                {tx.credit > 0 ? `-${formatCurrency(tx.credit, symbol)}` : "—"}
                              </TableCell>
                              <TableCell className="text-end num text-sm font-medium">
                                {formatCurrency(tx.balance, symbol)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
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
