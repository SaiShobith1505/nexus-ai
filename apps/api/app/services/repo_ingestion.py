"""Sandboxed public GitHub repository ingestion and static analysis."""

from __future__ import annotations

import json
import os
import re
import subprocess
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

SKIP_DIRS = {
    ".git",
    "node_modules",
    "dist",
    "build",
    ".next",
    "venv",
    ".venv",
    "__pycache__",
    ".pytest_cache",
    "coverage",
    ".turbo",
    "target",
    "vendor",
    ".idea",
    ".vscode",
}
SKIP_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".eot", ".zip", ".jar", ".war", ".mp4", ".pdf"}
MAX_FILES = 8_000
MAX_READ_BYTES = 512_000
MAX_TREE_ENTRIES = 400
CLONE_TIMEOUT_SEC = 120

GITHUB_HOSTS = {"github.com", "www.github.com"}

FRAMEWORK_HINTS: dict[str, list[str]] = {
    "next.js": ["next"],
    "react": ["react", "react-dom"],
    "vue": ["vue"],
    "angular": ["@angular/core"],
    "svelte": ["svelte"],
    "fastapi": ["fastapi"],
    "django": ["django"],
    "flask": ["flask"],
    "express": ["express"],
    "nestjs": ["@nestjs/core"],
    "spring": ["spring-boot"],
    "rails": ["rails"],
    "laravel": ["laravel/framework"],
    "go-chi": ["github.com/go-chi/chi"],
}


@dataclass
class RepoIngestionResult:
    analysis: dict[str, Any]
    steps: list[dict[str, str]] = field(default_factory=list)
    tokens_used: int = 0


def extract_github_url(payload: dict[str, Any]) -> str | None:
    for key in ("github_url", "repository_url", "repo_url", "repository", "target", "url"):
        value = payload.get(key)
        if isinstance(value, str) and "github.com" in value.lower():
            return value.strip()
    return None


def _parse_github_url(url: str) -> tuple[str, str, str]:
    """Return (clone_url, owner, repo_name). Raises ValueError if invalid."""
    normalized = url.strip().rstrip("/")
    if normalized.endswith(".git"):
        normalized = normalized[:-4]

    if normalized.startswith("git@"):
        match = re.match(r"git@github\.com:([^/]+)/([^/]+?)(?:\.git)?$", normalized)
        if not match:
            raise ValueError("Only github.com SSH URLs are supported (git@github.com:owner/repo).")
        owner, repo = match.group(1), match.group(2)
        return f"https://github.com/{owner}/{repo}.git", owner, repo

    parsed = urlparse(normalized)
    if parsed.netloc.lower() not in GITHUB_HOSTS:
        raise ValueError("Only public github.com repositories are supported.")
    parts = [p for p in parsed.path.split("/") if p]
    if len(parts) < 2:
        raise ValueError("GitHub URL must include owner and repository name.")
    owner, repo = parts[0], parts[1].replace(".git", "")
    if not re.fullmatch(r"[A-Za-z0-9_.-]+", owner) or not re.fullmatch(r"[A-Za-z0-9_.-]+", repo):
        raise ValueError("Invalid GitHub owner or repository name.")
    return f"https://github.com/{owner}/{repo}.git", owner, repo


def _clone_repo(clone_url: str, dest: Path) -> None:
    dest.mkdir(parents=True, exist_ok=True)
    proc = subprocess.run(
        [
            "git",
            "clone",
            "--depth",
            "1",
            "--single-branch",
            "--recurse-submodules=no",
            clone_url,
            str(dest),
        ],
        capture_output=True,
        text=True,
        timeout=CLONE_TIMEOUT_SEC,
        env={**os.environ, "GIT_TERMINAL_PROMPT": "0"},
    )
    if proc.returncode != 0:
        stderr = (proc.stderr or proc.stdout or "clone failed").strip()
        if "authentication" in stderr.lower() or "403" in stderr or "404" in stderr:
            raise ValueError("Repository is not accessible. Only public GitHub repositories are supported.")
        raise ValueError(f"Git clone failed: {stderr[:500]}")


