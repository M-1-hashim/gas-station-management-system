"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, Pencil, X, Check } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useLanguage } from "./hooks";
import { formatCurrency, formatDate } from "@/lib/format";
import type { FuelType } from "@/lib/types";

interface PriceHistoryEntry {
  date: string;
  price: number;
  cost: number;
}

interface FuelPriceHistory {
  fuelTypeId: string;
  name: string;
  nameDa: string | null;
  namePs: string | null;
  color: string;
  currentPrice: number;
  currentCost: number;
  history: PriceHistoryEntry[];
}

export function PriceHistoryChart() {
  const { t, language } = useLanguage();
  const qc = useQueryClient();
  const [days, setDays] = useState(15);
  const [editOpen, setEditOpen] = useState(false);
  const [editFuel, setEditFuel] = useState<string>("");
  const [editPrice, setEditPrice] = useState("");
  const [editCost, setEditCost] = useState("");

  const { data: history } = useQuery<FuelPriceHistory[]>({
    queryKey: ["price-history", days],
    queryFn: async () => {
      const res = await fetch(`/api/gas-station/price-history?days=${days}`);
      return res.json();
    },
  });

  const { data: fuelTypes } = useQuery<FuelType[]>({
    queryKey: ["fuel-types"],
    queryFn: async () => {
      const res = await fetch("/api/gas-station/fuel-types");
      return res.json();
    },
  });

  const updatePriceMut = useMutation({
    mutationFn: async (data: { fuelTypeId: string; price: number; cost: number }) => {
      const res = await fetch("/api/gas-station/price-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["price-history"] });
      qc.invalidateQueries({ queryKey: ["fuel-types"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(t("priceChanged"));
      setEditOpen(false);
    },
  });

  const fuelName = (ft: { name: string; nameDa: string | null; namePs: string | null }) => {
    if (language === "da") return ft.nameDa || ft.name;
    if (language === "ps") return ft.namePs || ft.name;
    return ft.name;
  };

  // Build chart data: merge all fuel types' history by date
  const chartData = (() => {
    if (!history || history.length === 0) return [];
    const dateMap = new Map<string, Record<string, number>>();
    for (const ft of history) {
      for (const h of ft.history) {
        const day = h.date.split("T")[0];
        if (!dateMap.has(day)) dateMap.set(day, { date: day });
        dateMap.get(day)![ft.fuelTypeId] = h.price;
      }
    }
    return Array.from(dateMap.values()).sort((a, b) => (a.date as string).localeCompare(b.date as string));
  })();

  const handleEditSave = () => {
    const price = parseFloat(editPrice);
    const cost = parseFloat(editCost || "0");
    if (!editFuel || isNaN(price)) {
      toast.error("Invalid input");
      return;
    }
    updatePriceMut.mutate({ fuelTypeId: editFuel, price, cost });
  };

  const openEdit = (ftId: string) => {
    const ft = history?.find((h) => h.fuelTypeId === ftId);
    setEditFuel(ftId);
    setEditPrice(String(ft?.currentPrice || ""));
    setEditCost(String(ft?.currentCost || ""));
    setEditOpen(true);
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              {t("priceTrend")}
            </CardTitle>
            <CardDescription className="text-xs">{t("priceHistory")}</CardDescription>
          </div>
          <Select value={String(days)} onValueChange={(v) => setDays(parseInt(v))}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7d</SelectItem>
              <SelectItem value="15">15d</SelectItem>
              <SelectItem value="30">30d</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            {t("noData")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                stroke="var(--muted-foreground)"
                tickFormatter={(v) => String(v).slice(5)}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
                width={40}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelFormatter={(v) => formatDate(String(v))}
                formatter={(value: number, name: string) => {
                  const ft = history?.find((h) => h.fuelTypeId === name);
                  return [formatCurrency(value), ft ? fuelName(ft) : name];
                }}
              />
              {history?.map((ft) => (
                <Line
                  key={ft.fuelTypeId}
                  type="monotone"
                  dataKey={ft.fuelTypeId}
                  stroke={ft.color}
                  strokeWidth={2}
                  dot={{ fill: ft.color, r: 2 }}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* Fuel type price cards */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {history?.map((ft) => {
            const margin = ft.currentPrice - ft.currentCost;
            const marginPct = ft.currentPrice > 0 ? (margin / ft.currentPrice) * 100 : 0;
            return (
              <div
                key={ft.fuelTypeId}
                className="rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: ft.color }} />
                    <span className="truncate text-sm font-medium">{fuelName(ft)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => openEdit(ft.fuelTypeId)}
                    title={t("updatePrice")}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold num">{formatCurrency(ft.currentPrice)}</span>
                  <span className="text-xs text-muted-foreground num">{t("perLiter")}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground num">{t("costPrice")}: {formatCurrency(ft.currentCost)}</span>
                  <Badge variant="outline" className="text-xs num">
                    {t("margin")}: {marginPct.toFixed(0)}%
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Edit Price Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              {t("updatePrice")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("fuelType")}</Label>
              <Select value={editFuel} onValueChange={setEditFuel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {history?.map((ft) => (
                    <SelectItem key={ft.fuelTypeId} value={ft.fuelTypeId}>
                      {fuelName(ft)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("sellingPrice")} (؋) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  dir="ltr"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("costPrice")} (؋)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editCost}
                  onChange={(e) => setEditCost(e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>
            {editPrice && editCost && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center">
                <p className="text-xs text-muted-foreground">{t("profitMargin")}</p>
                <p className="text-lg font-bold num text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(parseFloat(editPrice) - parseFloat(editCost || "0"))}
                  <span className="text-xs font-normal text-muted-foreground"> {t("perLiter")}</span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleEditSave} disabled={updatePriceMut.isPending} className="gap-2">
              <Check className="h-4 w-4" /> {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
