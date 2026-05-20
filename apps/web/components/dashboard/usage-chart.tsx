"use client";

import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Props = { executions: number; tokens: number; pulseKey: number };

export function UsageChart({ executions, tokens, pulseKey }: Props) {
  const base = Math.max(executions, 4);
  const data = Array.from({ length: 14 }).map((_, i) => ({
    label: `W${i + 1}`,
    runs: Math.round(base * (0.4 + Math.sin(i * 0.7 + pulseKey * 0.1) * 0.35 + i * 0.08)),
    tokens: Math.round((tokens / 14) * (0.5 + Math.cos(i * 0.5) * 0.25 + i * 0.05))
  }));

  return (
    <div className="relative mt-4 h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="runsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(94,231,255,0.45)" />
              <stop offset="100%" stopColor="rgba(94,231,255,0)" />
            </linearGradient>
            <linearGradient id="tokFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(157,124,255,0.35)" />
              <stop offset="100%" stopColor="rgba(157,124,255,0)" />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
          <Tooltip
            contentStyle={{ background: "rgba(9,13,28,0.92)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12 }}
            labelStyle={{ color: "#8a93a6" }}
          />
          <Area type="monotone" dataKey="runs" stroke="#5ee7ff" fill="url(#runsFill)" strokeWidth={2} />
          <Area type="monotone" dataKey="tokens" stroke="#9d7cff" fill="url(#tokFill)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
      <motion.div
        key={pulseKey}
        className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-cyan/0"
        initial={{ boxShadow: "0 0 0 rgba(94,231,255,0)" }}
        animate={{ boxShadow: ["0 0 0 rgba(94,231,255,0)", "0 0 24px rgba(94,231,255,0.08)", "0 0 0 rgba(94,231,255,0)"] }}
        transition={{ duration: 1.2 }}
      />
    </div>
  );
}