def _walk_repo(root: Path) -> tuple[list[dict[str, Any]], int, int]:
    tree: list[dict[str, Any]] = []
    total_bytes = 0
    file_count = 0

    for path in sorted(root.rglob("*")):
        if file_count >= MAX_FILES:
            break
        rel = path.relative_to(root)
        parts = rel.parts
        if any(part in SKIP_DIRS for part in parts):
            continue
        if path.is_dir():
            continue
        if path.suffix.lower() in SKIP_EXTENSIONS:
            continue
        try:
            size = path.stat().st_size
        except OSError:
            continue
        total_bytes += size
        file_count += 1
        if len(tree) < MAX_TREE_ENTRIES:
            tree.append({"path": rel.as_posix(), "size_bytes": size})

    return tree, file_count, total_bytes


def _read_text(path: Path, limit: int = MAX_READ_BYTES) -> str | None:
    try:
        data = path.read_bytes()[:limit]
        return data.decode("utf-8", errors="ignore")
    except OSError:
        return None


def _parse_package_json(root: Path) -> dict[str, Any] | None:
    for candidate in (root / "package.json", *root.glob("*/package.json")):
        if not candidate.is_file():
            continue
        raw = _read_text(candidate)
        if not raw:
            continue
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            continue
    return None


def _parse_requirements(root: Path) -> list[dict[str, str]]:
    deps: list[dict[str, str]] = []
    for candidate in (root / "requirements.txt", root / "requirements-dev.txt"):
        if not candidate.is_file():
            continue
        raw = _read_text(candidate)
        if not raw:
            continue
        for line in raw.splitlines():
            line = line.strip()
            if not line or line.startswith("#") or line.startswith("-"):
                continue
            name = re.split(r"[<>=!~\[]", line)[0].strip()
            if name:
                deps.append({"name": name, "version": line[len(name) :].strip() or "*", "ecosystem": "pypi", "kind": "runtime"})
    return deps


def _parse_pyproject(root: Path) -> list[dict[str, str]]:
    path = root / "pyproject.toml"
    if not path.is_file():
        return []
    raw = _read_text(path)
    if not raw:
        return []
    deps: list[dict[str, str]] = []
    in_deps = False
    for line in raw.splitlines():
        if line.strip() == "[project.dependencies]":
            in_deps = True
            continue
        if line.startswith("[") and in_deps:
            break
        if in_deps and "=" in line:
            key, val = line.split("=", 1)
            deps.append({"name": key.strip().strip('"'), "version": val.strip().strip('"'), "ecosystem": "pypi", "kind": "runtime"})
    return deps


def _detect_frameworks(package: dict[str, Any] | None, all_deps: list[dict[str, str]]) -> list[dict[str, str]]:
    names = set()
    if package:
        for section in ("dependencies", "devDependencies"):
            block = package.get(section) or {}
            if isinstance(block, dict):
                names.update(block.keys())
    names.update(d["name"].lower() for d in all_deps)

    found: list[dict[str, str]] = []
    for label, markers in FRAMEWORK_HINTS.items():
        if any(m.lower() in names for m in markers):
            found.append({"name": label, "confidence": "high" if label in {"next.js", "fastapi", "django"} else "medium"})
    if (package or {}).get("workspaces"):
        found.append({"name": "monorepo (npm workspaces)", "confidence": "high"})
    return found


def _architecture_summary(root: Path, tree: list[dict[str, Any]], package: dict[str, Any] | None) -> dict[str, Any]:
    top_dirs = sorted({p["path"].split("/")[0] for p in tree if "/" in p["path"]})
    top_files = sorted(p["path"] for p in tree if "/" not in p["path"])
    patterns: list[str] = []
    if (root / "apps").is_dir() or (root / "packages").is_dir():
        patterns.append("monorepo layout")
    if (root / "src").is_dir():
        patterns.append("src-centric application")
    if (root / "api").is_dir() and (root / "web").is_dir():
        patterns.append("split api / web services")
    if package and package.get("scripts", {}).get("dev"):
        patterns.append("nodejs application with dev script")
    return {
        "top_level_directories": top_dirs[:24],
        "top_level_files": top_files[:24],
        "patterns": patterns or ["standard single-package layout"],
        "entrypoints": _guess_entrypoints(root, package),
    }


