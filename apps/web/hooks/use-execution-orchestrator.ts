"use client";

import { useCallback, useRef, useState } from "react";
import { apiRequest, ApiError } from "@/lib/auth/api-client";
import { authDebug } from "@/lib/auth/debug";
import { savePendingPlayground } from "@/lib/auth/playground-pending";
import type { Execution, ExecutionStep } from "@/lib/api-types";

const BOOT_LINES = [
  "Initializing execution environment...",
  "Analyzing repository structure...",
  "Scanning dependencies and policy surface...",
  "Checking vulnerabilities and compliance signals...",
  "Generating architecture map...",
  "Running specialist workflow...",
  "Validating output schema and governance...",
  "Finalizing operational report..."
];

const REPO_BOOT_LINES = [
  "Initializing sandboxed Git workspace...",
  "Validating public GitHub repository URL...",
  "Cloning repository (depth=1) into isolated temp directory...",
  "Walking file tree and sampling project layout...",
  "Parsing package.json / requirements.txt / pyproject.toml...",
  "Detecting frameworks and runtime entrypoints...",
  "Analyzing dependency graph and security surface...",
  "Computing health score and onboarding narrative...",
  "Destroying temp clone and packaging JSON artifacts..."
];

function isRepoPayload(input: Record<string, unknown>): boolean {
  const keys = ["github_url", "repository_url", "repo_url", "repository", "target", "url"];
  return keys.some((k) => {
    const v = input[k];
    return typeof v === "string" && v.includes("github.com");
  });
}

export type GraphNodeState = "idle" | "queued" | "running" | "complete" | "error";

export type OrchestrationNode = {
  id: string;
  label: string;
  stepKey: string | null;
  state: GraphNodeState;
};

const GRAPH_TEMPLATE: Array<{ id: string; label: string; stepKey: string | null }> = [
  { id: "request", label: "User Request", stepKey: null },
  { id: "planner", label: "Planner Agent", stepKey: "planner" },
  { id: "analyzer", label: "Analyzer Agent", stepKey: "intake" },
  { id: "security", label: "Security Agent", stepKey: "governance" },
  { id: "validation", label: "Validation Agent", stepKey: "specialist" },
  { id: "output", label: "Final Output", stepKey: null }
];

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function mapNodes(steps: ExecutionStep[], activeIndex: number, phase: "idle" | "running" | "complete"): OrchestrationNode[] {
  const stepMap = Object.fromEntries(steps.map((s) => [s.name, s.status]));
  return GRAPH_TEMPLATE.map((node, index) => {
    let state: GraphNodeState = "idle";
    if (phase === "complete") state = "complete";
    else if (index < activeIndex) state = "complete";
    else if (index === activeIndex) state = phase === "running" ? "running" : "queued";
    else if (phase === "running" && index === activeIndex + 1) state = "queued";

    if (node.stepKey && stepMap[node.stepKey]) {
      const raw = stepMap[node.stepKey];
      if (raw === "complete" || raw === "completed") state = phase === "idle" ? "idle" : index <= activeIndex ? "complete" : state;
      if (raw === "error" || raw === "failed") state = "error";
    }
    if (node.id === "request" && phase !== "idle") state = "complete";
    if (node.id === "output" && phase === "complete") state = "complete";
    if (node.id === "output" && phase === "running" && activeIndex >= GRAPH_TEMPLATE.length - 2) state = "running";

    return { ...node, state };
  });
}

export type RunExecutionOptions = {
  agentId: string;
  input: Record<string, unknown>;
  /** JWT from AuthProvider — ensures Bearer is sent even during long orchestration boot */
  accessToken: string;
  playgroundState?: { input: string; model: string; runtime: string };
};

