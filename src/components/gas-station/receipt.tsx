"use client";

import { forwardRef } from "react";
import { Fuel } from "lucide-react";
import { useLanguage } from "./hooks";
import { formatCurrency, formatDateTime, formatLiters, formatNumber } from "@/lib/format";
import type { Sale, Station } from "@/lib/types";

interface ReceiptProps {
  sale: Sale;
  station: Station | null;
  receivedAmount?: number;
}

// A printable receipt component for fuel sales
// Renders a thermal-printer-style receipt that can be printed via window.print()
export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  function Receipt({ sale, station, receivedAmount }, ref) {
    const { t, language } = useLanguage();

    const stationName = () => {
      if (!station) return "تانک تیل";
      if (language === "da") return station.nameDa || station.name;
      if (language === "ps") return station.namePs || station.name;
      return station.name;
    };

    const fuelName = () => {
      if (language === "da") return sale.fuelType.nameDa || sale.fuelType.name;
      if (language === "ps") return sale.fuelType.namePs || sale.fuelType.name;
      return sale.fuelType.name;
    };

    const previousReading = sale.pump ? sale.pump.reading - sale.liters : 0;
    const currentReading = sale.pump ? sale.pump.reading : 0;
    const change = receivedAmount ? receivedAmount - sale.totalAmount : 0;
    const invoiceNo = sale.id.slice(-6).toUpperCase();

    return (
      <div
        ref={ref}
        className="receipt-print mx-auto w-[320px] bg-white p-5 text-black"
        style={{ fontFamily: "'Courier New', monospace" }}
        dir={language === "en" ? "ltr" : "rtl"}
      >
        {/* Header */}
        <div className="text-center border-b-2 border-dashed border-black pb-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Fuel className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold leading-tight">{stationName()}</h1>
          {station?.phone && (
            <p className="text-xs mt-1" dir="ltr">☎ {station.phone}</p>
          )}
          {station?.address && (
            <p className="text-xs mt-0.5">{station.address}</p>
          )}
          <p className="text-[10px] mt-1 opacity-70">{t("fuelStationReceipt")}</p>
        </div>

        {/* Invoice Info */}
        <div className="py-2 border-b border-dashed border-black text-xs space-y-0.5">
          <div className="flex justify-between">
            <span>{t("invoiceNoShort")}:</span>
            <span className="font-bold">#{invoiceNo}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("date")}:</span>
            <span dir="ltr">{formatDateTime(sale.date)}</span>
          </div>
        </div>

        {/* Fuel Details */}
        <div className="py-2 border-b border-dashed border-black">
          <div className="text-center text-xs font-bold mb-1">{fuelName()}</div>
          {sale.pump && (
            <div className="text-xs space-y-0.5">
              <div className="flex justify-between">
                <span>{t("previousReading")}:</span>
                <span dir="ltr" className="font-mono">{formatNumber(previousReading, 2)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("pumpReading")}:</span>
                <span dir="ltr" className="font-mono">{formatNumber(currentReading, 2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>{t("dispensed")}:</span>
                <span dir="ltr" className="font-mono">{formatLiters(sale.liters)}</span>
              </div>
            </div>
          )}
          {!sale.pump && (
            <div className="flex justify-between text-xs font-bold">
              <span>{t("liters")}:</span>
              <span dir="ltr">{formatLiters(sale.liters)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs mt-1">
            <span>{t("ratePerLiter")}:</span>
            <span dir="ltr" className="font-mono">{formatCurrency(sale.pricePerLiter, station?.currencySymbol || "؋")}</span>
          </div>
        </div>

        {/* Total */}
        <div className="py-2 border-b-2 border-dashed border-black">
          <div className="flex justify-between items-center text-base font-bold">
            <span>{t("amountDue")}:</span>
            <span dir="ltr" className="font-mono">{formatCurrency(sale.totalAmount, station?.currencySymbol || "؋")}</span>
          </div>
          {receivedAmount !== undefined && receivedAmount > 0 && (
            <>
              <div className="flex justify-between text-xs mt-1">
                <span>{t("received")}:</span>
                <span dir="ltr" className="font-mono">{formatCurrency(receivedAmount, station?.currencySymbol || "؋")}</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span>{t("change")}:</span>
                <span dir="ltr" className="font-mono">{formatCurrency(change, station?.currencySymbol || "؋")}</span>
              </div>
            </>
          )}
        </div>

        {/* Payment & Customer */}
        <div className="py-2 border-b border-dashed border-black text-xs space-y-0.5">
          <div className="flex justify-between">
            <span>{t("paymentType")}:</span>
            <span className="font-bold uppercase">{sale.paymentType === "cash" ? t("cash") : t("credit")}</span>
          </div>
          {sale.customer && (
            <div className="flex justify-between">
              <span>{t("customer")}:</span>
              <span className="font-bold">{sale.customer.name}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-3 text-xs">
          <p className="font-bold">{t("receiptThankYou")}</p>
          <p className="opacity-80 mt-0.5">{t("receiptVisitAgain")}</p>
          <div className="mt-4 flex justify-between text-[10px] opacity-60">
            <span>___________________</span>
            <span>___________________</span>
          </div>
          <div className="mt-1 flex justify-between text-[10px]">
            <span>{t("customerSignature")}</span>
            <span>{t("attendantSignature")}</span>
          </div>
        </div>
      </div>
    );
  }
);