def _guess_entrypoints(root: Path, package: dict[str, Any] | None) -> list[str]:
    entries: list[str] = []
    if package:
        main = package.get("main") or package.get("module")
        if main:
            entries.append(str(main))
        for script in ("dev", "start", "build"):
            if package.get("scripts", {}).get(script):
                entries.append(f"npm run {script}")
    for candidate in ("main.py", "app/main.py", "src/index.ts", "src/main.ts", "index.js"):
        if (root / candidate).is_file():
            entries.append(candidate)
    return entries[:8]


def _security_observations(root: Path, tree: list[dict[str, Any]]) -> list[dict[str, str]]:
    obs: list[dict[str, str]] = []
    paths = {p["path"] for p in tree}
    if any(p.endswith(".env") and not p.endswith(".env.example") for p in paths):
        obs.append({"severity": "high", "title": "Environment file committed", "detail": "A .env file appears in the repository; rotate secrets and use .env.example only."})
    if any("id_rsa" in p or p.endswith(".pem") for p in paths):
        obs.append({"severity": "critical", "title": "Potential private key in repo", "detail": "Key material detected — revoke and remove immediately."})
    if (root / "docker-compose.yml").is_file():
        obs.append({"severity": "info", "title": "Container orchestration present", "detail": "Review docker-compose for exposed ports and pinned image digests."})
    if not obs:
        obs.append({"severity": "info", "title": "No critical patterns in shallow scan", "detail": "Static scan did not flag common secret filenames; run deeper SAST in CI."})
    return obs


def _tech_debt_observations(root: Path, tree: list[dict[str, Any]], file_count: int) -> list[dict[str, str]]:
    obs: list[dict[str, str]] = []
    todo_count = 0
    for item in tree[:1200]:
        path = root / item["path"]
        if path.suffix not in {".py", ".ts", ".tsx", ".js", ".jsx", ".go", ".java", ".md"}:
            continue
        raw = _read_text(path, limit=32_000)
        if not raw:
            continue
        todo_count += len(re.findall(r"\b(TODO|FIXME|HACK|XXX)\b", raw, re.I))

    if not (root / "README.md").is_file():
        obs.append({"severity": "medium", "title": "Missing README", "detail": "Add onboarding documentation for faster engineer ramp-up."})
    test_dirs = {"tests", "test", "__tests__", "spec"}
    if not any(p["path"].split("/")[0] in test_dirs or "/tests/" in p["path"] for p in tree):
        obs.append({"severity": "medium", "title": "No test directory detected", "detail": "Consider adding automated tests under tests/ or __tests__/."})
    if todo_count > 15:
        obs.append({"severity": "low", "title": "High TODO density", "detail": f"Found {todo_count}+ TODO/FIXME markers — schedule debt burndown."})
    if file_count > 3000:
        obs.append({"severity": "low", "title": "Large codebase surface", "detail": f"{file_count} files scanned — modularize ownership boundaries."})
    if not obs:
        obs.append({"severity": "info", "title": "Baseline debt acceptable", "detail": "No major structural debt signals in static pass."})
    return obs


def _health_score(
    frameworks: list[dict[str, str]],
    security: list[dict[str, str]],
    debt: list[dict[str, str]],
    has_readme: bool,
    has_tests: bool,
) -> int:
    score = 72
    if frameworks:
        score += 6
    if has_readme:
        score += 5
    if has_tests:
        score += 8
    for item in security:
        if item["severity"] == "critical":
            score -= 25
        elif item["severity"] == "high":
            score -= 12
    for item in debt:
        if item["severity"] == "medium":
            score -= 4
    return max(10, min(98, score))


