"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { ExecutionGraph } from "@/components/playground/execution-graph";
import { PlaygroundControlPanel } from "@/components/playground/control-panel";
import { PlaygroundMetricsPanel } from "@/components/playground/metrics-panel";
import { RepoAnalysisReport } from "@/components/playground/repo-analysis-report";
import { LiveDot } from "@/components/operational/live-dot";
import { useAuth } from "@/components/providers/auth-provider";
import { useExecutionOrchestrator } from "@/hooks/use-execution-orchestrator";
import { authDebug } from "@/lib/auth/debug";
import { clearPendingPlayground, loadPendingPlayground } from "@/lib/auth/playground-pending";
import { api, getToken, hasAuthToken } from "@/lib/api";
import type { Agent } from "@/lib/api-types";
import { parseRepoAnalysis, REPO_AGENT_DEFAULT_PAYLOAD } from "@/lib/repo-analysis";
import { fadeUp } from "@/lib/motion";
import Link from "next/link";

export function PlaygroundConsole() {
  const params = useSearchParams();
  const { isAuthenticated, isHydrated, token } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState("");
  const [input, setInput] = useState('{"target":"https://app.example.com","goal":"Run production readiness analysis"}');
  const [model, setModel] = useState("gpt-4.1-mini");
  const [runtime, setRuntime] = useState("production");
  const [authHint, setAuthHint] = useState("");
  const orch = useExecutionOrchestrator();
  const repoAnalysis = parseRepoAnalysis(orch.execution);

  useEffect(() => {
    const agent = agents.find((a) => a.id === agentId);
    if (agent?.category === "repository-understanding" && input.includes("app.example.com")) {
      setInput(JSON.stringify(REPO_AGENT_DEFAULT_PAYLOAD, null, 2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when switching agent
  }, [agentId]);

  useEffect(() => {
    if (!isHydrated) return;
    authDebug("playground", "mount", { isAuthenticated, tokenPresent: hasAuthToken() });
    if (!isAuthenticated) {
      setAuthHint("Sign in to run authenticated executions against the workforce API.");
    } else {
      setAuthHint("");
    }
  }, [isHydrated, isAuthenticated]);

  useEffect(() => {
    api<Agent[]>("/agents")
      .then((items) => {
        setAgents(items);
        const pending = loadPendingPlayground();
        const fromQuery = params.get("agent");
        const preferred = pending?.agentId ?? fromQuery;
        setAgentId(preferred && items.some((a) => a.id === preferred) ? preferred : items[0]?.id ?? "");
        if (pending) {
          setInput(pending.input);
          setModel(pending.model);
          setRuntime(pending.runtime);
          clearPendingPlayground();
          setAuthHint("Restored your pending execution — press Execute to continue.");
        }
      })
      .catch(() => setAgents([]));
  }, [params]);

  async function handleRun() {
    const activeToken = token ?? getToken();
    if (!activeToken) {
      setAuthHint("Authentication required. Sign in to attach Bearer token to execution requests.");
      return;
    }
    try {
      const parsed = JSON.parse(input) as Record<string, unknown>;
      await orch.run({
        agentId,
        input: parsed,
        accessToken: activeToken,
        playgroundState: { input, model, runtime }
      });
    } catch (e) {
      if (e instanceof SyntaxError) {
        orch.reset();
      }
    }
  }

  return (
    <AppShell>
      <motion.div {...fadeUp} className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan">Execution center</p>
          <h1 className="text-3xl font-semibold md:text-4xl">Autonomous workforce playground</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/50">Orchestrate multi-agent chains with live DAG telemetry, streaming reasoning, and operational metering.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm">
          <LiveDot active={isAuthenticated && (orch.running || orch.phase === "complete")} />
          {!isHydrated ? "Loading session…" : !isAuthenticated ? "Unauthenticated" : orch.phase === "idle" ? "Standby" : orch.phase === "running" ? "Executing" : "Complete"}
        </div>
      </motion.div>

      {authHint && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100/90">
          <span>{authHint}</span>
          {!isAuthenticated && (
            <Link href="/auth/login?return=/playground" className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-cyan">
              Sign in
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-4 pb-24 lg:grid-cols-[minmax(240px,280px)_1fr_minmax(260px,320px)] lg:pb-4 xl:min-h-[calc(100vh-11rem)]">
        <PlaygroundControlPanel
          agents={agents}
          agentId={agentId}
          onAgentChange={setAgentId}
          input={input}
          onInputChange={setInput}
          model={model}
          onModelChange={setModel}
          runtime={runtime}
          onRuntimeChange={setRuntime}
          onRun={handleRun}
          running={orch.running}
        />

        <div className="flex min-h-0 flex-col gap-4">
          <motion.section
            className="glass flex-1 rounded-2xl p-4 edge-glow"
            animate={orch.running ? { boxShadow: "0 0 48px rgba(94,231,255,0.12)" } : { boxShadow: "0 24px 80px rgba(0,0,0,0.32)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Workflow DAG</h2>
              <span className="text-xs text-white/40">Node {orch.activeNodeIndex + 1} / 6</span>
            </div>
            <ExecutionGraph nodes={orch.nodes} activeIndex={orch.activeNodeIndex} />
            <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
              {["Initialize", "Plan", "Analyze", "Secure", "Validate", "Deliver"].map((label, i) => (
                <div
                  key={label}
                  className={`h-1 min-w-[3rem] flex-1 rounded-full transition ${i <= orch.activeNodeIndex ? "bg-gradient-to-r from-cyan to-violet" : "bg-white/10"}`}
                />
              ))}
            </div>
          </motion.section>
        </div>

        <PlaygroundMetricsPanel
          logs={orch.logs}
          steps={orch.visibleSteps}
          streamText={orch.streamText}
          running={orch.running}
          metrics={orch.metrics}
          execution={orch.execution}
        />
      </div>

      {repoAnalysis && orch.phase === "complete" && <RepoAnalysisReport analysis={repoAnalysis} />}
    </AppShell>
  );
}
