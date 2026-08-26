"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  Cylinder,
  Package,
  Users,
  Clock,
  X,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useLanguage } from "./hooks";
import type { ViewKey } from "@/lib/types";

interface Alert {
  id: string;
  type: "critical" | "warning" | "info";
  category: "tank" | "product" | "credit" | "shift";
  title: string;
  titleDa: string;
  titlePs: string;
  message: string;
  messageDa: string;
  messagePs: string;
  action?: string;
  entityId?: string;
}

interface AlertsData {
  alerts: Alert[];
  counts: { total: number; critical: number; warning: number; info: number };
}

const categoryIcons = {
  tank: Cylinder,
  product: Package,
  credit: Users,
  shift: Clock,
};

const categoryColors = {
  tank: "text-blue-600 bg-blue-100 dark:bg-blue-950/50 dark:text-blue-400",
  product: "text-violet-600 bg-violet-100 dark:bg-violet-950/50 dark:text-violet-400",
  credit: "text-amber-600 bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400",
  shift: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400",
};

interface NotificationsDropdownProps {
  onNavigate: (view: ViewKey) => void;
}

export function NotificationsDropdown({ onNavigate }: NotificationsDropdownProps) {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery<AlertsData>({
    queryKey: ["alerts"],
    queryFn: async () => {
      const res = await fetch("/api/gas-station/alerts");
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [open]);

  const alertTitle = (a: Alert) => {
    if (language === "da") return a.titleDa;
    if (language === "ps") return a.titlePs;
    return a.title;
  };
  const alertMessage = (a: Alert) => {
    if (language === "da") return a.messageDa;
    if (language === "ps") return a.messagePs;
    return a.message;
  };

  const handleAlertClick = (a: Alert) => {
    setOpen(false);
    if (a.action) {
      onNavigate(a.action as ViewKey);
    }
  };

  const counts = data?.counts;
  const hasAlerts = (counts?.total || 0) > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        className="relative h-9 w-9"
        title={t("alerts")}
        aria-label={t("alerts")}
      >
        <Bell className="h-4 w-4" />
        {hasAlerts && (
          <span
            className={cn(
              "absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white",
              counts!.critical > 0 ? "bg-rose-500 pulse-warning" : "bg-amber-500"
            )}
          >
            {counts!.total > 9 ? "9+" : counts!.total}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute end-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-popover shadow-xl z-50 animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">{t("alerts")}</h3>
              {hasAlerts && (
                <Badge variant="outline" className="text-xs num">
                  {counts!.total}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Alert counts summary */}
          {hasAlerts && (
            <div className="flex gap-2 border-b border-border px-4 py-2 bg-muted/30">
              {counts!.critical > 0 && (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  {counts!.critical} {t("critical")}
                </Badge>
              )}
              {counts!.warning > 0 && (
                <Badge variant="outline" className="gap-1 text-xs border-amber-400 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  {counts!.warning} {t("warning")}
                </Badge>
              )}
            </div>
          )}

          {/* Alert list */}
          <ScrollArea className="max-h-[400px]">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : !hasAlerts ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                <p className="text-sm font-medium">{t("allClear")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("noAlerts")}</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {data!.alerts.map((alert) => {
                  const Icon = categoryIcons[alert.category];
                  const isCritical = alert.type === "critical";
                  return (
                    <button
                      key={alert.id}
                      onClick={() => handleAlertClick(alert)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg p-3 text-start transition-colors",
                        isCritical
                          ? "hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          categoryColors[alert.category]
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{alertTitle(alert)}</p>
                          {isCritical && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500 pulse-warning" />
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground num">
                          {alertMessage(alert)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {hasAlerts && (
            <div className="border-t border-border px-4 py-2 bg-card">
              <p className="text-[10px] text-center text-muted-foreground">
                {t("alertsRefreshAuto")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
