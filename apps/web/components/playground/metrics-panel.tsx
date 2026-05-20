"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Activity, Coins, Gauge, TerminalSquare, Zap, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Execution, ExecutionStep } from "@/lib/api-types";
import { parseRepoAnalysis } from "@/lib/repo-analysis";
import { fadeUp } from "@/lib/motion";

type Props = {
  logs: string[];
  steps: ExecutionStep[];
  streamText: string;
  running: boolean;
  metrics: { tokens: number; cost: number; latencyMs: number };
  execution: Execution | null;
};

export function PlaygroundMetricsPanel({ logs, steps, streamText, running, metrics, execution }: Props) {
  const repo = parseRepoAnalysis(execution);

  return (
    <Card className="flex h-full max-h-[calc(100vh-8rem)] flex-col overflow-hidden edge-glow">
      <div className="flex items-center gap-2">
        <TerminalSquare className="text-cyan" size={18} />
        <h2 className="text-lg font-semibold">Reasoning stream</h2>
        {running && (
          <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-cyan/10 px-2 py-1 text-[10px] text-cyan">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" />
            LIVE
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {(
          [
            ["Tokens", metrics.tokens, Zap],
            ["Cost", `$${(metrics.cost / 100).toFixed(2)}`, Coins],
            ["Latency", `${metrics.latencyMs}ms`, Gauge]
          ] as const satisfies ReadonlyArray<[string, string | number, LucideIcon]>
        ).map(([label, value, Icon]) => (
          <div key={label as string} className="rounded-xl border border-white/10 bg-black/25 px-2 py-2">
            <Icon size={14} className="mx-auto text-cyan/80" />
            <p className="mt-1 text-[10px] text-white/40">{label}</p>
            <p className="text-sm font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
        <div className="max-h-48 overflow-y-auto p-3 font-mono text-[11px] leading-5 text-white/65 scrollbar-thin">
          <AnimatePresence initial={false}>
            {logs.map((line, i) => (
              <motion.p key={`${line}-${i}`} {...fadeUp} transition={{ duration: 0.2 }} className="mb-1">
                <span className="text-cyan/60">›</span> {line}
              </motion.p>
            ))}
          </AnimatePresence>
          {running && !logs.length && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-3 animate-pulse rounded bg-white/10" style={{ width: `${60 + i * 8}%` }} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 min-h-28 flex-1 overflow-y-auto rounded-2xl border border-cyan/15 bg-cyan/5 p-3">
        <p className="text-xs text-cyan/80">Output synthesis</p>
        <p className="mt-2 text-sm leading-6 text-white/75">
          {streamText || (running ? <span className="inline-block animate-pulse">Analyzing operational surface…</span> : "Awaiting execution.")}
          {running && streamText && <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-cyan align-middle" />}
        </p>
      </div>

      {steps.length > 0 && (
        <div className="mt-3 grid max-h-32 gap-2 overflow-y-auto">
          {steps.map((step) => (
            <div key={step.name} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
              <span className="font-medium">{step.name}</span>
              <span className="ml-2 text-emerald">{step.status}</span>
            </div>
          ))}
        </div>
      )}

      {repo && (
        <div className="mt-3 rounded-2xl border border-violet/20 bg-violet/5 px-3 py-2 text-xs text-violet/90">
          Repo health <span className="font-semibold text-white">{repo.health_score}</span>/100 · {repo.frameworks.length} frameworks ·{" "}
          {repo.dependency_summary.total} deps
        </div>
      )}

      {execution?.output.recommendations && (
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="flex items-center gap-2 text-xs text-white/45">
            <Activity size={12} /> Recommendations
          </p>
          <ul className="mt-2 list-inside list-disc text-xs text-white/60">
            {execution.output.recommendations.slice(0, 4).map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
