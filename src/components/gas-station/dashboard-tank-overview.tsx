"use client";

import { useQuery } from "@tanstack/react-query";
import { Cylinder, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "./hooks";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Tank, FuelType, Station } from "@/lib/types";

interface DashboardData {
  tanks: (Tank & { fuelType: FuelType })[];
  lowStockTanks: Tank[];
}

export function DashboardTankOverview({ station }: { station?: Station | null }) {
  const { t, language } = useLanguage();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/gas-station/dashboard");
      return res.json();
    },
  });

  const fuelName = (ft: FuelType) => {
    if (language === "da") return ft.nameDa || ft.name;
    if (language === "ps") return ft.namePs || ft.name;
    return ft.name;
  };

  if (isLoading || !data) {
    return (
      <Card className="border-border/60">
        <CardContent className="p-5">
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  const tanks = data.tanks;
  const lowCount = data.lowStockTanks.length;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Cylinder className="h-4 w-4 text-primary" />
            {t("tankLevels")}
          </CardTitle>
          {lowCount > 0 && (
            <Badge variant="destructive" className="pulse-warning gap-1">
              <AlertTriangle className="h-3 w-3" />
              {lowCount} {t("lowStockAlerts")}
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">{t("fillPercentage")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {tanks.map((tank) => {
            const pct = Math.min(100, (tank.currentLevel / tank.capacity) * 100);
            const isLow = tank.currentLevel <= tank.minLevel;
            const isCritical = tank.currentLevel <= tank.minLevel * 0.5;
            const gaugeColor = isCritical ? "#ef4444" : isLow ? "#f59e0b" : tank.fuelType.color;
            const radius = 28;
            const strokeWidth = 5;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (pct / 100) * circumference;

            return (
              <div
                key={tank.id}
                className={cn(
                  "flex flex-col items-center rounded-lg border p-3 transition-colors",
                  isLow ? "border-rose-300 dark:border-rose-900" : "border-border/50 hover:border-primary/40"
                )}
              >
                {/* Mini circular gauge */}
                <div className="relative inline-flex items-center justify-center" style={{ width: 64, height: 64 }}>
                  <svg width={64} height={64} className="-rotate-90 transform">
                    <circle cx={32} cy={32} r={radius} fill="none" stroke="var(--muted)" strokeWidth={strokeWidth} opacity={0.3} />
                    <circle
                      cx={32}
                      cy={32}
                      r={radius}
                      fill="none"
                      stroke={gaugeColor}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
                    />
                  </svg>
                  <span className={cn(
                    "absolute text-xs font-bold num",
                    isCritical && "text-rose-600 dark:text-rose-400",
                    isLow && !isCritical && "text-amber-600 dark:text-amber-400",
                    !isLow && "text-foreground"
                  )}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
                {/* Tank info */}
                <p className="mt-1 truncate text-xs font-medium" title={tank.name}>{tank.name}</p>
                <p className="text-[10px] text-muted-foreground num">
                  {formatNumber(tank.currentLevel, 0)} / {formatNumber(tank.capacity, 0)} L
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
