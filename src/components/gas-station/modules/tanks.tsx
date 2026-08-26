"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Cylinder, AlertTriangle, Droplet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLanguage } from "../hooks";
import { useList, useCreate, useUpdate, useDelete } from "../api-hooks";
import { formatLiters, formatNumber } from "@/lib/format";
import type { Tank, FuelType } from "@/lib/types";

export function TanksModule() {
  const { t, language } = useLanguage();
  const { data: tanks, isLoading } = useList<Tank>("tanks");
  const { data: fuelTypes } = useList<FuelType>("fuel-types");
  const createMut = useCreate("tanks");
  const updateMut = useUpdate("tanks");
  const deleteMut = useDelete("tanks");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tank | null>(null);
  const [form, setForm] = useState({
    name: "", fuelTypeId: "", capacity: "", currentLevel: "", minLevel: "",
  });

  const fuelName = (ft: FuelType) => {
    if (language === "da") return ft.nameDa || ft.name;
    if (language === "ps") return ft.namePs || ft.name;
    return ft.name;
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", fuelTypeId: fuelTypes?.[0]?.id || "", capacity: "", currentLevel: "", minLevel: "" });
    setOpen(true);
  };

  const openEdit = (tank: Tank) => {
    setEditing(tank);
    setForm({
      name: tank.name, fuelTypeId: tank.fuelTypeId,
      capacity: String(tank.capacity), currentLevel: String(tank.currentLevel),
      minLevel: String(tank.minLevel),
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.fuelTypeId || !form.capacity) {
      toast.error("Please fill required fields");
      return;
    }
    const payload = {
      ...form,
      capacity: parseFloat(form.capacity),
      currentLevel: parseFloat(form.currentLevel || "0"),
      minLevel: parseFloat(form.minLevel || "0"),
    };
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

  const handleDelete = (tank: Tank) => {
    if (!confirm(t("confirmDelete"))) return;
    deleteMut.mutate(tank.id, { onSuccess: () => toast.success(t("deletedSuccessfully")) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{tanks?.length || 0} {t("tanks")}</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gap-2" disabled={!fuelTypes?.length}>
              <Plus className="h-4 w-4" /> {t("addTank")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? t("editTank") : t("addTank")}</DialogTitle>
              <DialogDescription>{t("tanks")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>{t("tankName")}</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tank 1" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("fuelType")}</Label>
                <Select value={form.fuelTypeId} onValueChange={(v) => setForm({ ...form, fuelTypeId: v })}>
                  <SelectTrigger><SelectValue placeholder={t("fuelType")} /></SelectTrigger>
                  <SelectContent>
                    {fuelTypes?.map((ft) => (
                      <SelectItem key={ft.id} value={ft.id}>{fuelName(ft)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("capacity")} (L)</Label>
                  <Input type="number" step="0.01" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("currentLevel")} (L)</Label>
                  <Input type="number" step="0.01" value={form.currentLevel} onChange={(e) => setForm({ ...form, currentLevel: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("minLevel")} (L)</Label>
                  <Input type="number" step="0.01" value={form.minLevel} onChange={(e) => setForm({ ...form, minLevel: e.target.value })} />
                </div>
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
            <Card key={i}><CardContent className="h-48 animate-pulse bg-muted/30" /></Card>
          ))
        ) : tanks?.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <Cylinder className="h-10 w-10 opacity-50" />
              <p>{t("noData")}</p>
            </CardContent>
          </Card>
        ) : (
          tanks?.map((tank) => {
            const pct = Math.min(100, (tank.currentLevel / tank.capacity) * 100);
            const isLow = tank.currentLevel <= tank.minLevel;
            const isCritical = tank.currentLevel <= tank.minLevel * 0.5;
            return (
              <Card key={tank.id} className={`card-hover overflow-hidden ${isLow ? "border-rose-300 dark:border-rose-900" : "border-border/60"}`}>
                <div className="h-1.5" style={{ backgroundColor: tank.fuelType.color, opacity: isLow ? 0.5 : 1 }} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundColor: tank.fuelType.color }}>
                        <Droplet className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{tank.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{fuelName(tank.fuelType)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(tank)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600" onClick={() => handleDelete(tank)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("currentLevel")}</span>
                      <span className="font-semibold num">{formatNumber(tank.currentLevel)} / {formatNumber(tank.capacity)} L</span>
                    </div>
                    <Progress
                      value={pct}
                      className={`h-2.5 ${isCritical ? "[&>div]:bg-rose-500" : isLow ? "[&>div]:bg-amber-500" : ""}`}
                    />
                    <div className="flex items-center justify-between text-xs">
                      <span className="num">{pct.toFixed(1)}%</span>
                      {isLow && (
                        <Badge variant="destructive" className={isCritical ? "pulse-warning" : ""}>
                          <AlertTriangle className="me-1 h-3 w-3" />
                          {isCritical ? "Critical" : t("lowStockAlerts")}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
                    <span>{t("minLevel")}: <span className="num font-medium text-foreground">{formatLiters(tank.minLevel)}</span></span>
                    <span>{tank.pumps?.length || 0} {t("pumps")}</span>
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
