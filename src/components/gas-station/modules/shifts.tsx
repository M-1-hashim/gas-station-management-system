"use client";

import { useState } from "react";
import { Plus, Clock, Play, Square, User, Phone } from "lucide-react";
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
import { useList, useCreate, useUpdate } from "../api-hooks";
import { formatCurrency, formatDateTime, formatTime } from "@/lib/format";
import type { Shift, Staff } from "@/lib/types";

export function ShiftsModule() {
  const { t } = useLanguage();
  const { data: shifts, isLoading } = useList<Shift>("shifts");
  const { data: staff } = useList<Staff>("staff");
  const createMut = useCreate("shifts");
  const updateMut = useUpdate("shifts");

  const [startOpen, setStartOpen] = useState(false);
  const [endShift, setEndShift] = useState<Shift | null>(null);
  const [startForm, setStartForm] = useState({ staffId: "", openingCash: "", note: "" });
  const [endForm, setEndForm] = useState({ closingCash: "", note: "" });

  const openStart = () => {
    setStartForm({ staffId: staff?.find((s) => s.active)?.id || "", openingCash: "", note: "" });
    setStartOpen(true);
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startForm.staffId) {
      toast.error(t("staff") + " required");
      return;
    }
    createMut.mutate(
      { ...startForm, openingCash: parseFloat(startForm.openingCash || "0") },
      { onSuccess: () => { toast.success(t("savedSuccessfully")); setStartOpen(false); } }
    );
  };

  const handleEnd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!endShift) return;
    updateMut.mutate(
      {
        id: endShift.id,
        action: "end",
        closingCash: parseFloat(endForm.closingCash || "0"),
        note: endForm.note,
      },
      { onSuccess: () => { toast.success(t("savedSuccessfully")); setEndShift(null); setEndForm({ closingCash: "", note: "" }); } }
    );
  };

  const openShifts = shifts?.filter((s) => s.status === "open") || [];
  const closedShifts = shifts?.filter((s) => s.status === "closed") || [];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Play className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("activeShifts")}</p>
              <p className="text-xl font-bold num">{openShifts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Square className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("closed")}</p>
              <p className="text-xl font-bold num">{closedShifts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 border-border/60 lg:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("staff")}</p>
              <p className="text-xl font-bold num">{staff?.filter((s) => s.active).length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{shifts?.length || 0} {t("shifts")}</p>
        <Button onClick={openStart} className="gap-2" disabled={!staff?.length}>
          <Plus className="h-4 w-4" /> {t("startShift")}
        </Button>
      </div>

      {/* Active Shifts */}
      {openShifts.length > 0 && (
        <Card className="border-emerald-300 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
          <CardContent className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              <Play className="h-4 w-4" /> {t("activeShifts")}
            </h3>
            <div className="space-y-2">
              {openShifts.map((shift) => (
                <div key={shift.id} className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-card p-3 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-900">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {shift.staff.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{shift.staff.name}</p>
                      <p className="text-xs text-muted-foreground num">
                        {t("startTime")}: {formatDateTime(shift.startTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-end">
                      <p className="text-xs text-muted-foreground">{t("openingCash")}</p>
                      <p className="font-semibold num">{formatCurrency(shift.openingCash)}</p>
                    </div>
                    <Button size="sm" variant="destructive" className="gap-2" onClick={() => setEndShift(shift)}>
                      <Square className="h-3.5 w-3.5" /> {t("endShift")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Shifts Table */}
      <Card className="border-border/60">
        <ScrollArea className="max-h-[500px]">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>{t("staff")}</TableHead>
                <TableHead>{t("startTime")}</TableHead>
                <TableHead>{t("endTime")}</TableHead>
                <TableHead className="text-end">{t("openingCash")}</TableHead>
                <TableHead className="text-end">{t("closingCash")}</TableHead>
                <TableHead>{t("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-6" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : shifts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Clock className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    {t("noData")}
                  </TableCell>
                </TableRow>
              ) : (
                shifts?.map((shift) => (
                  <TableRow key={shift.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          {shift.staff.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{shift.staff.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs num whitespace-nowrap">{formatDateTime(shift.startTime)}</TableCell>
                    <TableCell className="text-xs num whitespace-nowrap">{shift.endTime ? formatDateTime(shift.endTime) : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-end num">{formatCurrency(shift.openingCash)}</TableCell>
                    <TableCell className="text-end num">{shift.closingCash != null ? formatCurrency(shift.closingCash) : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>
                      <Badge variant={shift.status === "open" ? "default" : "secondary"} className={shift.status === "open" ? "bg-emerald-600" : ""}>
                        {shift.status === "open" ? t("open") : t("closed")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Start Shift Dialog */}
      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("startShift")}</DialogTitle>
            <DialogDescription>{t("shifts")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStart} className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("staff")} *</Label>
              <Select value={startForm.staffId} onValueChange={(v) => setStartForm({ ...startForm, staffId: v })}>
                <SelectTrigger><SelectValue placeholder={t("staff")} /></SelectTrigger>
                <SelectContent>
                  {staff?.filter((s) => s.active).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({t(s.position as never)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("openingCash")} (؋)</Label>
              <Input type="number" step="0.01" value={startForm.openingCash} onChange={(e) => setStartForm({ ...startForm, openingCash: e.target.value })} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("note")}</Label>
              <Input value={startForm.note} onChange={(e) => setStartForm({ ...startForm, note: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStartOpen(false)}>{t("cancel")}</Button>
              <Button type="submit" disabled={createMut.isPending} className="gap-2">
                <Play className="h-4 w-4" /> {t("startShift")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* End Shift Dialog */}
      <Dialog open={!!endShift} onOpenChange={(o) => !o && setEndShift(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("endShift")}</DialogTitle>
            <DialogDescription>
              {endShift?.staff.name} • {t("startTime")}: {endShift && formatTime(endShift.startTime)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEnd} className="space-y-3">
            {endShift && (
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">{t("openingCash")}</p>
                <p className="text-lg font-bold num">{formatCurrency(endShift.openingCash)}</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>{t("closingCash")} (؋) *</Label>
              <Input type="number" step="0.01" value={endForm.closingCash} onChange={(e) => setEndForm({ ...endForm, closingCash: e.target.value })} placeholder="0" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>{t("note")}</Label>
              <Input value={endForm.note} onChange={(e) => setEndForm({ ...endForm, note: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEndShift(null)}>{t("cancel")}</Button>
              <Button type="submit" variant="destructive" disabled={updateMut.isPending} className="gap-2">
                <Square className="h-4 w-4" /> {t("endShift")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
