"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "./hooks";
import { cn } from "@/lib/utils";

interface LiveClockProps {
  className?: string;
}

export function LiveClock({ className }: LiveClockProps) {
  const { t, language } = useLanguage();
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const locale = language === "en" ? "en-GB" : "fa-IR";
  const timeStr = now.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className={cn("hidden lg:flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs", className)}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="font-medium num" dir="ltr">{timeStr}</span>
    </div>
  );
}
