"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/gas-station/app-shell";
import type { Station } from "@/lib/types";

export default function Home() {
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        // Load station settings
        const res = await fetch("/api/gas-station/settings");
        const data = await res.json();
        setStation(data);

        // Check if fuel types exist; if not, seed initial data
        const ftRes = await fetch("/api/gas-station/fuel-types");
        const fuelTypes = await ftRes.json();
        if (!fuelTypes || fuelTypes.length === 0) {
          await fetch("/api/gas-station/seed", { method: "POST" });
          const res2 = await fetch("/api/gas-station/settings");
          const data2 = await res2.json();
          setStation(data2);
        }
      } catch (e) {
        console.error("Init error:", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading Fuel Station Manager...</p>
          <p className="text-xs text-muted-foreground">سیستم مدیریت تانک تیل</p>
        </div>
      </div>
    );
  }

  return <AppShell station={station} />;
}
