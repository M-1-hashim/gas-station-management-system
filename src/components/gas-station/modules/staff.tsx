"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  UserCog,
  Phone,
  Clock,
  Users,
  UserCheck,
  Wallet,
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
import { formatCurrency } from "@/lib/format";
import type { Staff } from "@/lib/types";

// Position style lookup — colors per task spec
const STAFF_POSITIONS = [
  "manager",
  "attendant",
  "accountant",
  "guard",
] as const;
type StaffPosition = (typeof STAFF_POSITIONS)[number];

interface PositionStyle {
  /** Solid background tint for avatar circle */
  avatar: string;
  /** Outline badge classes for the position label */
  badge: string;
}

const POSITION_STYLES: Record<StaffPosition, PositionStyle> = {
  // manager = emerald (primary)
  manager: {
    avatar:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  // attendant = amber
  attendant: {
    avatar:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    badge:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
  },
  // accountant = violet
  accountant: {
    avatar:
      "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    badge:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300",
  },
  // guard = blue
  guard: {
    avatar: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    badge:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300",
  },
};

function getPositionStyle(position: string): PositionStyle {
  return (
    POSITION_STYLES[position as StaffPosition] ?? POSITION_STYLES.attendant
  );
}

// Build initials (up to 2 letters) for the avatar circle
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function StaffModule() {
  const { t } = useLanguage();
  const { data: staff, isLoading } = useList<Staff>("staff");
  const createMut = useCreate("staff");
  const updateMut = useUpdate("staff");
  const deleteMut = useDelete("staff");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    position: "attendant" as StaffPosition,
    salary: "",
    active: true,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      phone: "",
      position: "attendant",
      salary: "",
      active: true,
    });
    setOpen(true);
  };

  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({
      name: s.name,
      phone: s.phone || "",
      position: (s.position as StaffPosition) || "attendant",
      salary: String(s.salary),
      active: s.active,
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error(`${t("name")} required`);
      return;
    }
    const payload = {
      ...form,
      phone: form.phone || null,
      salary: parseFloat(form.salary || "0"),
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

  const handleDelete = (s: Staff) => {
    if (!confirm(t("confirmDelete"))) return;
    deleteMut.mutate(s.id, {
      onSuccess: () => toast.success(t("deletedSuccessfully")),
    });
  };

  // Summary metrics
  const summary = useMemo(() => {
    const list = staff || [];
    const total = list.length;
    const active = list.filter((s) => s.active).length;
    const monthlySalary = list
      .filter((s) => s.active)
      .reduce((sum, s) => sum + s.salary, 0);
    return { total, active, monthlySalary };
  }, [staff]);

  return (
    <div className="space-y-4">
      {/* Summary cards (3-up grid mirroring sales.tsx/expenses.tsx/products.tsx) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t("staff")}</p>
              <p className="mt-0.5 text-xl font-bold num">{summary.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t("active")}</p>
              <p className="mt-0.5 text-xl font-bold num">{summary.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 border-border/60 lg:col-span-1">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {t("salary")} · {t("thisMonth")}
              </p>
              <p className="mt-0.5 text-xl font-bold num">
                {formatCurrency(summary.monthlySalary)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header + Add button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {staff?.length || 0} {t("staff")}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> {t("addStaff")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editing ? t("editStaff") : t("addStaff")}
              </DialogTitle>
              <DialogDescription>{t("staff")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>{t("name")}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ahmad Khan"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("phone")}</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="0700 000 000"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("position")}</Label>
                  <Select
                    value={form.position}
                    onValueChange={(v) =>
                      setForm({ ...form, position: v as StaffPosition })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAFF_POSITIONS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {t(p)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("salary")} (؋)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.salary}
                  onChange={(e) =>
                    setForm({ ...form, salary: e.target.value })
                  }
                  placeholder="15000"
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

      {/* Card grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="h-48 animate-pulse bg-muted/30" />
            </Card>
          ))
        ) : staff?.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <UserCog className="h-10 w-10 opacity-50" />
              <p>{t("noData")}</p>
            </CardContent>
          </Card>
        ) : (
          staff?.map((s) => {
            const style = getPositionStyle(s.position);
            const initials = getInitials(s.name);
            return (
              <Card
                key={s.id}
                className="card-hover overflow-hidden border-border/60"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full font-semibold ${style.avatar}`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{s.name}</p>
                        <Badge
                          variant="outline"
                          className={`mt-1 text-xs ${style.badge}`}
                        >
                          {t(s.position as StaffPosition)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-600"
                        onClick={() => handleDelete(s)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Phone row */}
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {s.phone ? (
                      <span className="num truncate" dir="ltr">
                        {s.phone}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>

                  {/* Salary + shifts count info tiles */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/30">
                      <p className="text-xs text-muted-foreground">
                        {t("salary")}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold num text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(s.salary)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-xs text-muted-foreground">
                        {t("shifts")}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold num flex items-center justify-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {s._count?.shifts || 0}
                      </p>
                    </div>
                  </div>

                  {/* Active/inactive badge footer */}
                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                    <span className="text-xs text-muted-foreground">
                      {t("status")}
                    </span>
                    <Badge
                      variant={s.active ? "secondary" : "outline"}
                      className={`text-xs ${
                        s.active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : ""
                      }`}
                    >
                      {s.active ? t("active") : t("inactive")}
                    </Badge>
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

export { UserCog };
