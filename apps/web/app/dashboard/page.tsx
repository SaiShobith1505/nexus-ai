"use client";

import { motion } from "framer-motion";
import { Activity, Bot, Coins, Cpu, Server } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { MetricCard } from "@/components/operational/metric-card";
import { LiveDot } from "@/components/operational/live-dot";
import { Card } from "@/components/ui/card";
import { useLiveMetrics } from "@/hooks/use-live-metrics";
import { fadeUp } from "@/lib/motion";

export default function DashboardPage() {
  const { summary, pulse, loading } = useLiveMetrics();

  return (
    <AppShell>
      <motion.div {...fadeUp} className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan">Operations center</p>
          <h1 className="text-3xl font-semibold md:text-4xl">AI workforce telemetry</h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/55">
          <LiveDot active={!loading} />
          Infrastructure {loading ? "syncing" : "healthy"}
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Agents" value={summary.agents} icon={Bot} live pulseKey={pulse} />
        <MetricCard label="Executions" value={summary.executions} icon={Activity} live pulseKey={pulse} />
        <MetricCard label="Tokens" value={summary.tokens} icon={Cpu} live pulseKey={pulse} format={(v) => v.toLocaleString()} />
        <MetricCard label="Revenue" value={summary.revenue_cents / 100} icon={Coins} live pulseKey={pulse} format={(v) => `$${Math.round(v)}`} />
      </div>

      <div className="mt-4 grid gap-4 pb-20 lg:pb-4 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="relative min-h-96 overflow-hidden edge-glow">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Workload analytics</h2>
            <span className="text-xs text-white/40">Runs · Tokens</span>
          </div>
          <UsageChart executions={summary.executions} tokens={summary.tokens} pulseKey={pulse} />
        </Card>
        <div className="grid gap-4">
          <Card className="edge-glow">
            <div className="flex items-center gap-2">
              <Server className="text-cyan" size={18} />
              <h2 className="text-xl font-semibold">Deployment monitoring</h2>
            </div>
            <ul className="mt-4 grid gap-2 text-sm text-white/55">
              <li className="flex justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <span>API gateway</span>
                <span className="text-emerald">99.98%</span>
              </li>
              <li className="flex justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <span>Execution engine</span>
                <span className="text-emerald">Operational</span>
              </li>
              <li className="flex justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <span>Notification bus</span>
                <span className="text-cyan">Connected</span>
              </li>
            </ul>
          </Card>
          <Card className="min-h-64 edge-glow">
            <h2 className="text-xl font-semibold">Activity logs</h2>
            <ActivityFeed activity={summary.activity} />
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