def _onboarding_explanation(owner: str, repo: str, arch: dict[str, Any], frameworks: list[dict[str, str]]) -> dict[str, Any]:
    fw = ", ".join(f["name"] for f in frameworks[:4]) or "general purpose"
    return {
        "summary": f"{owner}/{repo} is a {fw} codebase. Start with top-level modules, then follow entrypoints.",
        "first_steps": [
            f"Clone: git clone https://github.com/{owner}/{repo}.git",
            "Install dependencies using the detected ecosystem manifest (package.json / requirements.txt).",
            f"Review entrypoints: {', '.join(arch.get('entrypoints') or []) or 'see README'}",
            "Run the test suite before making changes.",
        ],
        "ownership_hints": arch.get("top_level_directories") or [],
    }


def ingest_github_repository(url: str) -> RepoIngestionResult:
    """Clone, analyze, and return structured JSON. Always cleans up temp directory."""
    clone_url, owner, repo = _parse_github_url(url)
    steps: list[dict[str, str]] = []

    with tempfile.TemporaryDirectory(prefix="nexus-repo-") as tmp:
        root = Path(tmp) / repo
        steps.append({"name": "intake", "status": "complete", "detail": f"Validated public GitHub target {owner}/{repo}."})

        try:
            _clone_repo(clone_url, root)
        except Exception as exc:
            steps.append({"name": "planner", "status": "error", "detail": str(exc)})
            raise

        steps.append({"name": "planner", "status": "complete", "detail": "Shallow clone completed in isolated temp workspace."})

        tree, file_count, total_bytes = _walk_repo(root)
        package = _parse_package_json(root)
        npm_deps: list[dict[str, str]] = []
        if package:
            for kind, section in (("runtime", "dependencies"), ("dev", "devDependencies")):
                block = package.get(section) or {}
                if isinstance(block, dict):
                    for name, version in block.items():
                        npm_deps.append({"name": name, "version": str(version), "ecosystem": "npm", "kind": kind})

        pypi_deps = _parse_requirements(root) + _parse_pyproject(root)
        dependencies = (npm_deps + pypi_deps)[:120]
        frameworks = _detect_frameworks(package, dependencies)
        arch = _architecture_summary(root, tree, package)
        security = _security_observations(root, tree)
        debt = _tech_debt_observations(root, tree, file_count)
        has_readme = (root / "README.md").is_file()
        has_tests = any(
            p["path"].split("/")[0] in {"tests", "test", "__tests__"} or "/tests/" in p["path"] for p in tree
        )
        health = _health_score(frameworks, security, debt, has_readme, has_tests)

        steps.append(
            {
                "name": "specialist",
                "status": "complete",
                "detail": f"Scanned {file_count} files ({round(total_bytes / 1024 / 1024, 2)} MB); {len(frameworks)} frameworks, {len(dependencies)} dependencies.",
            }
        )
        steps.append({"name": "governance", "status": "complete", "detail": f"Health score {health}/100. Sandbox workspace scheduled for destruction."})

        analysis: dict[str, Any] = {
            "repository": {
                "url": f"https://github.com/{owner}/{repo}",
                "owner": owner,
                "name": repo,
                "visibility": "public",
                "clone_depth": 1,
            },
            "file_tree_sample": tree[:80],
            "stats": {"files_scanned": file_count, "bytes_scanned": total_bytes, "tree_sampled": len(tree)},
            "architecture": arch,
            "frameworks": frameworks,
            "dependencies": dependencies,
            "dependency_summary": {
                "total": len(dependencies),
                "npm": sum(1 for d in dependencies if d["ecosystem"] == "npm"),
                "pypi": sum(1 for d in dependencies if d["ecosystem"] == "pypi"),
            },
            "security_observations": security,
            "tech_debt_observations": debt,
            "onboarding": _onboarding_explanation(owner, repo, arch, frameworks),
            "health_score": health,
            "architecture_summary": (
                f"{owner}/{repo} uses {', '.join(f['name'] for f in frameworks) or 'a polyglot stack'}. "
                f"Layout: {', '.join(arch.get('patterns') or [])}. "
                f"{file_count} files analyzed with health score {health}/100."
            ),
        }

        tokens = max(500, file_count * 2 + len(json.dumps(analysis)) // 4)
        return RepoIngestionResult(analysis=analysis, steps=steps, tokens_used=tokens)
