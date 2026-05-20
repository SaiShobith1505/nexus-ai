"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Boxes, GitBranch, Shield, Sparkles } from "lucide-react";
import type { RepoAnalysis } from "@/lib/repo-analysis";
import { fadeUp } from "@/lib/motion";

const SEVERITY_STYLES: Record<string, string> = {
  critical: "border-red-400/40 bg-red-500/10 text-red-200",
  high: "border-amber-400/35 bg-amber-400/10 text-amber-100",
  medium: "border-yellow-400/25 bg-yellow-400/5 text-yellow-100/90",
  low: "border-white/15 bg-white/[0.03] text-white/65",
  info: "border-cyan/20 bg-cyan/5 text-white/70"
};

type Props = { analysis: RepoAnalysis };

export function RepoAnalysisReport({ analysis }: Props) {
  const health = analysis.health_score ?? 0;
  const healthColor = health >= 80 ? "text-emerald" : health >= 60 ? "text-cyan" : "text-amber-300";

  return (
    <motion.section {...fadeUp} className="glass mt-4 rounded-2xl p-5 edge-glow">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan">Repository intelligence</p>
          <h2 className="mt-1 text-xl font-semibold">
            {analysis.repository.owner}/{analysis.repository.name}
          </h2>
          <a
            href={analysis.repository.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-white/45 hover:text-cyan"
          >
            <GitBranch size={12} /> {analysis.repository.url}
          </a>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Repo health</p>
          <p className={`text-4xl font-semibold tabular-nums ${healthColor}`}>{health}</p>
          <p className="text-[10px] text-white/35">/ 100</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {analysis.frameworks.map((fw) => (
          <span
            key={fw.name}
            className="inline-flex items-center gap-1 rounded-full border border-violet/30 bg-violet/10 px-3 py-1 text-xs text-violet"
          >
            <Sparkles size={12} /> {fw.name}
          </span>
        ))}
        {!analysis.frameworks.length && (
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/45">Polyglot / undetected stack</span>
        )}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Boxes size={16} className="text-cyan" /> Architecture
          </p>
          <p className="mt-2 text-sm leading-6 text-white/60">
            {(analysis.architecture.patterns ?? []).join(" · ") || "Standard layout"}
          </p>
          <div className="mt-3 flex flex-wrap gap-1">
            {(analysis.architecture.top_level_directories ?? []).slice(0, 10).map((dir) => (
              <span key={dir} className="rounded-lg bg-white/[0.05] px-2 py-0.5 font-mono text-[10px] text-white/55">
                {dir}/
              </span>
            ))}
          </div>
          {(analysis.architecture.entrypoints ?? []).length > 0 && (
            <p className="mt-3 text-xs text-white/45">
              Entrypoints: {analysis.architecture.entrypoints.join(", ")}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Shield size={16} className="text-cyan" /> Onboarding
          </p>
          <p className="mt-2 text-sm leading-6 text-white/60">{analysis.onboarding.summary}</p>
          <ol className="mt-3 list-inside list-decimal space-y-1 text-xs text-white/50">
            {analysis.onboarding.first_steps.slice(0, 4).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2">
          <p className="text-sm font-medium">Dependencies</p>
          <span className="text-xs text-white/40">
            {analysis.dependency_summary.total} total · npm {analysis.dependency_summary.npm} · pypi{" "}
            {analysis.dependency_summary.pypi}
          </span>
        </div>
        <div className="max-h-48 overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-black/60 text-white/40">
              <tr>
                <th className="px-4 py-2 font-medium">Package</th>
                <th className="px-4 py-2 font-medium">Version</th>
                <th className="px-4 py-2 font-medium">Ecosystem</th>
                <th className="px-4 py-2 font-medium">Kind</th>
              </tr>
            </thead>
            <tbody>
              {analysis.dependencies.slice(0, 40).map((dep) => (
                <tr key={`${dep.ecosystem}-${dep.name}`} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-2 font-mono text-white/75">{dep.name}</td>
                  <td className="px-4 py-2 text-white/50">{dep.version}</td>
                  <td className="px-4 py-2 text-cyan/80">{dep.ecosystem}</td>
                  <td className="px-4 py-2 text-white/40">{dep.kind}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <ObservationList title="Security" icon={Shield} items={analysis.security_observations} />
        <ObservationList title="Tech debt" icon={AlertTriangle} items={analysis.tech_debt_observations} />
      </div>

      {analysis.stats && (
        <p className="mt-4 text-center text-[10px] text-white/35">
          Scanned {analysis.stats.files_scanned.toLocaleString()} files · {Math.round((analysis.stats.bytes_scanned ?? 0) / 1024 / 1024)} MB
        </p>
      )}
    </motion.section>
  );
}

function ObservationList({
  title,
  icon: Icon,
  items
}: {
  title: string;
  icon: typeof Shield;
  items: RepoAnalysis["security_observations"];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Icon size={14} className="text-cyan" /> {title}
      </p>
      <ul className="mt-2 space-y-2">
        {items.slice(0, 4).map((item) => (
          <li
            key={`${item.title}-${item.severity}`}
            className={`rounded-xl border px-3 py-2 text-xs ${SEVERITY_STYLES[item.severity] ?? SEVERITY_STYLES.info}`}
          >
            <p className="font-medium">{item.title}</p>
            <p className="mt-1 opacity-80">{item.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
