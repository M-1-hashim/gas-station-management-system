"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, ShoppingCart, Search, Filter, Printer } from "lucide-react";
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
  TableFooter,
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
import { useList, useCreate, useUpdate, useDelete } from "../api-hooks";
import { ReceiptDialog } from "../receipt-dialog";
import { formatCurrency, formatLiters, formatDateTime } from "@/lib/format";
import type { Sale, FuelType, Pump, Customer, Shift, Station } from "@/lib/types";

export function SalesModule({ station }: { station?: Station | null }) {
  const { t, language } = useLanguage();
  const { data: sales, isLoading } = useList<Sale>("sales");
  const { data: fuelTypes } = useList<FuelType>("fuel-types");
  const { data: pumps } = useList<Pump>("pumps");
  const { data: customers } = useList<Customer>("customers");
  const { data: shifts } = useList<Shift>("shifts");
  const createMut = useCreate("sales");
  const updateMut = useUpdate("sales");
  const deleteMut = useDelete("sales");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [search, setSearch] = useState("");
  const [payFilter, setPayFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [form, setForm] = useState({
    fuelTypeId: "", pumpId: "", customerId: "",
    liters: "", pricePerLiter: "", paymentType: "cash", note: "",
  });

  const fuelName = (ft: FuelType) => {
    if (language === "da") return ft.nameDa || ft.name;
    if (language === "ps") return ft.namePs || ft.name;
    return ft.name;
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      fuelTypeId: fuelTypes?.[0]?.id || "",
      pumpId: "", customerId: "",
      liters: "", pricePerLiter: String(fuelTypes?.[0]?.price || ""),
      paymentType: "cash", note: "",
    });
    setOpen(true);
  };

  const openEdit = (sale: Sale) => {
    setEditing(sale);
    setForm({
      fuelTypeId: sale.fuelTypeId,
      pumpId: sale.pumpId || "",
      customerId: sale.customerId || "",
      liters: String(sale.liters),
      pricePerLiter: String(sale.pricePerLiter),
      paymentType: sale.paymentType,
      note: sale.note || "",
    });
    setOpen(true);
  };

  const onFuelTypeChange = (ftId: string) => {
    const ft = fuelTypes?.find((f) => f.id === ftId);
    setForm({ ...form, fuelTypeId: ftId, pricePerLiter: String(ft?.price || ""), pumpId: "" });
  };

  const availablePumps = pumps?.filter((p) => p.tank?.fuelTypeId === form.fuelTypeId) || [];

  const filteredSales = useMemo(() => {
    let result = sales || [];
    if (payFilter !== "all") {
      result = result.filter((s) => s.paymentType === payFilter);
    }
    if (dateFilter !== "all") {
      const now = new Date();
      let startDate: Date;
      if (dateFilter === "today") {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
      } else if (dateFilter === "7days") {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateFilter === "30days") {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
      } else {
        startDate = new Date(0);
      }
      result = result.filter((s) => new Date(s.date) >= startDate);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.customer?.name?.toLowerCase().includes(q) ||
          s.fuelType.name.toLowerCase().includes(q) ||
          s.fuelType.nameDa?.includes(search)
      );
    }
    return result;
  }, [sales, search, payFilter, dateFilter]);

  const totalLiters = filteredSales.reduce((sum, s) => sum + s.liters, 0);
  const totalAmount = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fuelTypeId || !form.liters || !form.pricePerLiter) {
      toast.error("Please fill required fields");
      return;
    }
    const openShift = shifts?.find((s) => s.status === "open");
    const payload = {
      ...form,
      liters: parseFloat(form.liters),
      pricePerLiter: parseFloat(form.pricePerLiter),
      shiftId: openShift?.id || null,
      customerId: form.customerId || null,
      pumpId: form.pumpId || null,
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, ...payload }, {
        onSuccess: () => { toast.success(t("savedSuccessfully")); setOpen(false); setEditing(null); },
      });
    } else {
      createMut.mutate(payload, {
        onSuccess: () => { toast.success(t("savedSuccessfully")); setOpen(false); },
      });
    }
  };

  const handleDelete = (sale: Sale) => {
    if (!confirm(t("confirmDelete"))) return;
    deleteMut.mutate(sale.id, { onSuccess: () => toast.success(t("deletedSuccessfully")) });
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t("totalSales")}</p>
            <p className="mt-1 text-xl font-bold num">{formatCurrency(totalAmount)}</p>
            <p className="text-xs text-muted-foreground">{filteredSales.length} {t("sales")}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t("totalLiters")}</p>
            <p className="mt-1 text-xl font-bold num">{formatLiters(totalLiters)}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 border-border/60 lg:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t("cash")} / {t("credit")}</p>
            <p className="mt-1 text-xl font-bold num">
              {formatCurrency(filteredSales.filter((s) => s.paymentType === "cash").reduce((a, b) => a + b.totalAmount, 0))}
              <span className="mx-1 text-muted-foreground">/</span>
              {formatCurrency(filteredSales.filter((s) => s.paymentType === "credit").reduce((a, b) => a + b.totalAmount, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("search")}
                className="ps-9"
              />
            </div>
            <Select value={payFilter} onValueChange={setPayFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="me-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value="cash">{t("cash")}</SelectItem>
                <SelectItem value="credit">{t("credit")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openCreate} className="gap-2 shrink-0" disabled={!fuelTypes?.length}>
            <Plus className="h-4 w-4" /> {t("newSale")}
          </Button>
        </div>

        {/* Quick Date Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{t("quickFilters")}:</span>
          {[
            { value: "all", label: t("all") },
            { value: "today", label: t("todayOnly") },
            { value: "7days", label: t("last7Days") },
            { value: "30days", label: t("last30Days") },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateFilter(opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                dateFilter === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <span className="ms-auto text-xs text-muted-foreground num">
            {t("showing")} {filteredSales.length} {t("of")} {sales?.length || 0} {t("results")}
          </span>
        </div>
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <ScrollArea className="max-h-[600px]">
          <Table className="table-zebra">
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("fuelType")}</TableHead>
                <TableHead className="text-end">{t("liters")}</TableHead>
                <TableHead className="text-end">{t("price")}</TableHead>
                <TableHead className="text-end">{t("total")}</TableHead>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{t("paymentType")}</TableHead>
                <TableHead className="text-end">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-6" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    {t("noData")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-primary/5 transition-colors">
                    <TableCell className="text-xs whitespace-nowrap num">{formatDateTime(sale.date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sale.fuelType.color }} />
                        <span className="text-sm font-medium">{fuelName(sale.fuelType)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-end num font-medium">{formatLiters(sale.liters)}</TableCell>
                    <TableCell className="text-end num text-muted-foreground">{formatCurrency(sale.pricePerLiter)}</TableCell>
                    <TableCell className="text-end num font-bold">{formatCurrency(sale.totalAmount)}</TableCell>
                    <TableCell className="text-sm">{sale.customer?.name || <span className="text-muted-foreground">{t("walkInCustomer")}</span>}</TableCell>
                    <TableCell>
                      <Badge variant={sale.paymentType === "cash" ? "secondary" : "outline"} className="text-xs">
                        {sale.paymentType === "cash" ? t("cash") : t("credit")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600" title={t("editSale")} onClick={() => openEdit(sale)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title={t("receipt")} onClick={() => setReceiptSale(sale)}>
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600" title={t("delete")} onClick={() => handleDelete(sale)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {!isLoading && filteredSales.length > 0 && (
              <TableFooter className="sticky bottom-0 bg-muted/50 font-bold">
                <TableRow>
                  <TableCell colSpan={2}>{t("total")} ({filteredSales.length})</TableCell>
                  <TableCell className="text-end num">{formatLiters(totalLiters)}</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-end num">{formatCurrency(totalAmount)}</TableCell>
                  <TableCell colSpan={3}></TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </ScrollArea>
      </Card>

      {/* Receipt Dialog */}
      <ReceiptDialog
        sale={receiptSale}
        station={station ?? null}
        open={!!receiptSale}
        onOpenChange={(o) => !o && setReceiptSale(null)}
      />


      {/* New Sale Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t("editSale") : t("newSaleTitle")}</DialogTitle>
            <DialogDescription>{t("sales")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("fuelType")} *</Label>
                <Select value={form.fuelTypeId} onValueChange={onFuelTypeChange}>
                  <SelectTrigger><SelectValue placeholder={t("fuelType")} /></SelectTrigger>
                  <SelectContent>
                    {fuelTypes?.map((ft) => (
                      <SelectItem key={ft.id} value={ft.id}>{fuelName(ft)} - {formatCurrency(ft.price)}/L</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("pumps")}</Label>
                <Select value={form.pumpId} onValueChange={(v) => setForm({ ...form, pumpId: v })} disabled={!availablePumps.length}>
                  <SelectTrigger><SelectValue placeholder={t("pumps")} /></SelectTrigger>
                  <SelectContent>
                    {availablePumps.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("liters")} *</Label>
                <Input type="number" step="0.01" value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("pricePerLiter")} (؋) *</Label>
                <Input type="number" step="0.01" value={form.pricePerLiter} onChange={(e) => setForm({ ...form, pricePerLiter: e.target.value })} />
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">{t("total")}</p>
              <p className="text-2xl font-bold num text-primary">
                {formatCurrency((parseFloat(form.liters) || 0) * (parseFloat(form.pricePerLiter) || 0))}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("paymentType")}</Label>
                <Select value={form.paymentType} onValueChange={(v) => setForm({ ...form, paymentType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t("cash")}</SelectItem>
                    <SelectItem value="credit">{t("credit")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("customer")}</Label>
                <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })} disabled={form.paymentType !== "credit"}>
                  <SelectTrigger><SelectValue placeholder={t("walkInCustomer")} /></SelectTrigger>
                  <SelectContent>
                    {customers?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.paymentType === "credit" && !form.customerId && (
              <p className="text-xs text-amber-600">⚠ {t("selectCustomer")} ({t("credit")})</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
              <Button type="submit" disabled={createMut.isPending}>{t("save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
