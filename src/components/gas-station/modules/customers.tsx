"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  Users,
  Search,
  Phone,
  MapPin,
  Eye,
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
import { CustomerDetailDialog } from "../customer-detail-dialog";
import { formatCurrency } from "@/lib/format";
import type { Customer, Station } from "@/lib/types";

export function CustomersModule({ station }: { station?: Station | null }) {
  const { t } = useLanguage();
  const { data: customers, isLoading } = useList<Customer>("customers");
  const createMut = useCreate("customers");
  const updateMut = useUpdate("customers");
  const deleteMut = useDelete("customers");
  const paymentMut = useCustomAction("customers", ["sales"]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    balance: "",
  });

  // Payment dialog state
  const [payOpen, setPayOpen] = useState(false);
  const [payCustomer, setPayCustomer] = useState<Customer | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    amount: "",
    method: "cash",
    note: "",
  });

  const filtered = useMemo(() => {
    if (!search) return customers || [];
    const q = search.toLowerCase();
    return (customers || []).filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q),
    );
  }, [customers, search]);

  const totalOutstanding = (customers || []).reduce(
    (sum, c) => sum + (c.balance > 0 ? c.balance : 0),
    0,
  );
  const customersWithCredit = (customers || []).filter(
    (c) => c.balance > 0,
  ).length;

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", phone: "", address: "", balance: "" });
    setOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone || "",
      address: c.address || "",
      balance: String(c.balance),
    });
    setOpen(true);
  };

  const openPayment = (c: Customer) => {
    setPayCustomer(c);
    setPayForm({ amount: "", method: "cash", note: "" });
    setPayOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error(t("customerName") + " " + t("name"));
      return;
    }
    if (editing) {
      updateMut.mutate(
        {
          id: editing.id,
          name: form.name,
          phone: form.phone || null,
          address: form.address || null,
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
          phone: form.phone || null,
          address: form.address || null,
          balance: parseFloat(form.balance || "0"),
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
    if (!payCustomer) return;
    const amount = parseFloat(payForm.amount);
    if (!amount || amount <= 0) {
      toast.error(t("amount"));
      return;
    }
    if (amount > payCustomer.balance) {
      toast.error(t("amount") + " > " + t("balance"));
      return;
    }
    paymentMut.mutate(
      {
        id: payCustomer.id,
        amount,
        method: payForm.method,
        note: payForm.note || null,
      },
      {
        onSuccess: () => {
          toast.success(t("savedSuccessfully"));
          setPayOpen(false);
        },
      },
    );
  };

  const handleDelete = (c: Customer) => {
    if (!confirm(t("confirmDelete"))) return;
    deleteMut.mutate(c.id, {
      onSuccess: () => toast.success(t("deletedSuccessfully")),
    });
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{t("customers")}</p>
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="mt-1 text-xl font-bold num">{customers?.length || 0}</p>
            <p className="text-xs text-muted-foreground">
              {customers?.length || 0} {t("customers")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {t("outstandingBalance")}
              </p>
              <Wallet className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            <p className="mt-1 text-xl font-bold num text-rose-600 dark:text-rose-400">
              {formatCurrency(totalOutstanding)}
            </p>
            <p className="text-xs text-muted-foreground">{t("balance")} (نسیه)</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 border-border/60 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {t("recordPayment")}
              </p>
              <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="mt-1 text-xl font-bold num">{customersWithCredit}</p>
            <p className="text-xs text-muted-foreground">
              {t("customers")} ({t("balance")} &gt; 0)
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
              <Plus className="h-4 w-4" /> {t("addCustomer")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editing ? t("editCustomer") : t("addCustomer")}
              </DialogTitle>
              <DialogDescription>{t("customers")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>
                  {t("customerName")} *
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("customerName")}
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
              <div className="space-y-1.5">
                <Label>{t("address")}</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder={t("address")}
                />
              </div>
              {!editing && (
                <div className="space-y-1.5">
                  <Label>
                    {t("balance")} (نسیه) (؋)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.balance}
                    onChange={(e) => setForm({ ...form, balance: e.target.value })}
                    placeholder="0"
                  />
                </div>
              )}
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

      {/* Table */}
      <Card className="border-border/60">
        <ScrollArea className="max-h-[600px]">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("phone")}</TableHead>
                <TableHead>{t("address")}</TableHead>
                <TableHead className="text-end">{t("balance")}</TableHead>
                <TableHead className="text-end">{t("sales")}</TableHead>
                <TableHead className="text-end">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-6" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    {t("noData")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {c.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm num">
                      {c.phone ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span dir="ltr">{c.phone}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.address ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="max-w-[200px] truncate">{c.address}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-end">
                      {c.balance > 0 ? (
                        <Badge
                          variant="outline"
                          className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 num font-semibold"
                        >
                          {formatCurrency(c.balance)}
                        </Badge>
                      ) : (
                        <span className="num text-sm text-muted-foreground">
                          {formatCurrency(0)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-end num text-sm">
                      {c._count?.sales || 0}
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary"
                          onClick={() => { setDetailId(c.id); setDetailOpen(true); }}
                          title={t("viewDetails")}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {c.balance > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
                            onClick={() => openPayment(c)}
                            title={t("recordPayment")}
                          >
                            <Wallet className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(c)}
                          title={t("editCustomer")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-600"
                          onClick={() => handleDelete(c)}
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

      {/* Record Payment Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("recordPayment")}</DialogTitle>
            <DialogDescription>
              {payCustomer?.name}
              {payCustomer && payCustomer.balance > 0
                ? ` • ${t("balance")}: ${formatCurrency(payCustomer.balance)}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePayment} className="space-y-3">
            <div className="rounded-lg bg-rose-50 p-3 text-center dark:bg-rose-950/30">
              <p className="text-xs text-muted-foreground">
                {t("outstandingBalance")}
              </p>
              <p className="text-2xl font-bold num text-rose-600 dark:text-rose-400">
                {formatCurrency(payCustomer?.balance || 0)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>
                {t("amount")} (؋) *
              </Label>
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
            <div className="space-y-1.5">
              <Label>{t("method")}</Label>
              <Select
                value={payForm.method}
                onValueChange={(v) => setPayForm({ ...payForm, method: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t("cash")}</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("note")}</Label>
              <Input
                value={payForm.note}
                onChange={(e) =>
                  setPayForm({ ...payForm, note: e.target.value })
                }
                placeholder={t("note")}
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

      {/* Customer Detail Dialog */}
      <CustomerDetailDialog
        customerId={detailId}
        station={station ?? null}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
