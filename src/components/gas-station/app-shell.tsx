"use client";

import { useState } from "react";
import {
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
  BarChart3,
  Settings,
  Menu,
  Moon,
  Sun,
  Languages,
  Fuel,
  X,
  Search,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "./hooks";
import { languages, type Language } from "@/lib/i18n/translations";
import type { ViewKey, Station } from "@/lib/types";
import { DashboardModule } from "./modules/dashboard";
import { TanksModule } from "./modules/tanks";
import { FuelTypesModule } from "./modules/fuel-types";
import { PumpsModule } from "./modules/pumps";
import { SalesModule } from "./modules/sales";
import { CustomersModule } from "./modules/customers";
import { ExpensesModule } from "./modules/expenses";
import { StaffModule } from "./modules/staff";
import { ShiftsModule } from "./modules/shifts";
import { ProductsModule } from "./modules/products";
import { RefillsModule } from "./modules/refills";
import { ReportsModule } from "./modules/reports";
import { SettingsModule } from "./modules/settings";
import { QuickSaleFab } from "./quick-sale-fab";
import { CommandPalette } from "./command-palette";
import { useEffect } from "react";

const navItems: { key: ViewKey; icon: typeof LayoutDashboard; label: string }[] = [
  { key: "dashboard", icon: LayoutDashboard, label: "dashboard" },
  { key: "sales", icon: ShoppingCart, label: "sales" },
  { key: "tanks", icon: Cylinder, label: "tanks" },
  { key: "fuelTypes", icon: Droplet, label: "fuelTypes" },
  { key: "pumps", icon: Gauge, label: "pumps" },
  { key: "refills", icon: Truck, label: "refills" },
  { key: "customers", icon: Users, label: "customers" },
  { key: "expenses", icon: Wallet, label: "expenses" },
  { key: "products", icon: Package, label: "products" },
  { key: "staff", icon: UserCog, label: "staff" },
  { key: "shifts", icon: Clock, label: "shifts" },
  { key: "reports", icon: BarChart3, label: "reports" },
  { key: "settings", icon: Settings, label: "settings" },
];

function getStationName(station: Station | null, language: Language): string {
  if (!station) return "تانک تیل";
  if (language === "da") return station.nameDa || station.name;
  if (language === "ps") return station.namePs || station.name;
  return station.name;
}

export function AppShell({ station }: { station: Station | null }) {
  const { t, language, dir, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Global keyboard shortcuts: Cmd/Ctrl+K for command palette, "q" for quick sale
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const navList = (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.key;
        return (
          <button
            key={item.key}
            onClick={() => handleNav(item.key)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="truncate">{t(item.label as never)}</span>
          </button>
        );
      })}
    </nav>
  );

  const sidebarHeader = (
    <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Fuel className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-bold leading-tight">
          {getStationName(station, language)}
        </h1>
        <p className="truncate text-xs text-muted-foreground">{t("appTagline")}</p>
      </div>
    </div>
  );

  const handleNav = (key: ViewKey) => {
    setActiveView(key);
    setMobileOpen(false);
  };

  const renderModule = () => {
    switch (activeView) {
      case "dashboard": return <DashboardModule onNavigate={handleNav} />;
      case "sales": return <SalesModule station={station} />;
      case "tanks": return <TanksModule />;
      case "fuelTypes": return <FuelTypesModule />;
      case "pumps": return <PumpsModule />;
      case "refills": return <RefillsModule />;
      case "customers": return <CustomersModule />;
      case "expenses": return <ExpensesModule />;
      case "products": return <ProductsModule />;
      case "staff": return <StaffModule />;
      case "shifts": return <ShiftsModule station={station} />;
      case "reports": return <ReportsModule />;
      case "settings": return <SettingsModule />;
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-sidebar-border bg-sidebar lg:flex">
          {sidebarHeader}
          <div className="flex-1 overflow-y-auto py-2">
            {navList}
          </div>
          <div className="border-t border-sidebar-border p-3">
            <div className="rounded-lg bg-sidebar-accent/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-sidebar-foreground">{t("manageYourStation")}</p>
              <p className="mt-1">v1.0 • Offline Mode</p>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side={dir === "rtl" ? "right" : "left"} className="w-72 p-0">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
                <div className="flex-1">{sidebarHeader}</div>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="h-8 w-8 shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {navList}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-6">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold lg:text-lg">
                {t(navItems.find((n) => n.key === activeView)?.label as never ?? "dashboard")}
              </h2>
              <p className="hidden text-xs text-muted-foreground sm:block">
                {new Date().toLocaleDateString(language === "en" ? "en-GB" : "fa-IR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Command Palette Trigger (desktop) */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground min-w-[180px]"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="text-xs">{t("searchModules")}</span>
              <kbd className="ms-auto px-1.5 py-0.5 rounded border bg-background text-[10px] font-mono">⌘K</kbd>
            </button>

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Languages className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {languages.find((l) => l.code === language)?.nativeName}
                  </span>
                  <span className="sm:hidden">{languages.find((l) => l.code === language)?.flag}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={cn(
                      "cursor-pointer gap-3",
                      language === lang.code && "bg-accent"
                    )}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{lang.nativeName}</span>
                      <span className="text-xs text-muted-foreground">{lang.name}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9"
              suppressHydrationWarning
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </header>

          {/* Module Content */}
          <main className="flex-1 p-4 lg:p-6">
            {renderModule()}
          </main>

          {/* Footer */}
          <footer className="mt-auto border-t border-border bg-card px-4 py-4 lg:px-6">
            <div className="flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-row">
              <p className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-primary" />
                <span>{getStationName(station, language)}</span>
              </p>
              <p className="text-xs flex items-center gap-3">
                <span className="hidden sm:flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">⌘K</kbd>
                  <span className="opacity-70">{t("commandPalette")}</span>
                </span>
                <span>{t("appName")} • {new Date().getFullYear()}</span>
              </p>
            </div>
          </footer>
        </div>
      </div>

      {/* Quick Sale FAB - always accessible */}
      <QuickSaleFab station={station} />

      {/* Command Palette */}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onNavigate={(v) => { handleNav(v); }}
        onQuickSale={() => {
          // Trigger FAB click by setting a flag - simpler: just open it via state
          const fab = document.querySelector<HTMLButtonElement>("[aria-label=\"" + t("quickSale") + "\"]");
          fab?.click();
        }}
      />
    </div>
  );
}
