"use client";

import { useRef, useState } from "react";
import { Printer, X, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLanguage } from "./hooks";
import { Receipt } from "./receipt";
import { formatCurrency } from "@/lib/format";
import type { Sale, Station } from "@/lib/types";

interface ReceiptDialogProps {
  sale: Sale | null;
  station: Station | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewSale?: () => void;
}

// Shows a sale receipt with print functionality and "received amount" input for change calculation
export function ReceiptDialog({ sale, station, open, onOpenChange, onNewSale }: ReceiptDialogProps) {
  const { t } = useLanguage();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [received, setReceived] = useState("");

  if (!sale) return null;

  const receivedAmount = parseFloat(received) || 0;
  const change = Math.max(0, receivedAmount - sale.totalAmount);
  const symbol = station?.currencySymbol || "؋";

  const handlePrint = () => {
    window.print();
  };

  const handleNewSale = () => {
    onOpenChange(false);
    setReceived("");
    onNewSale?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden no-print">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <Printer className="h-4 w-4 text-primary" />
              {t("receipt")}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto bg-muted/30">
          <Receipt
            ref={receiptRef}
            sale={sale}
            station={station}
            receivedAmount={receivedAmount > 0 ? receivedAmount : undefined}
          />
        </div>

        <div className="p-4 border-t space-y-3 bg-card">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">{t("received")} ({symbol})</Label>
              <Input
                type="number"
                step="0.01"
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                placeholder={String(sale.totalAmount)}
                dir="ltr"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("change")}</Label>
              <div className="flex h-9 items-center justify-end rounded-md border bg-muted/50 px-3 font-bold num text-emerald-600 dark:text-emerald-400">
                {formatCurrency(change, symbol)}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handlePrint} className="flex-1 gap-2">
              <Printer className="h-4 w-4" /> {t("printReceipt")}
            </Button>
            {onNewSale && (
              <Button variant="outline" onClick={handleNewSale} className="gap-2">
                <Plus className="h-4 w-4" /> {t("newSaleFromReceipt")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
