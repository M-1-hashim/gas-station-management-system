"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, Truck, Search, Droplet, Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useLanguage } from "../hooks";
import { useList, useCreate, useDelete } from "../api-hooks";
import { formatCurrency, formatLiters, formatDateTime } from "@/lib/format";
import type { Refill, Tank, FuelType } from "@/lib/types";

export function RefillsModule() {
  const { t, language } = useLanguage();
  const { data: refills, isLoading } = useList<Refill>("refills");
  const { data: tanks } = useList<Tank>("tanks");
  const createMut = useCreate("refills");
  const deleteMut = useDelete("refills");

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    tankId: "", liters: "", costPerLiter: "", supplier: "", invoiceNo: "", date: "", note: "",
  });

  const fuelName = (ft: FuelType) => {
    if (language === "da") return ft.nameDa || ft.name;
    if (language === "ps") return ft.namePs || ft.name;
    return ft.name;
  };

  const tankLabel = (tank: Tank) => `${tank.name} • ${fuelName(tank.fuelType)}`;

  const openCreate = () => {
    const today = new Date().toISOString().split("T")[0];
    setForm({ tankId: tanks?.[0]?.id || "", liters: "", costPerLiter: "", supplier: "", invoiceNo: "", date: today, note: "" });
    setOpen(true);
  };

  const filteredRefills = useMemo(() => {
    if (!search) return refills || [];
    const q = search.toLowerCase();
    return (refills || []).filter(
      (r) => r.supplier?.toLowerCase().includes(q) || r.tank?.name.toLowerCase().includes(q) || r.invoiceNo?.toLowerCase().includes(q)
    );
  }, [refills, search]);

  const totalLiters = filteredRefills.reduce((sum, r) => sum + r.liters, 0);
  const totalCost = filteredRefills.reduce((sum, r) => sum + r.totalCost, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tankId || !form.liters || !form.costPerLiter) {
      toast.error("Please fill required fields");
      return;
    }
    const payload = {
      ...form,
      liters: parseFloat(form.liters),
      costPerLiter: parseFloat(form.costPerLiter),
      date: form.date ? new Date(form.date).toISOString() : undefined,
    };
    createMut.mutate(payload, {
      onSuccess: () => { toast.success(t("savedSuccessfully")); setOpen(false); },
    });
  };

  const handleDelete = (refill: Refill) => {
    if (!confirm(t("confirmDelete"))) return;
    deleteMut.mutate(refill.id, { onSuccess: () => toast.success(t("deletedSuccessfully")) });
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Droplet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("totalLiters")}</p>
              <p className="text-xl font-bold num">{formatLiters(totalLiters)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("totalCost")}</p>
              <p className="text-xl font-bold num">{formatCurrency(totalCost)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 border-border/60 lg:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("refills")}</p>
              <p className="text-xl font-bold num">{filteredRefills.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search")} className="ps-9" />
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0" disabled={!tanks?.length}>
          <Plus className="h-4 w-4" /> {t("addRefill")}
        </Button>
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <ScrollArea className="max-h-[600px]">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("tanks")}</TableHead>
                <TableHead className="text-end">{t("liters")}</TableHead>
                <TableHead className="text-end">{t("costPerLiter")}</TableHead>
                <TableHead className="text-end">{t("total")}</TableHead>
                <TableHead>{t("supplier")}</TableHead>
                <TableHead>{t("invoiceNo")}</TableHead>
                <TableHead className="text-end">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-6" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredRefills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Truck className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    {t("noData")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRefills.map((refill) => (
                  <TableRow key={refill.id} className="hover:bg-muted/50">
                    <TableCell className="text-xs num whitespace-nowrap">{formatDateTime(refill.date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: refill.tank.fuelType.color }} />
                        <div>
                          <p className="text-sm font-medium">{refill.tank.name}</p>
                          <p className="text-xs text-muted-foreground">{fuelName(refill.tank.fuelType)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-end num font-medium text-emerald-600 dark:text-emerald-400">+{formatLiters(refill.liters)}</TableCell>
                    <TableCell className="text-end num text-muted-foreground">{formatCurrency(refill.costPerLiter)}</TableCell>
                    <TableCell className="text-end num font-bold">{formatCurrency(refill.totalCost)}</TableCell>
                    <TableCell className="text-sm">{refill.supplier || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-sm num">{refill.invoiceNo || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600" onClick={() => handleDelete(refill)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Add Refill Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("addRefill")}</DialogTitle>
            <DialogDescription>{t("refills")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("tanks")} *</Label>
              <Select value={form.tankId} onValueChange={(v) => setForm({ ...form, tankId: v })}>
                <SelectTrigger><SelectValue placeholder={t("tanks")} /></SelectTrigger>
                <SelectContent>
                  {tanks?.map((tank) => (
                    <SelectItem key={tank.id} value={tank.id}>{tankLabel(tank)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("liters")} *</Label>
                <Input type="number" step="0.01" value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("costPerLiter")} (؋) *</Label>
                <Input type="number" step="0.01" value={form.costPerLiter} onChange={(e) => setForm({ ...form, costPerLiter: e.target.value })} placeholder="0.00" />
              </div>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 text-center dark:bg-emerald-950/30">
              <p className="text-xs text-muted-foreground">{t("totalCost")}</p>
              <p className="text-2xl font-bold num text-emerald-600 dark:text-emerald-400">
                {formatCurrency((parseFloat(form.liters) || 0) * (parseFloat(form.costPerLiter) || 0))}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("supplier")}</Label>
                <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("invoiceNo")}</Label>
                <Input value={form.invoiceNo} onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("date")}</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("note")}</Label>
              <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
              <Button type="submit" disabled={createMut.isPending} className="gap-2">
                <Truck className="h-4 w-4" /> {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
