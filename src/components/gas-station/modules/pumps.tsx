"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Gauge,
  Fuel,
  Droplet,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { formatNumber } from "@/lib/format";
import type { Pump, Tank, FuelType } from "@/lib/types";

export function PumpsModule() {
  const { t, language } = useLanguage();
  const { data: pumps, isLoading } = useList<Pump>("pumps");
  const { data: tanks } = useList<Tank>("tanks");
  const createMut = useCreate("pumps");
  const updateMut = useUpdate("pumps");
  const deleteMut = useDelete("pumps");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pump | null>(null);
  const [form, setForm] = useState({
    name: "",
    tankId: "",
    reading: "0",
    active: true,
  });

  const fuelName = (ft: FuelType) => {
    if (language === "da") return ft.nameDa || ft.name;
    if (language === "ps") return ft.namePs || ft.name;
    return ft.name;
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      tankId: tanks?.[0]?.id || "",
      reading: "0",
      active: true,
    });
    setOpen(true);
  };

  const openEdit = (pump: Pump) => {
    setEditing(pump);
    setForm({
      name: pump.name,
      tankId: pump.tankId,
      reading: String(pump.reading),
      active: pump.active,
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.tankId) {
      toast.error(t("name") + " & " + t("tanks") + " required");
      return;
    }
    const payload = {
      ...form,
      reading: parseFloat(form.reading || "0"),
    };
    if (editing) {
      updateMut.mutate(
        { id: editing.id, ...payload },
        {
          onSuccess: () => {
            toast.success(t("savedSuccessfully"));
            setOpen(false);
          },
        }
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success(t("savedSuccessfully"));
          setOpen(false);
        },
      });
    }
  };

  const handleDelete = (pump: Pump) => {
    if (!confirm(t("confirmDelete"))) return;
    deleteMut.mutate(pump.id, {
      onSuccess: () => toast.success(t("deletedSuccessfully")),
    });
  };

  const hasTanks = (tanks?.length || 0) > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pumps?.length || 0} {t("pumps")}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreate}
              className="gap-2"
              disabled={!hasTanks}
              title={!hasTanks ? t("addTank") : undefined}
            >
              <Plus className="h-4 w-4" /> {t("addPump")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? t("editPump") : t("addPump")}</DialogTitle>
              <DialogDescription>{t("pumps")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>{t("pumpName")}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Pump 1"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("tanks")}</Label>
                <Select
                  value={form.tankId}
                  onValueChange={(v) => setForm({ ...form, tankId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("tanks")} />
                  </SelectTrigger>
                  <SelectContent>
                    {tanks?.map((tank) => (
                      <SelectItem key={tank.id} value={tank.id}>
                        {tank.name} • {fuelName(tank.fuelType)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("reading")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.reading}
                  onChange={(e) => setForm({ ...form, reading: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="active">{t("active")}</Label>
                <Switch
                  id="active"
                  checked={form.active}
                  onCheckedChange={(v) => setForm({ ...form, active: v })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={createMut.isPending || updateMut.isPending}
                >
                  {t("save")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!hasTanks && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            {t("tanks")} — {t("noData")}
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="h-40 animate-pulse bg-muted/30" />
            </Card>
          ))
        ) : pumps?.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <Gauge className="h-10 w-10 opacity-50" />
              <p>{t("noData")}</p>
            </CardContent>
          </Card>
        ) : (
          pumps?.map((pump) => {
            const tank = pump.tank;
            const ft = tank?.fuelType;
            const accent = ft?.color || "#10b981";
            return (
              <Card
                key={pump.id}
                className="card-hover overflow-hidden border-border/60"
              >
                <div className="h-1.5" style={{ backgroundColor: accent }} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
                        style={{ backgroundColor: accent }}
                      >
                        <Fuel className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{pump.name}</p>
                        <Badge
                          variant={pump.active ? "secondary" : "outline"}
                          className="mt-1 text-xs"
                        >
                          {pump.active ? t("active") : t("inactive")}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(pump)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-600"
                        onClick={() => handleDelete(pump)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 p-2.5">
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Droplet className="h-3.5 w-3.5" />
                        {t("tanks")}
                      </span>
                      <span className="flex items-center gap-1.5 min-w-0">
                        {ft && (
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: ft.color }}
                          />
                        )}
                        <span className="truncate text-sm font-medium">
                          {tank?.name || "—"}
                        </span>
                      </span>
                    </div>
                    {ft && (
                      <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 p-2.5">
                        <span className="text-xs text-muted-foreground">
                          {t("fuelType")}
                        </span>
                        <span className="truncate text-sm font-medium">
                          {fuelName(ft)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-emerald-50 p-2.5 dark:bg-emerald-950/30">
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Gauge className="h-3.5 w-3.5" />
                        {t("reading")}
                      </span>
                      <span className="num text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatNumber(pump.reading)}
                      </span>
                    </div>
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
