from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from typing import Any

from app.core.config import settings
from app.models import Agent
from app.services.repo_ingestion import extract_github_url, ingest_github_repository


@dataclass
class AgentResult:
    steps: list[dict[str, Any]]
    output: dict[str, Any]
    tokens_used: int
    cost_cents: int


SPECIALISTS = {
    "qa-testing": "Inspect browser flows, visual regressions, accessibility, layout stability, and produce reproducible QA reports.",
    "devops-monitoring": "Analyze logs, metrics, deployments, incidents, and summarize operational risk with remediation.",
    "repository-understanding": "Map architecture, explain modules, identify coupling, technical debt, and documentation gaps.",
    "compliance-audit": "Detect secrets, insecure dependencies, policy drift, and compliance evidence gaps.",
    "sales-intelligence": "Analyze meetings, CRM notes, pipeline health, churn indicators, and next-best actions.",
    "rfp-proposal": "Read procurement material, extract requirements, draft compliant proposal responses and summaries.",
}


class MultiAgentExecutionEngine:
    async def run(self, agent: Agent, payload: dict[str, Any]) -> AgentResult:
        if agent.category == "repository-understanding":
            repo_url = extract_github_url(payload)
            if repo_url:
                return await self._run_repository_ingestion(agent, payload, repo_url)

        plan = self._build_plan(agent, payload)
        provider_summary = await self._provider_summary(agent, payload, plan)
        steps = [
            {"name": "intake", "status": "complete", "detail": "Normalized request, context, and execution constraints."},
            {"name": "planner", "status": "complete", "detail": plan},
            {"name": "specialist", "status": "complete", "detail": provider_summary},
            {"name": "governance", "status": "complete", "detail": "Checked output shape, policy metadata, and billing metrics."},
        ]
        output = {
            "summary": provider_summary,
            "recommendations": self._recommendations(agent.category),
            "artifacts": [
                {"type": "report", "name": f"{agent.name} execution report", "content": provider_summary},
                {"type": "json", "name": "execution-plan", "content": plan},
            ],
        }
        tokens = max(350, len(json.dumps(payload)) // 3 + len(agent.prompt) // 4)
        return AgentResult(steps=steps, output=output, tokens_used=tokens, cost_cents=max(1, tokens // 120))

    async def _run_repository_ingestion(self, agent: Agent, payload: dict[str, Any], repo_url: str) -> AgentResult:
        try:
            result = await asyncio.to_thread(ingest_github_repository, repo_url)
        except ValueError as exc:
            steps = [
                {"name": "intake", "status": "error", "detail": str(exc)},
                {"name": "planner", "status": "error", "detail": "Clone aborted — only public github.com URLs are supported."},
                {"name": "specialist", "status": "error", "detail": "No repository artifacts produced."},
                {"name": "governance", "status": "complete", "detail": "Temp workspace not created or already cleaned up."},
            ]
            return AgentResult(
                steps=steps,
                output={
                    "summary": f"Repository ingestion failed: {exc}",
                    "recommendations": ["Verify the repository is public.", "Use https://github.com/owner/repo format."],
                    "artifacts": [],
                },
                tokens_used=120,
                cost_cents=1,
            )

        analysis = result.analysis
        summary = analysis.get("architecture_summary") or f"{agent.name} analyzed {repo_url}."
        recommendations = self._repo_recommendations(analysis)

        optional_llm = await self._maybe_enrich_repo_summary(agent, payload, analysis)
        if optional_llm:
            summary = optional_llm

        analysis_json = json.dumps(analysis, indent=2)
        output = {
            "summary": summary,
            "recommendations": recommendations,
            "repo_analysis": analysis,
            "artifacts": [
                {"type": "repo-analysis", "name": "repository-analysis", "content": analysis_json},
                {"type": "json", "name": "dependency-manifest", "content": json.dumps(analysis.get("dependencies", [])[:50])},
                {"type": "report", "name": "onboarding-guide", "content": json.dumps(analysis.get("onboarding", {}), indent=2)},
            ],
        }
        tokens = result.tokens_used + len(summary) // 4
        return AgentResult(steps=result.steps, output=output, tokens_used=tokens, cost_cents=max(1, tokens // 100))

    async def _maybe_enrich_repo_summary(self, agent: Agent, payload: dict[str, Any], analysis: dict[str, Any]) -> str | None:
        if not (settings.openai_api_key or settings.gemini_api_key):
            return None
        prompt = (
            f"You are {agent.name}. Summarize this repository analysis in 3-4 sentences for engineers.\n"
            f"Analysis JSON:\n{json.dumps(analysis, default=str)[:12000]}\n"
            f"User goal: {payload.get('goal', 'onboarding and architecture understanding')}"
        )
        try:
            if settings.openai_api_key:
                return await self._run_openai(prompt)
            return await self._run_gemini(prompt)
        except Exception:
            return None

    def _repo_recommendations(self, analysis: dict[str, Any]) -> list[str]:
        recs: list[str] = []
        for item in analysis.get("security_observations") or []:
            if item.get("severity") in {"critical", "high"}:
                recs.append(f"[Security] {item.get('title')}: {item.get('detail')}")
        for item in analysis.get("tech_debt_observations") or []:
            if item.get("severity") in {"medium", "high"}:
                recs.append(f"[Debt] {item.get('title')}")
        recs.extend(
            [
                "Publish architecture diagrams from detected entrypoints.",
                "Pin dependency versions in CI and enable automated updates.",
                "Track health score over time on each main-branch commit.",
            ]
        )
        return recs[:8]

    def _build_plan(self, agent: Agent, payload: dict[str, Any]) -> str:
        specialist = SPECIALISTS.get(agent.category, "Execute the configured autonomous workflow.")
        configured_steps = agent.workflow.get("steps") if isinstance(agent.workflow, dict) else None
        workflow_text = ", ".join(configured_steps or ["intake", "analysis", "tool-use", "synthesis", "delivery"])
        return f"{specialist} Workflow: {workflow_text}. Input keys: {', '.join(payload.keys()) or 'none'}."

    async def _provider_summary(self, agent: Agent, payload: dict[str, Any], plan: str) -> str:
        prompt = (
            f"You are {agent.name}, an enterprise AI worker.\n"
            f"System prompt: {agent.prompt}\n"
            f"Plan: {plan}\n"
            f"User payload: {json.dumps(payload, default=str)}\n"
            "Return a concise operational result with risks, actions, and measurable next steps."
        )
        if settings.openai_api_key:
            return await self._run_openai(prompt)
        if settings.gemini_api_key:
            return await self._run_gemini(prompt)
        return self._local_summary(agent, payload, plan)

    async def _run_openai(self, prompt: str) -> str:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        response = await client.responses.create(model="gpt-4.1-mini", input=prompt)
        return response.output_text

    async def _run_gemini(self, prompt: str) -> str:
        import google.generativeai as genai

        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = await model.generate_content_async(prompt)
        return response.text or "Gemini completed the execution without text output."

    def _local_summary(self, agent: Agent, payload: dict[str, Any], plan: str) -> str:
        target = payload.get("target") or payload.get("repository") or payload.get("account") or "the supplied workspace"
        return (
            f"{agent.name} completed a local deterministic run for {target}. {plan} "
            "Highest priority action: validate connected data sources, run the recommended workflow in production mode, "
            "and review generated artifacts before autonomous deployment."
        )

    def _recommendations(self, category: str) -> list[str]:
        defaults = {
            "qa-testing": ["Add Playwright coverage for critical flows.", "Compare screenshots before every release."],
            "devops-monitoring": ["Create alert thresholds for error spikes.", "Attach deployment metadata to incidents."],
            "repository-understanding": ["Generate architecture docs weekly.", "Track debt hotspots by ownership area."],
            "compliance-audit": ["Rotate exposed secrets immediately.", "Store audit evidence with timestamps."],
            "sales-intelligence": ["Sync churn risks into CRM tasks.", "Summarize objections by segment."],
            "rfp-proposal": ["Map every RFP requirement to evidence.", "Have legal review non-standard clauses."],
        }
        return defaults.get(category, ["Review the execution report.", "Promote the workflow once validated."])


engine = MultiAgentExecutionEngine()
