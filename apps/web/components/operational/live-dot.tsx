"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function LiveDot({ active = true, className }: { active?: boolean; className?: string }) {
  if (!active) return <span className={cn("h-2 w-2 rounded-full bg-white/20", className)} />;
  return (
    <span className={cn("relative inline-flex h-2 w-2", className)}>
      <motion.span
        className="absolute inline-flex h-full w-full rounded-full bg-emerald/70"
        animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald shadow-[0_0_12px_rgba(95,255,194,0.65)]" />
    </span>
  );
}
