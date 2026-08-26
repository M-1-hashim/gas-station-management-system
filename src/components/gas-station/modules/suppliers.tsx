"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  Truck,
  Search,
  Phone,
  MapPin,
  User,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useLanguage } from "../hooks";
import {
  useList,
  useCreate,
  useUpdate,
  useDelete,
  useCustomAction,
} from "../api-hooks";
import { formatCurrency } from "@/lib/format";
import type { Supplier } from "@/lib/types";

export function SuppliersModule() {
  const { t, language } = useLanguage();
  const { data: suppliers, isLoading } = useList<Supplier>("suppliers");
  const createMut = useCreate("suppliers");
  const updateMut = useUpdate("suppliers");
  const deleteMut = useDelete("suppliers");
  const paymentMut = useCustomAction("suppliers", ["refills"]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    nameDa: "",
    namePs: "",
    contactPerson: "",
    phone: "",
    address: "",
    balance: "",
    active: true,
  });

  // Payment dialog state
  const [payOpen, setPayOpen] = useState(false);
  const [paySupplier, setPaySupplier] = useState<Supplier | null>(null);
  const [payForm, setPayForm] = useState({ amount: "" });

  const supplierName = (s: Supplier) => {
    if (language === "da") return s.nameDa || s.name;
    if (language === "ps") return s.namePs || s.name;
    return s.name;
  };

  const filtered = useMemo(() => {
    if (!search) return suppliers || [];
    const q = search.toLowerCase();
    return (suppliers || []).filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.nameDa || "").toLowerCase().includes(q) ||
        (s.namePs || "").toLowerCase().includes(q) ||
        (s.phone || "").toLowerCase().includes(q),
    );
  }, [suppliers, search]);

  const totalPayable = (suppliers || []).reduce(
    (sum, s) => sum + (s.balance > 0 ? s.balance : 0),
    0,
  );
  const activeSuppliers = (suppliers || []).filter((s) => s.active).length;

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      nameDa: "",
      namePs: "",
      contactPerson: "",
      phone: "",
      address: "",
      balance: "",
      active: true,
    });
    setOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name,
      nameDa: s.nameDa || "",
      namePs: s.namePs || "",
      contactPerson: s.contactPerson || "",
      phone: s.phone || "",
      address: s.address || "",
      balance: String(s.balance),
      active: s.active,
    });
    setOpen(true);
  };

  const openPayment = (s: Supplier) => {
    setPaySupplier(s);
    setPayForm({ amount: "" });
    setPayOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error(t("supplierName") + " " + t("name"));
      return;
    }
    if (editing) {
      updateMut.mutate(
        {
          id: editing.id,
          name: form.name,
          nameDa: form.nameDa || null,
          namePs: form.namePs || null,
          phone: form.phone || null,
          address: form.address || null,
          contactPerson: form.contactPerson || null,
          active: form.active,
        },
        {
          onSuccess: () => {
            toast.success(t("savedSuccessfully"));
            setOpen(false);
          },
        },
      );
    } else {
      createMut.mutate(
        {
          name: form.name,
          nameDa: form.nameDa || null,
          namePs: form.namePs || null,
          phone: form.phone || null,
          address: form.address || null,
          contactPerson: form.contactPerson || null,
          balance: parseFloat(form.balance || "0"),
          active: form.active,
        },
        {
          onSuccess: () => {
            toast.success(t("savedSuccessfully"));
            setOpen(false);
          },
        },
      );
    }
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySupplier) return;
    const amount = parseFloat(payForm.amount);
    if (!amount || amount <= 0) {
      toast.error(t("payAmount"));
      return;
    }
    if (amount > paySupplier.balance) {
      toast.error(t("payAmount") + " > " + t("balance"));
      return;
    }
    paymentMut.mutate(
      {
        id: paySupplier.id,
        amount,
      },
      {
        onSuccess: () => {
          toast.success(t("savedSuccessfully"));
          setPayOpen(false);
        },
      },
    );
  };

  const handleDelete = (s: Supplier) => {
    if (!confirm(t("confirmDelete"))) return;
    deleteMut.mutate(s.id, {
      onSuccess: () => toast.success(t("deletedSuccessfully")),
    });
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card className="border-border/60 card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{t("suppliers")}</p>
              <Truck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="mt-1 text-xl font-bold num">
              {suppliers?.length || 0}
            </p>
            <p className="text-xs text-muted-foreground">
              {suppliers?.length || 0} {t("suppliers")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {t("totalPayable")}
              </p>
              <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="mt-1 text-xl font-bold num text-amber-600 dark:text-amber-400">
              {formatCurrency(totalPayable)}
            </p>
            <p className="text-xs text-muted-foreground">{t("balance")}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 border-border/60 card-hover lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{t("active")}</p>
              <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="mt-1 text-xl font-bold num">{activeSuppliers}</p>
            <p className="text-xs text-muted-foreground">
              {activeSuppliers} {t("suppliers")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            className="ps-9"
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /> {t("addSupplier")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editing ? t("editSupplier") : t("addSupplier")}
              </DialogTitle>
              <DialogDescription>{t("suppliers")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>{t("supplierName")} (EN) *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("supplierName")}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("name")} (دری)</Label>
                  <Input
                    value={form.nameDa}
                    onChange={(e) =>
                      setForm({ ...form, nameDa: e.target.value })
                    }
                    placeholder="تامین‌کننده"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("name")} (پښتو)</Label>
                  <Input
                    value={form.namePs}
                    onChange={(e) =>
                      setForm({ ...form, namePs: e.target.value })
                    }
                    placeholder="تامینوونکی"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("contactPerson")}</Label>
                  <Input
                    value={form.contactPerson}
                    onChange={(e) =>
                      setForm({ ...form, contactPerson: e.target.value })
                    }
                    placeholder={t("contactPerson")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("phone")}</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="07XX XXX XXX"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("address")}</Label>
                <Input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder={t("address")}
                />
              </div>
              {!editing && (
                <div className="space-y-1.5">
                  <Label>{t("balance")} (؋)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.balance}
                    onChange={(e) =>
                      setForm({ ...form, balance: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="active">{t("active")}</Label>
                <Switch
                  id="active"
                  checked={form.active}
                  onCheckedChange={(v) => setForm({ ...form, active: v })}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
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

      {/* Table */}
      <Card className="border-border/60">
        <ScrollArea className="max-h-[600px]">
          <Table className="table-zebra">
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("contactPerson")}</TableHead>
                <TableHead>{t("phone")}</TableHead>
                <TableHead>{t("address")}</TableHead>
                <TableHead className="text-end">{t("balance")}</TableHead>
                <TableHead className="text-end">{t("refillsCount")}</TableHead>
                <TableHead className="text-end">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-6" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <Truck className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    {t("noData")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {s.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {supplierName(s)}
                          </span>
                          <Badge
                            variant={s.active ? "secondary" : "outline"}
                            className="mt-0.5 w-fit text-[10px]"
                          >
                            {s.active ? t("active") : t("inactive")}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.contactPerson ? (
                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="max-w-[160px] truncate">
                            {s.contactPerson}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm num">
                      {s.phone ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span dir="ltr">{s.phone}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.address ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="max-w-[200px] truncate">
                            {s.address}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-end">
                      {s.balance > 0 ? (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 num font-semibold"
                        >
                          {formatCurrency(s.balance)}
                        </Badge>
                      ) : (
                        <span className="num text-sm text-muted-foreground">
                          {formatCurrency(0)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-end num text-sm">
                      {s._count?.refills || 0}
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-1">
                        {s.balance > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600 dark:text-amber-400"
                            onClick={() => openPayment(s)}
                            title={t("paySupplier")}
                          >
                            <Wallet className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(s)}
                          title={t("editSupplier")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-600"
                          onClick={() => handleDelete(s)}
                          title={t("delete")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Pay Supplier Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("paySupplier")}</DialogTitle>
            <DialogDescription>
              {paySupplier ? supplierName(paySupplier) : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePayment} className="space-y-3">
            <div className="rounded-lg bg-amber-50 p-3 text-center dark:bg-amber-950/30">
              <p className="text-xs text-muted-foreground">{t("balance")}</p>
              <p className="text-2xl font-bold num text-amber-600 dark:text-amber-400">
                {formatCurrency(paySupplier?.balance || 0)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>{t("payAmount")} (؋) *</Label>
              <Input
                type="number"
                step="0.01"
                value={payForm.amount}
                onChange={(e) =>
                  setPayForm({ ...payForm, amount: e.target.value })
                }
                placeholder="0"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPayOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={paymentMut.isPending}>
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
