"use client";

import { Cpu, FileUp, Play, Settings2, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Agent } from "@/lib/api";
import { springSnappy } from "@/lib/motion";

type Props = {
  agents: Agent[];
  agentId: string;
  onAgentChange: (id: string) => void;
  input: string;
  onInputChange: (v: string) => void;
  model: string;
  onModelChange: (v: string) => void;
  runtime: string;
  onRuntimeChange: (v: string) => void;
  onRun: () => void;
  running: boolean;
};

export function PlaygroundControlPanel({
  agents,
  agentId,
  onAgentChange,
  input,
  onInputChange,
  model,
  onModelChange,
  runtime,
  onRuntimeChange,
  onRun,
  running
}: Props) {
  const selected = agents.find((a) => a.id === agentId);

  return (
    <Card className="flex h-full flex-col edge-glow">
      <p className="text-xs uppercase tracking-[0.24em] text-cyan">Control stack</p>
      <h2 className="mt-2 text-xl font-semibold">Execution settings</h2>

      <label className="mt-6 text-xs text-white/45">Active agent</label>
      <select
        value={agentId}
        onChange={(e) => onAgentChange(e.target.value)}
        className="mt-2 h-11 w-full rounded-2xl border border-white/12 bg-black/30 px-4 text-sm outline-none transition focus:border-cyan/50"
      >
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </select>

      <label className="mt-4 text-xs text-white/45">Model</label>
      <select
        value={model}
        onChange={(e) => onModelChange(e.target.value)}
        className="mt-2 h-10 w-full rounded-2xl border border-white/12 bg-black/30 px-4 text-sm"
      >
        <option value="gpt-4.1-mini">gpt-4.1-mini</option>
        <option value="gpt-4.1">gpt-4.1</option>
        <option value="gemini-2.0-flash">gemini-2.0-flash</option>
      </select>

      <label className="mt-4 text-xs text-white/45">Runtime</label>
      <select
        value={runtime}
        onChange={(e) => onRuntimeChange(e.target.value)}
        className="mt-2 h-10 w-full rounded-2xl border border-white/12 bg-black/30 px-4 text-sm"
      >
        <option value="production">production</option>
        <option value="staging">staging</option>
        <option value="sandbox">sandbox</option>
      </select>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <p className="flex items-center gap-2 text-xs text-white/45">
          <Wrench size={14} className="text-cyan" /> Tools
        </p>
        <ul className="mt-2 grid gap-1 text-xs text-white/55">
          {(selected?.tools ?? [{ name: "web" }, { name: "files" }, { name: "api" }]).slice(0, 4).map((tool, i) => (
            <li key={i} className="rounded-lg bg-black/20 px-2 py-1">
              {(tool as { name?: string }).name ?? "tool"} · scoped
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 rounded-2xl border border-dashed border-white/15 bg-black/15 p-3">
        <p className="flex items-center gap-2 text-xs text-white/45">
          <FileUp size={14} /> Context files
        </p>
        <p className="mt-2 text-xs text-white/40">Attach repository archives, PDFs, or API specs in Studio — referenced at runtime.</p>
      </div>

      <label className="mt-4 text-xs text-white/45">
        {selected?.category === "repository-understanding" ? "GitHub repository payload" : "Payload"}
      </label>
      <textarea
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder={
          selected?.category === "repository-understanding"
            ? '{"github_url":"https://github.com/owner/repo","goal":"Architecture and onboarding analysis"}'
            : undefined
        }
        className="mt-2 min-h-36 flex-1 w-full resize-none rounded-2xl border border-white/12 bg-white/[0.05] p-3 font-mono text-xs outline-none focus:border-cyan/50"
      />
      {selected?.category === "repository-understanding" && (
        <p className="mt-2 text-[10px] leading-5 text-white/40">Public github.com URLs only. Repo is cloned in a temp sandbox and deleted after analysis.</p>
      )}

      <motion.div className="mt-4" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={springSnappy}>
        <Button
          onClick={onRun}
          disabled={running || !agentId}
          className="w-full bg-white text-black hover:bg-cyan hover:shadow-glow"
        >
          <Play size={16} className={running ? "animate-pulse" : ""} />
          {running ? "Orchestrating…" : "Execute workforce"}
        </Button>
      </motion.div>

      <p className="mt-3 flex items-center gap-2 text-[11px] text-white/40">
        <Settings2 size={12} />
        <Cpu size={12} /> Policy-aware · audited · metered
      </p>
    </Card>
  );
}
