"use client";

import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

interface TankGaugeProps {
  currentLevel: number;
  capacity: number;
  minLevel: number;
  color: string;
  size?: number;
  label?: string;
}

export function TankGauge({
  currentLevel,
  capacity,
  minLevel,
  color,
  size = 120,
  label,
}: TankGaugeProps) {
  const pct = capacity > 0 ? Math.min(100, (currentLevel / capacity) * 100) : 0;
  const isLow = currentLevel <= minLevel;
  const isCritical = currentLevel <= minLevel * 0.5;

  // Determine gauge color
  const gaugeColor = isCritical ? "#ef4444" : isLow ? "#f59e0b" : color;

  // SVG circle properties
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90 transform"
        style={{ filter: `drop-shadow(0 2px 4px ${gaugeColor}30)` }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease",
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "text-lg font-bold num",
            isCritical && "text-rose-600 dark:text-rose-400",
            isLow && !isCritical && "text-amber-600 dark:text-amber-400",
            !isLow && "text-foreground"
          )}
        >
          {pct.toFixed(0)}%
        </span>
        {label && (
          <span className="text-[10px] text-muted-foreground mt-0.5">{label}</span>
        )}
      </div>
    </div>
  );
}
