"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AgentCard } from "@/components/marketplace/agent-card";
import { Input } from "@/components/ui/input";
import { api, type Agent } from "@/lib/api";
import { fadeUp } from "@/lib/motion";

const categories = ["all", "qa-testing", "devops-monitoring", "repository-understanding", "compliance-audit", "sales-intelligence", "rfp-proposal"];

export default function MarketplacePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    api<Agent[]>("/agents").then(setAgents).catch(() => setAgents([]));
  }, []);

  const filtered = useMemo(
    () =>
      agents.filter(
        (agent) =>
          (category === "all" || agent.category === category) &&
          `${agent.name} ${agent.summary}`.toLowerCase().includes(query.toLowerCase())
      ),
    [agents, category, query]
  );

  return (
    <AppShell>
      <motion.section {...fadeUp} className="glass rounded-3xl p-6 edge-glow">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-cyan">Agent Marketplace</p>
            <h1 className="mt-2 text-4xl font-semibold">Deploy specialist AI workers</h1>
            <p className="mt-2 max-w-xl text-sm text-white/50">Live deployment states, operational badges, and direct routing to the execution center.</p>
          </div>
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-4 top-3 text-white/35" size={17} />
            <Input className="pl-11" placeholder="Search agents" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </div>
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${
                category === item ? "border-cyan/60 bg-cyan/15 text-cyan shadow-glow" : "border-white/10 bg-white/[0.04] text-white/55 hover:text-white"
              }`}
            >
              {item.replaceAll("-", " ")}
            </button>
          ))}
        </div>
      </motion.section>
      <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((agent, index) => (
          <AgentCard key={agent.id} agent={agent} executionCount={(index + 1) * 12} />
        ))}
      </section>
    </AppShell>
  );
}
