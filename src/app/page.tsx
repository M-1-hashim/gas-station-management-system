"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/gas-station/app-shell";
import type { Station } from "@/lib/types";

export default function Home() {
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let retries = 0;
    async function init() {
      try {
        // Try to load station settings with retry
        let res = await fetch("/api/gas-station/settings");
        
        // Retry up to 5 times if server isn't ready yet
        while (!res.ok && retries < 5) {
          retries++;
          await new Promise((r) => setTimeout(r, 1000));
          res = await fetch("/api/gas-station/settings");
        }

        if (!res.ok) {
          setError("Failed to connect to server");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setStation(data);

        // Check if fuel types exist; if not, seed initial data
        const ftRes = await fetch("/api/gas-station/fuel-types");
        if (ftRes.ok) {
          const fuelTypes = await ftRes.json();
          if (!fuelTypes || fuelTypes.length === 0) {
            console.log("No fuel types found, seeding data...");
            await fetch("/api/gas-station/seed", { method: "POST" });
            // Also seed some history for charts
            await fetch("/api/gas-station/seed-history", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ days: 7, salesPerDay: 8 }),
            });
            const res2 = await fetch("/api/gas-station/settings");
            if (res2.ok) {
              const data2 = await res2.json();
              setStation(data2);
            }
          }
        }
      } catch (e) {
        console.error("Init error:", e);
        setError("Connection error - retrying...");
        // Retry after 3 seconds
        setTimeout(() => {
          retries = 0;
          init();
        }, 3000);
        return;
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

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Retry / تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return <AppShell station={station} />;
}
