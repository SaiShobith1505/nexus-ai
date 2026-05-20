"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LiveDot } from "@/components/operational/live-dot";
import type { DashboardSummary } from "@/lib/api";

export function ActivityFeed({ activity }: { activity: DashboardSummary["activity"] }) {
  return (
    <div className="mt-5 grid gap-3">
      <div className="flex items-center gap-2 text-xs text-white/40">
        <LiveDot /> Live execution feed
      </div>
      <AnimatePresence initial={false}>
        {activity.length === 0 && (
          <p className="text-sm text-white/45">No recent executions. Launch agents from the playground.</p>
        )}
        {activity.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium capitalize">{item.status}</p>
              <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] text-emerald">{item.tokens} tok</span>
            </div>
            <p className="mt-1 text-xs text-white/45">{new Date(item.created_at).toLocaleString()}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
