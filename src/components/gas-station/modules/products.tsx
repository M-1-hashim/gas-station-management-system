"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  PackageSearch,
  AlertTriangle,
  Boxes,
  TrendingDown,
  Warehouse,
} from "lucide-react";
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
import { formatCurrency, formatNumber } from "@/lib/format";
import type { Product } from "@/lib/types";

// Category style lookup — colors per task spec
const PRODUCT_CATEGORIES = [
  "oil",
  "lubricant",
  "filter",
  "accessory",
  "other",
] as const;
type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

interface CategoryStyle {
  /** Solid background tint (used for accent bar + icon tile background) */
  solid: string;
  /** Outline badge classes for the category label */
  badge: string;
  /** Soft tile background tint for stat boxes */
  soft: string;
}

const CATEGORY_STYLES: Record<ProductCategory, CategoryStyle> = {
  oil: {
    solid: "#f59e0b",
    badge:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
    soft: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300",
  },
  lubricant: {
    solid: "#8b5cf6",
    badge:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300",
    soft: "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300",
  },
  filter: {
    solid: "#3b82f6",
    badge:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300",
    soft: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",
  },
  accessory: {
    solid: "#10b981",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
    soft: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300",
  },
  other: {
    solid: "#6b7280",
    badge:
      "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700/50 dark:bg-gray-800/40 dark:text-gray-300",
    soft: "bg-muted/50 text-muted-foreground",
  },
};

function getCategoryStyle(category: string): CategoryStyle {
  return (
    CATEGORY_STYLES[category as ProductCategory] ?? CATEGORY_STYLES.other
  );
}

const UNITS = ["piece", "box"] as const;
type ProductUnit = (typeof UNITS)[number];

