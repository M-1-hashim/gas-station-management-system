"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Zap, X, Plus, Minus, Check, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLanguage } from "./hooks";
import { ReceiptDialog } from "./receipt-dialog";
import { formatCurrency, formatLiters } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Sale, FuelType, Customer, Shift, Station } from "@/lib/types";

interface QuickSaleFabProps {
  station: Station | null;
}

// Quick Preset buttons (common liter amounts)
const PRESETS = [5, 10, 20, 30, 40, 50, 100];

export function QuickSaleFab({ station }: QuickSaleFabProps) {
  const { t, language } = useLanguage();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const { data: fuelTypes } = useQuery<FuelType[]>({
    queryKey: ["fuel-types"],
    queryFn: async () => {
      const res = await fetch("/api/gas-station/fuel-types");
      return res.json();
    },
  });
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await fetch("/api/gas-station/customers");
      return res.json();
    },
  });
  const { data: shifts } = useQuery<Shift[]>({
    queryKey: ["shifts"],
    queryFn: async () => {
      const res = await fetch("/api/gas-station/shifts");
      return res.json();
    },
  });

  const [selectedFuel, setSelectedFuel] = useState<string>("");
  const [liters, setLiters] = useState<string>("");
  const [paymentType, setPaymentType] = useState<"cash" | "credit">("cash");
  const [customerId, setCustomerId] = useState<string>("");

  // Set default fuel type on first load (render-time, not effect)
  if (fuelTypes && fuelTypes.length > 0 && !selectedFuel) {
    setSelectedFuel(fuelTypes[0].id);
  }

  const createMut = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/gas-station/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create sale");
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["tanks"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      setLastSale(data);
      setSuccessOpen(true);
      setOpen(false);
      // Reset form
      setLiters("");
      setPaymentType("cash");
      setCustomerId("");
      toast.success(t("savedSuccessfully"));
    },
    onError: () => toast.error(t("errorOccurred")),
  });

  const selectedFt = fuelTypes?.find((f) => f.id === selectedFuel);
  const litersNum = parseFloat(liters) || 0;
  const total = litersNum * (selectedFt?.price || 0);
  const symbol = station?.currencySymbol || "؋";

  const fuelName = (ft: FuelType) => {
    if (language === "da") return ft.nameDa || ft.name;
    if (language === "ps") return ft.namePs || ft.name;
    return ft.name;
  };

  const handleSave = () => {
    if (!selectedFuel || litersNum <= 0) {
      toast.error(t("liters") + " required");
      return;
    }
    if (paymentType === "credit" && !customerId) {
      toast.error(t("selectCustomer"));
      return;
    }
    const openShift = shifts?.find((s) => s.status === "open");
    createMut.mutate({
      fuelTypeId: selectedFuel,
      liters: litersNum,
      pricePerLiter: selectedFt?.price,
      paymentType,
      customerId: customerId || null,
      shiftId: openShift?.id || null,
    });
  };

  const addLiters = (amount: number) => {
    const current = parseFloat(liters) || 0;
    setLiters(String(Math.round((current + amount) * 10) / 10));
  };

  const handleNewSale = () => {
    setSuccessOpen(false);
    setOpen(true);
  };

  return (
    <>
      {/* FAB Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="no-print fixed bottom-6 end-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-110 active:scale-95 animate-slide-in lg:bottom-8 lg:end-8"
          aria-label={t("quickSale")}
          title={t("quickSale")}
        >
          <Zap className="h-6 w-6" />
          <span className="absolute -top-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-black">
            !
          </span>
        </button>
      )}

      {/* Quick Sale Dialog - POS Style */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">{t("quickSale")}</DialogTitle>
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-primary to-emerald-600 px-5 py-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <div>
                <h2 className="text-base font-bold leading-tight">{t("quickSale")}</h2>
                <p className="text-xs opacity-90">{t("quickSaleDesc")}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Fuel Type Selector - Big Buttons */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{t("fuelType")}</p>
              <div className="grid grid-cols-3 gap-2">
                {fuelTypes?.map((ft) => (
                  <button
                    key={ft.id}
                    onClick={() => setSelectedFuel(ft.id)}
                    className={cn(
                      "relative flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all",
                      selectedFuel === ft.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/40"
                    )}
                    style={selectedFuel === ft.id ? { borderColor: ft.color, backgroundColor: `${ft.color}15` } : {}}
                  >
                    <span
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: ft.color }}
                    >
                      {fuelName(ft).charAt(0)}
                    </span>
                    <span className="text-xs font-medium truncate w-full text-center">{fuelName(ft)}</span>
                    <span className="text-[10px] num text-muted-foreground">{formatCurrency(ft.price, symbol)}/L</span>
                    {selectedFuel === ft.id && (
                      <Check className="absolute -top-1.5 -end-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Liters Input with Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground">{t("liters")}</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setLiters(String(Math.max(0, litersNum - 1)))}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => addLiters(1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Input
                type="number"
                step="0.1"
                value={liters}
                onChange={(e) => setLiters(e.target.value)}
                placeholder="0.0"
                className="text-center text-2xl font-bold h-14 num"
                dir="ltr"
                autoFocus
              />
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => addLiters(p)}
                    className="rounded-lg border border-border bg-muted/50 py-1.5 text-xs font-medium num hover:bg-primary/10 hover:border-primary/40 transition-colors"
                  >
                    +{p}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Type */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{t("paymentType")}</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setPaymentType("cash"); setCustomerId(""); }}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-medium transition-all",
                    paymentType === "cash" ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "border-border"
                  )}
                >
                  💵 {t("cash")}
                </button>
                <button
                  onClick={() => setPaymentType("credit")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-medium transition-all",
                    paymentType === "credit" ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" : "border-border"
                  )}
                >
                  📋 {t("credit")}
                </button>
              </div>
            </div>

            {/* Customer (if credit) */}
            {paymentType === "credit" && (
              <div className="animate-fade-in">
                <p className="text-xs font-medium text-muted-foreground mb-2">{t("customer")} *</p>
                <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto">
                  {customers?.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCustomerId(c.id)}
                      className={cn(
                        "flex items-center justify-between rounded-lg border p-2 text-sm transition-colors",
                        customerId === c.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      )}
                    >
                      <span className="font-medium">{c.name}</span>
                      {c.balance > 0 && (
                        <Badge variant="outline" className="text-rose-600 num">
                          {formatCurrency(c.balance, symbol)}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Total Display */}
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-emerald-500/5 p-4 text-center border border-primary/20">
              <p className="text-xs text-muted-foreground">{t("total")}</p>
              <p className="text-3xl font-bold num text-primary mt-1">{formatCurrency(total, symbol)}</p>
              {litersNum > 0 && (
                <p className="text-xs text-muted-foreground mt-1 num">
                  {formatLiters(litersNum)} × {formatCurrency(selectedFt?.price || 0, symbol)}
                </p>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 p-4 border-t bg-card">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMut.isPending || litersNum <= 0}
              className="flex-[2] gap-2"
            >
              <Check className="h-4 w-4" />
              {t("save")} • {formatCurrency(total, symbol)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success / Receipt Dialog */}
      <ReceiptDialog
        sale={lastSale}
        station={station}
        open={successOpen}
        onOpenChange={setSuccessOpen}
        onNewSale={handleNewSale}
      />
    </>
  );
}
