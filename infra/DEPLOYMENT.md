# Nexus AI Deployment

## Railway API

1. Create a Railway Postgres and Redis service.
2. Deploy `apps/api`.
3. Set environment variables from `apps/api/.env.example`.
4. Run `alembic upgrade head` as a release command or one-off job.

## Vercel Web

1. Import the repository.
2. Set root directory to `apps/web`.
3. Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL`.
4. Deploy with the included `vercel.json`.

## Security Checklist

- Use a 32+ byte `JWT_SECRET`.
- Restrict CORS to production domains.
- Store OAuth and Stripe secrets in platform secret managers.
- Rotate provider API keys and use least-privilege database users.
- Enable Postgres backups, Redis persistence, request logging, and alerting.