export function useExecutionOrchestrator() {
  const [phase, setPhase] = useState<"idle" | "running" | "complete">("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [streamText, setStreamText] = useState("");
  const [visibleSteps, setVisibleSteps] = useState<ExecutionStep[]>([]);
  const [execution, setExecution] = useState<Execution | null>(null);
  const [nodes, setNodes] = useState<OrchestrationNode[]>(() => mapNodes([], 0, "idle"));
  const [activeNodeIndex, setActiveNodeIndex] = useState(0);
  const [metrics, setMetrics] = useState({ tokens: 0, cost: 0, latencyMs: 0 });
  const abortRef = useRef(false);

  const appendLog = useCallback((line: string) => {
    setLogs((prev) => [...prev.slice(-80), line]);
  }, []);

  const streamSummary = useCallback(async (text: string) => {
    setStreamText("");
    const chunk = Math.max(2, Math.floor(text.length / 48));
    for (let i = 0; i < text.length; i += chunk) {
      if (abortRef.current) return;
      setStreamText(text.slice(0, i + chunk));
      await delay(28);
    }
    setStreamText(text);
  }, []);

  const run = useCallback(
    async ({ agentId, input, accessToken, playgroundState }: RunExecutionOptions) => {
      abortRef.current = false;
      setPhase("running");
      setExecution(null);
      setVisibleSteps([]);
      setStreamText("");
      setLogs([]);
      setActiveNodeIndex(0);
      setNodes(mapNodes([], 0, "running"));
      const started = performance.now();

      const bootLines = isRepoPayload(input) ? REPO_BOOT_LINES : BOOT_LINES;

      authDebug("execution", "run started", {
        agentId,
        requireAuth: true,
        tokenPresent: Boolean(accessToken),
        tokenLength: accessToken.length,
        repoIngestion: isRepoPayload(input)
      });

      for (let i = 0; i < bootLines.length; i++) {
        if (abortRef.current) return;
        appendLog(bootLines[i]);
        setActiveNodeIndex(Math.min(GRAPH_TEMPLATE.length - 1, Math.floor((i / bootLines.length) * (GRAPH_TEMPLATE.length - 1))));
        setNodes(mapNodes([], Math.floor((i / bootLines.length) * (GRAPH_TEMPLATE.length - 1)), "running"));
        await delay(380 + (i % 3) * 90);
      }

      let result: Execution;
      try {
        authDebug("execution", "POST /executions", { agentId });
        result = await apiRequest<Execution>("/executions", {
          method: "POST",
          body: JSON.stringify({ agent_id: agentId, input }),
          requireAuth: true,
          accessToken
        });
        authDebug("execution", "POST /executions success", { executionId: result.id });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401 && playgroundState) {
          savePendingPlayground({
            agentId,
            input: playgroundState.input,
            model: playgroundState.model,
            runtime: playgroundState.runtime
          });
          appendLog("Session expired — sign in to resume this execution.");
        }
        setPhase("idle");
        const message = err instanceof Error ? err.message : "unknown error";
        appendLog(`Execution failed: ${message}`);
        setNodes(mapNodes([], 0, "idle"));
        authDebug("execution", "run failed", { message, status: err instanceof ApiError ? err.status : undefined });
        throw err;
      }

      for (let i = 0; i < result.steps.length; i++) {
        if (abortRef.current) return;
        const step = result.steps[i];
        setVisibleSteps((prev) => [...prev, step]);
        appendLog(`[${step.name}] ${step.detail.slice(0, 120)}${step.detail.length > 120 ? "…" : ""}`);
        const nodeIdx = Math.min(GRAPH_TEMPLATE.length - 1, i + 2);
        setActiveNodeIndex(nodeIdx);
        setNodes(mapNodes(result.steps.slice(0, i + 1), nodeIdx, "running"));
        await delay(520);
      }

      setExecution(result);
      setPhase("complete");
      setNodes(mapNodes(result.steps, GRAPH_TEMPLATE.length - 1, "complete"));
      setActiveNodeIndex(GRAPH_TEMPLATE.length - 1);
      setMetrics({
        tokens: result.tokens_used,
        cost: result.cost_cents,
        latencyMs: Math.round(performance.now() - started)
      });

      const summary = result.output.summary ?? "Execution completed.";
      await streamSummary(summary);
      authDebug("execution", "run complete", { tokens: result.tokens_used });
    },
    [appendLog, streamSummary]
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    setPhase("idle");
    setExecution(null);
    setVisibleSteps([]);
    setLogs([]);
    setStreamText("");
    setNodes(mapNodes([], 0, "idle"));
    setActiveNodeIndex(0);
    setMetrics({ tokens: 0, cost: 0, latencyMs: 0 });
  }, []);

  return {
    phase,
    logs,
    streamText,
    visibleSteps,
    execution,
    nodes,
    activeNodeIndex,
    metrics,
    run,
    reset,
    running: phase === "running"
  };
}
