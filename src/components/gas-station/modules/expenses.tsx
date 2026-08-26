"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  Wallet,
  CalendarDays,
  Receipt,
  Zap,
  Users,
  Wrench,
  Home,
  Truck,
  MoreHorizontal,
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
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useLanguage } from "../hooks";
import { useList, useCreate, useUpdate, useDelete } from "../api-hooks";
import { formatCurrency, formatDate, isToday, toISODate } from "@/lib/format";
import type { Expense } from "@/lib/types";

const CATEGORIES = [
  "electricity",
  "salary",
  "maintenance",
  "rent",
  "transport",
  "other",
] as const;

type CategoryKey = (typeof CATEGORIES)[number];

interface CategoryStyle {
  Icon: React.ComponentType<{ className?: string }>;
  badge: string;
  tile: string;
}

const CATEGORY_STYLES: Record<CategoryKey, CategoryStyle> = {
  electricity: {
    Icon: Zap,
    badge:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
    tile: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  },
  salary: {
    Icon: Users,
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
    tile:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
  maintenance: {
    Icon: Wrench,
    badge:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300",
    tile:
      "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  },
  rent: {
    Icon: Home,
    badge:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300",
    tile: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  },
  transport: {
    Icon: Truck,
    badge:
      "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/50 dark:bg-cyan-950/40 dark:text-cyan-300",
    tile: "bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400",
  },
  other: {
    Icon: MoreHorizontal,
    badge:
      "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700/50 dark:bg-gray-800/40 dark:text-gray-300",
    tile: "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400",
  },
};

function getCategoryStyle(category: string): CategoryStyle {
  return (
    CATEGORY_STYLES[category as CategoryKey] ?? CATEGORY_STYLES.other
  );
}

export function ExpensesModule() {
  const { t } = useLanguage();
  const { data: expenses, isLoading } = useList<Expense>("expenses");
  const createMut = useCreate("expenses");
  const updateMut = useUpdate("expenses");
  const deleteMut = useDelete("expenses");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [form, setForm] = useState({
    category: "electricity" as string,
    amount: "",
    description: "",
    date: toISODate(new Date()),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      category: "electricity",
      amount: "",
      description: "",
      date: toISODate(new Date()),
    });
    setOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setForm({
      category: expense.category,
      amount: String(expense.amount),
      description: expense.description || "",
      date: toISODate(new Date(expense.date)),
    });
    setOpen(true);
  };

  const filteredExpenses = useMemo(() => {
    let result = expenses || [];
    if (categoryFilter !== "all") {
      result = result.filter((e) => e.category === categoryFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.category.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          t(e.category as CategoryKey).toLowerCase().includes(q),
      );
    }
    return result;
  }, [expenses, search, categoryFilter, t]);

  const totalAmount = filteredExpenses.reduce(
    (sum, e) => sum + e.amount,
    0,
  );
  const todayExpenses = (expenses || []).filter((e) => isToday(e.date));
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.amount || !form.date) {
      toast.error(
        `${t("expenseCategory")}, ${t("amount")}, ${t("date")}`,
      );
      return;
    }
    const amount = parseFloat(form.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error(t("amount"));
      return;
    }
    const payload = {
      category: form.category,
      amount,
      description: form.description || null,
      date: form.date,
    };
    if (editing) {
      updateMut.mutate(
        { id: editing.id, ...payload },
        {
          onSuccess: () => {
            toast.success(t("savedSuccessfully"));
            setOpen(false);
          },
        },
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

  const handleDelete = (expense: Expense) => {
    if (!confirm(t("confirmDelete"))) return;
    deleteMut.mutate(expense.id, {
      onSuccess: () => toast.success(t("deletedSuccessfully")),
    });
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                <Wallet className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground">{t("totalExpenses")}</p>
            </div>
            <p className="mt-2 text-xl font-bold num text-rose-600 dark:text-rose-400">
              {formatCurrency(totalAmount)}
            </p>
            <p className="text-xs text-muted-foreground">
              {filteredExpenses.length} {t("expenses")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CalendarDays className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground">{t("today")}</p>
            </div>
            <p className="mt-2 text-xl font-bold num">
              {formatCurrency(todayTotal)}
            </p>
            <p className="text-xs text-muted-foreground">
              {todayExpenses.length} {t("expenses")}
            </p>
          </CardContent>
        </Card>
        <Card className="col-span-2 border-border/60 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <Receipt className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground">{t("expenses")}</p>
            </div>
            <p className="mt-2 text-xl font-bold num">
              {expenses?.length || 0}
            </p>
            <p className="text-xs text-muted-foreground">{t("total")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search")}
              className="ps-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <Filter className="me-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all")}</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {t(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" /> {t("addExpense")}
        </Button>
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <ScrollArea className="max-h-[600px]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("category")}</TableHead>
                <TableHead>{t("description")}</TableHead>
                <TableHead className="text-end">{t("amount")}</TableHead>
                <TableHead className="text-end">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-6" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <Wallet className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    {t("noData")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => {
                  const style = getCategoryStyle(expense.category);
                  const Icon = style.Icon;
                  return (
                    <TableRow key={expense.id} className="hover:bg-muted/50">
                      <TableCell className="whitespace-nowrap text-xs num">
                        {formatDate(expense.date)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`gap-1.5 ${style.badge}`}
                        >
                          <Icon className="h-3 w-3" />
                          {t(expense.category as CategoryKey)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[280px] truncate text-sm">
                        {expense.description || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-end num font-semibold text-rose-600 dark:text-rose-400">
                        − {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(expense)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-600"
                            onClick={() => handleDelete(expense)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("editExpense") : t("addExpenseTitle")}
            </DialogTitle>
            <DialogDescription>{t("expenseCategory")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("expenseCategory")} *</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("expenseCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => {
                    const cs = CATEGORY_STYLES[c];
                    const Icon = cs.Icon;
                    return (
                      <SelectItem key={c} value={c}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5" />
                          {t(c)}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("amount")} (؋) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("date")} *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("description")}</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder={t("description")}
              />
            </div>
            {form.amount && parseFloat(form.amount) > 0 && (
              <div className="rounded-lg bg-rose-50 p-3 text-center dark:bg-rose-950/30">
                <p className="text-xs text-muted-foreground">{t("total")}</p>
                <p className="text-2xl font-bold num text-rose-600 dark:text-rose-400">
                  − {formatCurrency(parseFloat(form.amount))}
                </p>
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
  );
}
