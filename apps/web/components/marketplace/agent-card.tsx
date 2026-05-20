"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Rocket, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LiveDot } from "@/components/operational/live-dot";
import { deployAgent, type Agent } from "@/lib/api";
import { springSnappy } from "@/lib/motion";

type DeployState = "idle" | "deploying" | "deployed" | "playground";

export function AgentCard({ agent, executionCount = 0 }: { agent: Agent; executionCount?: number }) {
  const [deployState, setDeployState] = useState<DeployState>("idle");

  async function handleDeploy() {
    setDeployState("deploying");
    const orgId = typeof window !== "undefined" ? window.localStorage.getItem("nexus_org_id") : null;
    try {
      if (orgId) {
        await deployAgent(agent.id, orgId);
        setDeployState("deployed");
        window.setTimeout(() => setDeployState("idle"), 3000);
        return;
      }
    } catch {
      /* fall through to playground */
    }
    setDeployState("playground");
  }

  return (
    <motion.div whileHover={{ y: -6, scale: 1.01 }} transition={springSnappy}>
      <Card className="group relative flex min-h-80 flex-col overflow-hidden border-white/10 transition hover:border-cyan/35 hover:shadow-glow">
        <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/60 to-transparent" />
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan">{agent.category.replaceAll("-", " ")}</p>
            <h2 className="mt-3 text-2xl font-semibold">{agent.name}</h2>
          </div>
          {agent.is_featured && (
            <span className="rounded-full border border-violet/30 bg-violet/15 px-3 py-1 text-xs text-violet shadow-violet">Featured</span>
          )}
        </div>
        <p className="mt-4 flex-1 leading-7 text-white/56">{agent.summary}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/45">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2 py-1">
            <LiveDot active={agent.is_published} />
            {agent.is_published ? "Operational" : "Draft"}
          </span>
          <span>{executionCount > 0 ? `${executionCount} org runs` : "Ready to deploy"}</span>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-sm text-white/60">
            <Star size={15} className="fill-cyan text-cyan" /> {Number(agent.rating).toFixed(1)} · {agent.review_count}
          </span>
          <span className="text-sm text-white/60">${(agent.price_cents / 100).toFixed(0)} / mo</span>
        </div>
        <motion.button
          type="button"
          onClick={handleDeploy}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={springSnappy}
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-black transition hover:bg-cyan hover:shadow-glow disabled:opacity-70"
          disabled={deployState === "deploying"}
        >
          <Rocket size={16} className={deployState === "deploying" ? "animate-pulse" : ""} />
          {deployState === "deploying" ? "Deploying…" : deployState === "deployed" ? "Deployed" : deployState === "playground" ? "Open in playground" : "Deploy agent"}
        </motion.button>
        {deployState === "playground" && (
          <Link href={`/playground?agent=${agent.id}`} className="mt-2 text-center text-xs text-cyan hover:underline">
            Continue to execution center →
          </Link>
        )}
      </Card>
    </motion.div>
  );
}
