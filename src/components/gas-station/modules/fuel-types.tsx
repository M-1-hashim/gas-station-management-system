"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Droplet, Fuel } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useLanguage } from "../hooks";
import { useList, useCreate, useUpdate, useDelete } from "../api-hooks";
import { formatCurrency } from "@/lib/format";
import type { FuelType } from "@/lib/types";

const colorOptions = [
  "#10b981", "#f59e0b", "#8b5cf6", "#ef4444",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316",
];

export function FuelTypesModule() {
  const { t, language } = useLanguage();
  const { data: fuelTypes, isLoading } = useList<FuelType>("fuel-types");
  const createMut = useCreate("fuel-types");
  const updateMut = useUpdate("fuel-types");
  const deleteMut = useDelete("fuel-types");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FuelType | null>(null);
  const [form, setForm] = useState({
    name: "", nameDa: "", namePs: "",
    price: "", cost: "", color: "#10b981", active: true,
  });

  const fuelName = (ft: FuelType) => {
    if (language === "da") return ft.nameDa || ft.name;
    if (language === "ps") return ft.namePs || ft.name;
    return ft.name;
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", nameDa: "", namePs: "", price: "", cost: "", color: "#10b981", active: true });
    setOpen(true);
  };

  const openEdit = (ft: FuelType) => {
    setEditing(ft);
    setForm({
      name: ft.name, nameDa: ft.nameDa || "", namePs: ft.namePs || "",
      price: String(ft.price), cost: String(ft.cost), color: ft.color, active: ft.active,
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error(t("name") + " & " + t("price") + " required");
      return;
    }
    const payload = { ...form, price: parseFloat(form.price), cost: parseFloat(form.cost || "0") };
    if (editing) {
      updateMut.mutate({ id: editing.id, ...payload }, {
        onSuccess: () => { toast.success(t("savedSuccessfully")); setOpen(false); },
      });
    } else {
      createMut.mutate(payload, {
        onSuccess: () => { toast.success(t("savedSuccessfully")); setOpen(false); },
      });
    }
  };

  const handleDelete = async (ft: FuelType) => {
    if (!confirm(t("confirmDelete"))) return;
    deleteMut.mutate(ft.id, {
      onSuccess: () => toast.success(t("deletedSuccessfully")),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{fuelTypes?.length || 0} {t("fuelTypes")}</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> {t("addFuelType")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? t("editFuelType") : t("addFuelType")}</DialogTitle>
              <DialogDescription>{t("fuelTypes")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>{t("name")} (EN)</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Petrol" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("name")} (دری)</Label>
                  <Input value={form.nameDa} onChange={(e) => setForm({ ...form, nameDa: e.target.value })} placeholder="بنزین" dir="rtl" />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("name")} (پښتو)</Label>
                  <Input value={form.namePs} onChange={(e) => setForm({ ...form, namePs: e.target.value })} placeholder="بینزین" dir="rtl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("pricePerLiter")} (؋)</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="65" />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("costPerLiter")} (؋)</Label>
                  <Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="58" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`h-8 w-8 rounded-lg border-2 ${form.color === c ? "border-foreground ring-2 ring-offset-1" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="active">{t("active")}</Label>
                <Switch id="active" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>{t("save")}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="h-40 animate-pulse bg-muted/30" /></Card>
          ))
        ) : fuelTypes?.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <Droplet className="h-10 w-10 opacity-50" />
              <p>{t("noData")}</p>
            </CardContent>
          </Card>
        ) : (
          fuelTypes?.map((ft) => {
            const profit = ft.price - ft.cost;
            return (
              <Card key={ft.id} className="card-hover overflow-hidden border-border/60">
                <div className="h-1.5" style={{ backgroundColor: ft.color }} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundColor: ft.color }}>
                        <Fuel className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{fuelName(ft)}</p>
                        <Badge variant={ft.active ? "secondary" : "outline"} className="mt-1 text-xs">
                          {ft.active ? t("active") : t("inactive")}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ft)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600" onClick={() => handleDelete(ft)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-xs text-muted-foreground">{t("price")}</p>
                      <p className="mt-0.5 text-sm font-semibold num">{formatCurrency(ft.price)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-xs text-muted-foreground">{t("cost")}</p>
                      <p className="mt-0.5 text-sm font-semibold num">{formatCurrency(ft.cost)}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/30">
                      <p className="text-xs text-muted-foreground">{t("netProfit")}</p>
                      <p className="mt-0.5 text-sm font-semibold num text-emerald-600 dark:text-emerald-400">{formatCurrency(profit)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{ft._count?.tanks || 0} {t("tanks")}</span>
                    <span>•</span>
                    <span>{ft._count?.sales || 0} {t("sales")}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
