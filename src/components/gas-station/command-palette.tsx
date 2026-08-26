"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  LayoutDashboard,
  Cylinder,
  Droplet,
  Gauge,
  ShoppingCart,
  Users,
  Wallet,
  UserCog,
  Clock,
  Package,
  Truck,
  Building2,
  BarChart3,
  Settings,
  CornerDownLeft,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "./hooks";
import type { ViewKey } from "@/lib/types";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: ViewKey) => void;
  onQuickSale?: () => void;
}

const navItems: { key: ViewKey; icon: typeof LayoutDashboard; label: string; keywords: string[] }[] = [
  { key: "dashboard", icon: LayoutDashboard, label: "dashboard", keywords: ["home", "overview", "داشبورد"] },
  { key: "sales", icon: ShoppingCart, label: "sales", keywords: ["sell", "transaction", "فروش"] },
  { key: "tanks", icon: Cylinder, label: "tanks", keywords: ["storage", "تانک"] },
  { key: "fuelTypes", icon: Droplet, label: "fuelTypes", keywords: ["petrol", "diesel", "بنزین"] },
  { key: "pumps", icon: Gauge, label: "pumps", keywords: ["dispenser", "پمپ"] },
  { key: "refills", icon: Truck, label: "refills", keywords: ["delivery", "پر کردن"] },
  { key: "suppliers", icon: Building2, label: "suppliers", keywords: ["vendor", "supply", "تامین"] },
  { key: "customers", icon: Users, label: "customers", keywords: ["credit", "نسیه", "مشتری"] },
  { key: "expenses", icon: Wallet, label: "expenses", keywords: ["cost", "مصرف"] },
  { key: "products", icon: Package, label: "products", keywords: ["shop", "oil", "جنس"] },
  { key: "staff", icon: UserCog, label: "staff", keywords: ["employee", "کارمند"] },
  { key: "shifts", icon: Clock, label: "shifts", keywords: ["work", "شفت"] },
  { key: "reports", icon: BarChart3, label: "reports", keywords: ["analytics", "راپور"] },
  { key: "settings", icon: Settings, label: "settings", keywords: ["config", "تنظیمات"] },
];

function PaletteInner({ onNavigate, onQuickSale }: { onNavigate: (v: ViewKey) => void; onQuickSale?: () => void }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allItems = useMemo(
    () => [
      ...(onQuickSale
        ? [{ type: "action" as const, id: "quick-sale", icon: Zap, label: "quickSale", keywords: ["sell", "fast", "pos", "فروش سریع"], action: onQuickSale }]
        : []),
      ...navItems.map((item) => ({ type: "nav" as const, ...item, action: () => onNavigate(item.key) })),
    ],
    [onNavigate, onQuickSale]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter((item) => {
      const label = t(item.label as never).toLowerCase();
      return (
        label.includes(q) ||
        item.label.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [query, allItems, t]);

  const handleQueryChange = (v: string) => {
    setQuery(v);
    setSelectedIndex(0);
  };

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[selectedIndex];
      if (item) {
        item.action();
      }
    }
  };

  return (
    <div className="flex flex-col">
      {/* Search Input */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("searchModules")}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="hidden sm:flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
          ESC
        </kbd>
      </div>

      {/* Results */}
      <div className="max-h-[400px] overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <Search className="mx-auto mb-2 h-8 w-8 opacity-30" />
            {t("noResults")}
          </div>
        ) : (
          filtered.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onMouseEnter={() => setSelectedIndex(i)}
                onClick={() => item.action()}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm transition-colors",
                  i === selectedIndex ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 font-medium">{t(item.label as never)}</span>
                {item.type === "action" && (
                  <Badge variant="outline" className="text-xs">⚡</Badge>
                )}
                {i === selectedIndex && (
                  <CornerDownLeft className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <kbd className="flex h-4 items-center rounded border bg-muted px-1">↑↓</kbd>
          <span>{t("navigate")}</span>
          <kbd className="flex h-4 items-center rounded border bg-muted px-1">↵</kbd>
          <span>{t("select")}</span>
        </div>
        <span className="opacity-70">⌘K</span>
      </div>
    </div>
  );
}

export function CommandPalette({ open, onOpenChange, onNavigate, onQuickSale }: CommandPaletteProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden top-[20%] translate-y-0">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        {/* Use key to remount inner component when opening - naturally resets state */}
        {open && <PaletteInner key="open" onNavigate={onNavigate} onQuickSale={onQuickSale} />}
      </DialogContent>
    </Dialog>
  );
}
