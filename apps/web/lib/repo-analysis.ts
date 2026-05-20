import type { Execution } from "@/lib/api-types";

export type RepoFramework = { name: string; confidence: string };

export type RepoDependency = {
  name: string;
  version: string;
  ecosystem: string;
  kind: string;
};

export type RepoObservation = { severity: string; title: string; detail: string };

export type RepoAnalysis = {
  repository: { url: string; owner: string; name: string; visibility: string };
  architecture: {
    top_level_directories: string[];
    top_level_files: string[];
    patterns: string[];
    entrypoints: string[];
  };
  frameworks: RepoFramework[];
  dependencies: RepoDependency[];
  dependency_summary: { total: number; npm: number; pypi: number };
  security_observations: RepoObservation[];
  tech_debt_observations: RepoObservation[];
  onboarding: { summary: string; first_steps: string[]; ownership_hints: string[] };
  health_score: number;
  architecture_summary?: string;
  stats?: { files_scanned: number; bytes_scanned: number };
};

export function parseRepoAnalysis(execution: Execution | null): RepoAnalysis | null {
  if (!execution?.output) return null;
  const out = execution.output;
  if (out.repo_analysis && typeof out.repo_analysis === "object") {
    return out.repo_analysis as unknown as RepoAnalysis;
  }
  const artifact = out.artifacts?.find((a) => a.type === "repo-analysis");
  if (!artifact?.content) return null;
  try {
    return JSON.parse(artifact.content) as RepoAnalysis;
  } catch {
    return null;
  }
}

export const REPO_AGENT_DEFAULT_PAYLOAD = {
  github_url: "https://github.com/octocat/Hello-World",
  goal: "Architecture map, dependency surface, and onboarding guide for engineers"
};
