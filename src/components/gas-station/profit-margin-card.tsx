"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Percent, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "./hooks";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FuelType, Station } from "@/lib/types";

interface FuelPriceHistory {
  fuelTypeId: string;
  name: string;
  nameDa: string | null;
  namePs: string | null;
  color: string;
  currentPrice: number;
  currentCost: number;
  history: { date: string; price: number; cost: number }[];
}

export function ProfitMarginCard({ station }: { station?: Station | null }) {
  const { t, language } = useLanguage();
  const symbol = station?.currencySymbol || "؋";

  const { data: fuelTypes } = useQuery<FuelType[]>({
    queryKey: ["fuel-types"],
    queryFn: async () => {
      const res = await fetch("/api/gas-station/fuel-types");
      return res.json();
    },
  });

  const fuelName = (ft: { name: string; nameDa: string | null; namePs: string | null }) => {
    if (language === "da") return ft.nameDa || ft.name;
    if (language === "ps") return ft.namePs || ft.name;
    return ft.name;
  };

  if (!fuelTypes || fuelTypes.length === 0) {
    return (
      <Card className="border-border/60">
        <CardContent className="p-5">
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  const totalProfitPerL = fuelTypes.reduce((sum, ft) => sum + (ft.price - ft.cost), 0);
  const avgMargin = fuelTypes.length > 0
    ? (fuelTypes.reduce((sum, ft) => sum + (ft.price > 0 ? ((ft.price - ft.cost) / ft.price) * 100 : 0), 0) / fuelTypes.length)
    : 0;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Percent className="h-4 w-4 text-primary" />
            {t("profitMargin")}
          </CardTitle>
          <Badge variant="outline" className="num">
            {t("avg")}: {avgMargin.toFixed(1)}%
          </Badge>
        </div>
        <CardDescription className="text-xs">{t("margin")} {t("perLiter")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {fuelTypes.map((ft) => {
            const margin = ft.price - ft.cost;
            const marginPct = ft.price > 0 ? (margin / ft.price) * 100 : 0;
            const isLowMargin = marginPct < 8;
            const isGoodMargin = marginPct >= 12;
            return (
              <div key={ft.id} className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: ft.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="truncate text-sm font-medium">{fuelName(ft)}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold num text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(margin, symbol)}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs num",
                          isGoodMargin && "border-emerald-400 text-emerald-600 dark:text-emerald-400",
                          isLowMargin && "border-rose-400 text-rose-600 dark:text-rose-400"
                        )}
                      >
                        {marginPct.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground num">
                    <span>{t("sellingPrice")}: {formatCurrency(ft.price, symbol)}</span>
                    <span>•</span>
                    <span>{t("costPrice")}: {formatCurrency(ft.cost, symbol)}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isGoodMargin ? "bg-emerald-500" : isLowMargin ? "bg-rose-500" : "bg-amber-500"
                      )}
                      style={{ width: `${Math.min(100, marginPct * 3)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
