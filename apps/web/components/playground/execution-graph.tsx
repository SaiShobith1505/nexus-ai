"use client";

import { motion } from "framer-motion";
import type { OrchestrationNode } from "@/hooks/use-execution-orchestrator";
import { cn } from "@/lib/utils";

const STATE_STYLES: Record<OrchestrationNode["state"], string> = {
  idle: "border-white/12 bg-white/[0.04] text-white/45",
  queued: "border-white/20 bg-white/[0.06] text-white/55",
  running: "border-cyan/50 bg-cyan/10 text-cyan shadow-glow",
  complete: "border-emerald/40 bg-emerald/10 text-emerald",
  error: "border-red-400/40 bg-red-500/10 text-red-300"
};

const NODE_POSITIONS = [
  { x: 8, y: 8 },
  { x: 50, y: 8 },
  { x: 92, y: 8 },
  { x: 92, y: 52 },
  { x: 50, y: 52 },
  { x: 8, y: 52 }
];

type Props = {
  nodes: OrchestrationNode[];
  activeIndex: number;
};

export function ExecutionGraph({ nodes, activeIndex }: Props) {
  const edges = nodes.slice(0, -1).map((_, i) => ({
    from: NODE_POSITIONS[i],
    to: NODE_POSITIONS[i + 1],
    active: i < activeIndex || nodes[i + 1]?.state === "running"
  }));

  return (
    <div className="relative min-h-[320px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/25 p-4">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 64" preserveAspectRatio="none">
        <defs>
          <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(94,231,255,0.15)" />
            <stop offset="50%" stopColor="rgba(94,231,255,0.85)" />
            <stop offset="100%" stopColor="rgba(157,124,255,0.5)" />
          </linearGradient>
        </defs>
        {edges.map((edge, i) => {
          const x1 = edge.from.x;
          const y1 = edge.from.y + 6;
          const x2 = edge.to.x;
          const y2 = edge.to.y + 6;
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />
              <motion.line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="url(#edgeGrad)"
                strokeWidth={edge.active ? 0.9 : 0}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: edge.active ? 1 : 0, opacity: edge.active ? 1 : 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
              {edge.active && (
                <motion.circle
                  r="0.9"
                  fill="#5ee7ff"
                  initial={{ offsetDistance: "0%" }}
                  animate={{
                    cx: [x1, x2],
                    cy: [y1, y2]
                  }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: i * 0.15 }}
                />
              )}
            </g>
          );
        })}
      </svg>

      <div className="relative grid h-full min-h-[280px] grid-cols-3 grid-rows-2 gap-3">
        {nodes.map((node, index) => {
          const gridSlot = ["col-start-1 row-start-1", "col-start-2 row-start-1", "col-start-3 row-start-1", "col-start-3 row-start-2", "col-start-2 row-start-2", "col-start-1 row-start-2"][index];
          return (
            <motion.div
              key={node.id}
              className={cn(
                "relative flex flex-col justify-center rounded-2xl border px-3 py-3 text-center backdrop-blur-md transition-shadow",
                STATE_STYLES[node.state],
                gridSlot
              )}
              animate={node.state === "running" ? { scale: [1, 1.02, 1] } : { scale: 1 }}
              transition={{ duration: 1.4, repeat: node.state === "running" ? Infinity : 0 }}
            >
              {node.state === "running" && (
                <motion.span
                  className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-cyan/40"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
              <p className="text-[10px] uppercase tracking-[0.18em] opacity-70">{node.id === "request" ? "Ingress" : node.id === "output" ? "Egress" : "Worker"}</p>
              <p className="mt-1 text-xs font-semibold leading-tight md:text-sm">{node.label}</p>
              <p className="mt-1 text-[10px] capitalize opacity-60">{node.state}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
