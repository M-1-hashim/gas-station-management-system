"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  color?: "primary" | "amber" | "rose" | "violet" | "blue" | "emerald";
  onClick?: () => void;
}

const colorClasses = {
  primary: "bg-primary/10 text-primary",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
  blue: "bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = "primary", onClick }: StatCardProps) {
  return (
    <Card
      className={cn(
        "card-hover overflow-hidden border-border/60",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight num">{value}</p>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
            {trend && (
              <p
                className={cn(
                  "mt-2 inline-flex items-center gap-1 text-xs font-medium",
                  trend.positive ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {trend.positive ? "▲" : "▼"} <span className="num">{trend.value}</span>
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              colorClasses[color]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
