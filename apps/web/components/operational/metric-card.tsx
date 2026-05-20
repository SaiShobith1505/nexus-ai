"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { LiveDot } from "@/components/operational/live-dot";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  live?: boolean;
  pulseKey?: number;
  format?: (v: number) => string;
  className?: string;
};

export function MetricCard({ label, value, icon: Icon, live, pulseKey, format, className }: MetricCardProps) {
  const numeric = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]/g, "")) || 0;
  const spring = useSpring(numeric, { stiffness: 90, damping: 22 });
  const display = useTransform(spring, (v) => (format ? format(v) : typeof value === "string" && Number.isNaN(numeric) ? value : Math.round(v).toLocaleString()));

  useEffect(() => {
    spring.set(numeric);
  }, [numeric, spring, pulseKey]);

  return (
    <Card className={cn("group relative min-h-36 overflow-hidden edge-glow", className)}>
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan/10 blur-2xl transition group-hover:bg-cyan/20" />
      <div className="flex items-center justify-between">
        <Icon className="text-cyan" size={22} />
        {live && (
          <span className="inline-flex items-center gap-2 text-xs text-white/45">
            <LiveDot /> Live
          </span>
        )}
      </div>
      <p className="mt-7 text-sm text-white/45">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">
        <motion.span>{display}</motion.span>
      </p>
    </Card>
  );
}
