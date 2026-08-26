"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, TrendingUp, Pencil, Check } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLanguage } from "./hooks";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface DailyTargetData {
  target: number;
  todayTotal: number;
  todayLiters: number;
  progress: number;
  remaining: number;
  isAchieved: boolean;
  yesterdayTotal: number;
  projectedTotal: number;
  saleCount: number;
}

export function DailyTargetCard({ station }: { station?: { dailyTarget?: number } | null }) {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [targetInput, setTargetInput] = useState("");
  const [prevEditing, setPrevEditing] = useState(false);

  const { data, isLoading } = useQuery<DailyTargetData>({
    queryKey: ["daily-target"],
    queryFn: async () => {
      const res = await fetch("/api/gas-station/daily-target");
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const updateTargetMut = useMutation({
    mutationFn: async (target: number) => {
      const res = await fetch("/api/gas-station/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "تانک تیل",
          currency: "AFN",
          currencySymbol: "؋",
          dailyTarget: target,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-target"] });
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success(t("priceChanged"));
      setEditing(false);
    },
  });

  const symbol = "؋";

  const handleSaveTarget = () => {
    const val = parseFloat(targetInput);
    if (isNaN(val) || val <= 0) {
      toast.error("Invalid target");
      return;
    }
    updateTargetMut.mutate(val);
  };

  const startEdit = () => {
    setTargetInput(String(data?.target || 50000));
    setEditing(true);
  };

  if (isLoading || !data) {
    return (
      <Card className="border-border/60">
        <CardContent className="p-5 h-40 animate-pulse bg-muted/30 rounded-xl" />
      </Card>
    );
  }

  const progress = data.progress;
  const isOnTrack = data.projectedTotal >= data.target;
  const vsYesterday = data.yesterdayTotal > 0
    ? ((data.todayTotal - data.yesterdayTotal) / data.yesterdayTotal) * 100
    : 100;

  return (
    <Card className={cn(
      "border-2 overflow-hidden",
      data.isAchieved
        ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-transparent dark:border-emerald-800 dark:from-emerald-950/30"
        : "border-border/60"
    )}>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              data.isAchieved ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" : "bg-primary/10 text-primary"
            )}>
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t("dailyTarget")}</h3>
              <p className="text-xs text-muted-foreground">{t("todayProgress")}</p>
            </div>
          </div>
          {!editing && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startEdit} title={t("setTarget")}>
              <Pencil className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Edit mode */}
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              className="num"
              dir="ltr"
              autoFocus
            />
            <Button size="icon" className="h-9 w-9" onClick={handleSaveTarget} disabled={updateTargetMut.isPending}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-bold num">{formatCurrency(data.todayTotal, symbol)}</span>
                <span className="text-sm text-muted-foreground num">/ {formatCurrency(data.target, symbol)}</span>
              </div>
              <Progress
                value={progress}
                className={cn(
                  "h-3",
                  data.isAchieved && "[&>div]:bg-emerald-500",
                  !data.isAchieved && !isOnTrack && "[&>div]:bg-amber-500"
                )}
              />
              <div className="flex items-center justify-between text-xs">
                <span className="num font-medium">{progress.toFixed(1)}%</span>
                {data.isAchieved ? (
                  <Badge className="bg-emerald-600 gap-1">
                    <Check className="h-3 w-3" /> {t("targetAchieved")}
                  </Badge>
                ) : (
                  <span className={cn(
                    "num font-medium",
                    isOnTrack ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                  )}>
                    {t("remaining")}: {formatCurrency(data.remaining, symbol)}
                  </span>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-[10px] text-muted-foreground">{t("projectedToday")}</p>
                <p className={cn(
                  "text-sm font-bold num",
                  data.projectedTotal >= data.target ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                )}>
                  {formatCurrency(data.projectedTotal, symbol)}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-[10px] text-muted-foreground">{t("yesterday")}</p>
                <p className="text-sm font-bold num">{formatCurrency(data.yesterdayTotal, symbol)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-[10px] text-muted-foreground">{t("sales")}</p>
                <p className="text-sm font-bold num">{data.saleCount}</p>
              </div>
            </div>

            {/* Trend indicator */}
            {vsYesterday !== 0 && (
              <div className="mt-2 flex items-center justify-center gap-1 text-xs">
                <TrendingUp className={cn("h-3 w-3", vsYesterday >= 0 ? "text-emerald-600" : "text-rose-600 rotate-180")} />
                <span className={cn("num font-medium", vsYesterday >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                  {vsYesterday >= 0 ? "+" : ""}{vsYesterday.toFixed(1)}%
                </span>
                <span className="text-muted-foreground">{t("comparedToLastWeek")}</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
