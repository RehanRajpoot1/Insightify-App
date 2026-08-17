# Roster — Agent Management System

Full CRM/agent management app: Next.js frontend + Express/Prisma/PostgreSQL backend, both in this one folder.

```
roster-app/
├── frontend/     — Next.js dashboard (Board/Table views, search, filters)
├── backend/      — Express API + Prisma + PostgreSQL
└── docker-compose.yml   — runs all three together
```

## Fastest way to run everything (Docker)

From this folder:

```bash
docker compose up --build
```

This starts:
- **Postgres** on `localhost:5432`
- **Backend API** on `http://localhost:4000`
- **Frontend** on `http://localhost:3000`

First time only — seed the database with demo teams/agents (in a new terminal):

```bash
docker compose exec backend npm run seed
```

Then open **http://localhost:3000**. Login: `admin@roster.local` / `changeme123`

Stop everything with `docker compose down` (add `-v` to also wipe the database).

## Running without Docker (manual)

If you don't want Docker, run each piece separately — see the README inside each folder:
- `backend/README.md` — needs a Postgres instance + Prisma migrate + seed
- `frontend/README.md` — needs the backend running first, or works standalone with dummy data

## Current state

- **Frontend** ships with dummy data by default (`frontend/data/dummyTeams.js`) so it runs
  even without the backend — good for quick UI iteration.
- **Backend** is fully wired (auth, RBAC, bulk import/export, `/api/teams/grouped`) but the
  frontend isn't yet calling it — that's the next step (swap the dummy import for
  `fetchGroupedTeams()` in `frontend/lib/api.js`).

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | Next.js (App Router), Tailwind CSS, next-themes |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Bulk import/export | papaparse, xlsx (SheetJS) |
