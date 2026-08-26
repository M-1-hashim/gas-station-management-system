"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings as SettingsIcon, Save, Building2, Globe, Palette, Fuel, Database, Download, Upload, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useLanguage } from "../hooks";
import { languages } from "@/lib/i18n/translations";
import type { Station } from "@/lib/types";

export function SettingsModule() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const qc = useQueryClient();

  const { data: station } = useQuery<Station>({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/gas-station/settings");
      return res.json();
    },
  });

  const [form, setForm] = useState<Record<string, string>>({
    name: "", nameDa: "", namePs: "", owner: "", phone: "", address: "",
    currency: "AFN", currencySymbol: "؋",
  });
  const [loadedId, setLoadedId] = useState<string | null>(null);

  if (station && station.id !== loadedId) {
    setLoadedId(station.id);
    setForm({
      name: station.name || "",
      nameDa: station.nameDa || "",
      namePs: station.namePs || "",
      owner: station.owner || "",
      phone: station.phone || "",
      address: station.address || "",
      currency: station.currency || "AFN",
      currencySymbol: station.currencySymbol || "؋",
    });
  }

  const saveMut = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/gas-station/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      toast.success(t("savedSuccessfully"));
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => toast.error(t("errorOccurred")),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMut.mutate(form);
  };

  const exportBackup = async () => {
    try {
      const [station, fuelTypes, tanks, pumps, sales, customers, expenses, staff, shifts, products, refills] = await Promise.all([
        fetch("/api/gas-station/settings").then((r) => r.json()),
        fetch("/api/gas-station/fuel-types").then((r) => r.json()),
        fetch("/api/gas-station/tanks").then((r) => r.json()),
        fetch("/api/gas-station/pumps").then((r) => r.json()),
        fetch("/api/gas-station/sales").then((r) => r.json()),
        fetch("/api/gas-station/customers").then((r) => r.json()),
        fetch("/api/gas-station/expenses").then((r) => r.json()),
        fetch("/api/gas-station/staff").then((r) => r.json()),
        fetch("/api/gas-station/shifts").then((r) => r.json()),
        fetch("/api/gas-station/products").then((r) => r.json()),
        fetch("/api/gas-station/refills").then((r) => r.json()),
      ]);
      const backup = { station, fuelTypes, tanks, pumps, sales, customers, expenses, staff, shifts, products, refills, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gas-station-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup exported");
    } catch {
      toast.error(t("errorOccurred"));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Station Info */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" />
            {t("stationInfo")}
          </CardTitle>
          <CardDescription>{t("manageYourStation")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("stationName")} (EN)</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Fuel Station" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("stationName")} (دری)</Label>
                <Input value={form.nameDa} onChange={(e) => setForm({ ...form, nameDa: e.target.value })} placeholder="تانک تیل" dir="rtl" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("stationName")} (پښتو)</Label>
                <Input value={form.namePs} onChange={(e) => setForm({ ...form, namePs: e.target.value })} placeholder="د تیلو ټانک" dir="rtl" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("owner")}</Label>
                <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("phone")}</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0700123456" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("address")}</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("currency")}</Label>
                <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="AFN" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("currencySymbol")}</Label>
                <Input value={form.currencySymbol} onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })} placeholder="؋" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saveMut.isPending} className="gap-2">
                <Save className="h-4 w-4" /> {t("saveSettings")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Language & Theme */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-primary" />
              {t("language")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`flex w-full items-center justify-between rounded-lg border p-3 text-start transition-colors ${
                  language === lang.code ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div>
                    <p className="font-medium">{lang.nativeName}</p>
                    <p className="text-xs text-muted-foreground">{lang.name} • {lang.dir.toUpperCase()}</p>
                  </div>
                </div>
                {language === lang.code && <Badge>{t("active")}</Badge>}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 text-primary" />
              {t("theme")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              onClick={() => setTheme("light")}
              className={`flex w-full items-center justify-between rounded-lg border p-3 transition-colors ${
                theme === "light" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              }`}
            >
              <span className="font-medium">☀️ {t("lightMode")}</span>
              {theme === "light" && <Badge>{t("active")}</Badge>}
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex w-full items-center justify-between rounded-lg border p-3 transition-colors ${
                theme === "dark" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              }`}
            >
              <span className="font-medium">🌙 {t("darkMode")}</span>
              {theme === "dark" && <Badge>{t("active")}</Badge>}
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Data Management */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-primary" />
            Data Management
          </CardTitle>
          <CardDescription>Backup and restore your station data (Offline Mode)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Export Backup</p>
                <p className="text-xs text-muted-foreground">Download all data as JSON file</p>
              </div>
            </div>
            <Button variant="outline" onClick={exportBackup} className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-sm">
                <p className="font-medium text-amber-700 dark:text-amber-400">Offline System</p>
                <p className="mt-1 text-amber-600 dark:text-amber-500">
                  This system works completely offline. All data is stored locally on this computer. Make regular backups to avoid data loss.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border/50 p-3 text-center">
              <Fuel className="mx-auto mb-1 h-5 w-5 text-primary" />
              <p className="text-xs text-muted-foreground">{t("fuelTypes")}</p>
            </div>
            <div className="rounded-lg border border-border/50 p-3 text-center">
              <Building2 className="mx-auto mb-1 h-5 w-5 text-primary" />
              <p className="text-xs text-muted-foreground">{t("tanks")}</p>
            </div>
            <div className="rounded-lg border border-border/50 p-3 text-center">
              <Database className="mx-auto mb-1 h-5 w-5 text-primary" />
              <p className="text-xs text-muted-foreground">SQLite</p>
            </div>
            <div className="rounded-lg border border-border/50 p-3 text-center">
              <Globe className="mx-auto mb-1 h-5 w-5 text-primary" />
              <p className="text-xs text-muted-foreground">3 {t("language")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