export function ProductsModule() {
  const { t, language } = useLanguage();
  const { data: products, isLoading } = useList<Product>("products");
  const createMut = useCreate("products");
  const updateMut = useUpdate("products");
  const deleteMut = useDelete("products");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "",
    nameDa: "",
    namePs: "",
    category: "oil" as ProductCategory,
    price: "",
    cost: "",
    stock: "",
    minStock: "5",
    unit: "piece" as ProductUnit,
  });

  // Localized product name helper — mirrors fuelName() pattern from fuel-types.tsx
  const productName = (p: Product) => {
    if (language === "da") return p.nameDa || p.name;
    if (language === "ps") return p.namePs || p.name;
    return p.name;
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      nameDa: "",
      namePs: "",
      category: "oil",
      price: "",
      cost: "",
      stock: "",
      minStock: "5",
      unit: "piece",
    });
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      nameDa: p.nameDa || "",
      namePs: p.namePs || "",
      category: (p.category as ProductCategory) || "other",
      price: String(p.price),
      cost: String(p.cost),
      stock: String(p.stock),
      minStock: String(p.minStock),
      unit: (p.unit as ProductUnit) || "piece",
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error(`${t("name")} & ${t("price")} required`);
      return;
    }
    const payload = {
      ...form,
      price: parseFloat(form.price),
      cost: parseFloat(form.cost || "0"),
      stock: parseFloat(form.stock || "0"),
      minStock: parseFloat(form.minStock || "0"),
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, ...payload }, {
        onSuccess: () => {
          toast.success(t("savedSuccessfully"));
          setOpen(false);
        },
      });
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success(t("savedSuccessfully"));
          setOpen(false);
        },
      });
    }
  };

  const handleDelete = (p: Product) => {
    if (!confirm(t("confirmDelete"))) return;
    deleteMut.mutate(p.id, {
      onSuccess: () => toast.success(t("deletedSuccessfully")),
    });
  };

  // Summary metrics
  const summary = useMemo(() => {
    const list = products || [];
    const total = list.length;
    const lowStock = list.filter((p) => p.stock <= p.minStock).length;
    const inventoryValue = list.reduce((sum, p) => sum + p.price * p.stock, 0);
    return { total, lowStock, inventoryValue };
  }, [products]);

  return (
    <div className="space-y-4">
      {/* Summary cards (3-up grid mirroring sales.tsx/expenses.tsx layout) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Boxes className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t("products")}</p>
              <p className="mt-0.5 text-xl font-bold num">{summary.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {t("lowStockAlerts")}
              </p>
              <p className="mt-0.5 text-xl font-bold num text-rose-600 dark:text-rose-400">
                {summary.lowStock}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 border-border/60 lg:col-span-1">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Warehouse className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {t("stock")} · {t("total")}
              </p>
              <p className="mt-0.5 text-xl font-bold num">
                {formatCurrency(summary.inventoryValue)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header + Add button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {products?.length || 0} {t("products")}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> {t("addProduct")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editing ? t("editProduct") : t("addProduct")}
              </DialogTitle>
              <DialogDescription>{t("products")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>{t("productName")} (EN)</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Engine Oil 5W-30"
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
                    placeholder="تیل موتور"
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
                    placeholder="د موټر تیل"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("productCategory")}</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) =>
                      setForm({ ...form, category: v as ProductCategory })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {t(c)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("unit")}</Label>
                  <Select
                    value={form.unit}
                    onValueChange={(v) =>
                      setForm({ ...form, unit: v as ProductUnit })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {t(u)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("price")} (؋)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    placeholder="450"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("cost")} (؋)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.cost}
                    onChange={(e) =>
                      setForm({ ...form, cost: e.target.value })
                    }
                    placeholder="380"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("stock")}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: e.target.value })
                    }
                    placeholder="20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("minStock")}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.minStock}
                    onChange={(e) =>
                      setForm({ ...form, minStock: e.target.value })
                    }
                    placeholder="5"
                  />
                </div>
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

      {/* Card grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="h-48 animate-pulse bg-muted/30" />
            </Card>
          ))
        ) : products?.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <Package className="h-10 w-10 opacity-50" />
              <p>{t("noData")}</p>
            </CardContent>
          </Card>
        ) : (
          products?.map((p) => {
            const style = getCategoryStyle(p.category);
            const isLow = p.stock <= p.minStock;
            const isCritical = p.minStock > 0 && p.stock <= p.minStock * 0.5;
            // Visual target = 3x minStock (or actual stock if higher) — gives a sensible progress ratio
            const target = Math.max(p.minStock * 3, p.stock, 1);
            const pct = Math.min(100, (p.stock / target) * 100);
            const profit = p.price - p.cost;
            return (
              <Card
                key={p.id}
                className={`card-hover overflow-hidden ${
                  isLow
                    ? "border-rose-300 dark:border-rose-900"
                    : "border-border/60"
                }`}
              >
                <div
                  className="h-1.5"
                  style={{ backgroundColor: style.solid, opacity: isLow ? 0.55 : 1 }}
                />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
                        style={{ backgroundColor: style.solid }}
                      >
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{productName(p)}</p>
                        <Badge
                          variant="outline"
                          className={`mt-1 text-xs ${style.badge}`}
                        >
                          {t(p.category as ProductCategory)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-600"
                        onClick={() => handleDelete(p)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Price (large) + cost (small) */}
                  <div className="mt-4 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("price")}</p>
                      <p className="text-2xl font-bold num leading-tight">
                        {formatCurrency(p.price)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground num">
                        {t("cost")}: {formatCurrency(p.cost)} ·{" "}
                        <span className="text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(profit)}
                        </span>
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {t(p.unit as ProductUnit)}
                    </Badge>
                  </div>

                  {/* Stock progress bar */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("stock")}</span>
                      <span className="font-semibold num">
                        {formatNumber(p.stock, 0)}{" "}
                        <span className="text-muted-foreground text-xs">
                          / {t("minStock")} {formatNumber(p.minStock, 0)}
                        </span>
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      className={`h-2.5 ${
                        isCritical
                          ? "[&>div]:bg-rose-500"
                          : isLow
                          ? "[&>div]:bg-amber-500"
                          : "[&>div]:bg-emerald-500"
                      }`}
                    />
                    <div className="flex items-center justify-between text-xs">
                      <span className="num">{pct.toFixed(0)}%</span>
                      {isLow && (
                        <Badge
                          variant="destructive"
                          className={isCritical ? "pulse-warning" : ""}
                        >
                          <AlertTriangle className="me-1 h-3 w-3" />
                          {isCritical ? t("lowStockAlerts") : t("minStock")}
                        </Badge>
                      )}
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

// Re-export icon for downstream use (e.g. nav header) — matches pattern of other modules
export { Package, PackageSearch };
