# Nexus AI

Nexus AI is a production-shaped Enterprise AI Workforce Marketplace: browse, deploy, publish, and operate autonomous AI agents across engineering, revenue, compliance, and operations teams.

## Architecture

- `apps/web`: Next.js 15, React, TypeScript, TailwindCSS, Framer Motion, shadcn-inspired components.
- `apps/api`: FastAPI, PostgreSQL, Redis, SQLAlchemy async ORM, JWT auth, WebSockets, RBAC, rate limiting, agent orchestration.
- `infra`: Docker, Railway, Vercel, GitHub Actions, deployment docs.

## Quick Start

1. Copy environment files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

2. Start the full stack:

```bash
docker compose up --build
```

3. Apply database migrations:

```bash
docker compose exec api alembic upgrade head
```

4. Open:

- Web: http://localhost:3000
- API docs: http://localhost:8000/docs

## Local Development

Backend:

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Frontend:

```bash
npm install
npm run dev:web
```

## Production Notes

- Configure `JWT_SECRET`, OAuth credentials, Stripe keys, OpenAI/Gemini keys, Postgres, and Redis before deployment.
- Railway can deploy `apps/api` with `railway.json`.
- Vercel can deploy `apps/web` with `vercel.json`.
- GitHub Actions runs backend syntax checks and frontend type/lint/build checks.

## Core Capabilities

- JWT auth with OAuth endpoints, forgot-password token flow, protected API routes.
- Agent marketplace with search, filters, categories, ratings, pricing, reviews, deployments.
- Agent Builder Studio with tools, prompts, workflow JSON, files metadata, and live test executions.
- Multi-agent execution engine for QA testing, DevOps monitoring, repository understanding, compliance audit, sales intelligence, and RFP proposal workflows.
- Execution playground with reasoning steps, token usage, status streaming, and websocket notifications.
- Admin APIs for users, agents, reports, monetization, analytics.
- Stripe checkout/subscription hooks, usage billing events, marketplace commission records.
