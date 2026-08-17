# Roster — Backend (Express + Prisma + PostgreSQL)

Implements the API from the blueprint: Campaigns, Teams, Agents, RBAC, bulk import/export,
and the `/api/teams/grouped` endpoint the frontend consumes directly.

## 1. Start PostgreSQL

```bash
docker compose up -d
```

This starts Postgres on `localhost:5432` (user/pass: `postgres`/`postgres`, db: `roster`).
No Docker? Point `DATABASE_URL` in `.env` at any Postgres instance instead.

## 2. Install & configure

```bash
npm install
cp .env.example .env
```

`.env` already matches the docker-compose defaults — no changes needed for local dev.

## 3. Create tables & seed data

```bash
npx prisma migrate dev --name init
npm run seed
```

This creates the same 3 teams / 14 agents as the frontend's dummy data, plus a login:

```
admin@roster.local / changeme123
```

## 4. Run the server

```bash
npm run dev
```

Server runs on `http://localhost:4000`. Health check: `GET /health`.

## 5. Test it

```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@roster.local","password":"changeme123"}'

# Use the returned token:
curl http://localhost:4000/api/teams/grouped?campaign_tag=TR-1-ENAF \
  -H "Authorization: Bearer <token>"
```

## Connecting the frontend

In the frontend's `.env.local`:
```
NEXT_PUBLIC_API_BASE=http://localhost:4000
```

Then swap `data/dummyTeams.js` for `fetchGroupedTeams()` in `lib/api.js` — the response
shape already matches (`campaign`, `teams[].team_lead`, `teams[].agents[]`).

Note: the frontend's `fetchGroupedTeams` currently doesn't send an Authorization header.
Add `Authorization: Bearer <token>` once you wire up a login screen and store the token
(e.g. in an httpOnly cookie set by the backend, or client state after `/api/auth/login`).

## Routes overview

| Method | Route | Access |
|---|---|---|
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |
| GET/POST/PUT/DELETE | `/api/campaigns` | Admin (write), all (read) |
| GET | `/api/teams/grouped?campaign_tag=` | Authenticated |
| GET/POST/PUT/DELETE | `/api/teams` | Admin (write), all (read) |
| GET/POST/PUT/DELETE | `/api/agents` | Scoped by role — see `middleware/rbac.js` |
| PATCH | `/api/agents/:id/reassign` | Admin |
| PATCH | `/api/agents/bulk-reassign` | Admin |
| POST | `/api/agents/bulk-import` | Admin — upload CSV/XLSX, returns preview |
| POST | `/api/agents/bulk-import/confirm` | Admin — commits a previewed batch |
| GET | `/api/agents/export?format=csv\|xlsx` | Admin, Team Lead (own team) |
| POST | `/api/agents/crm-name-suggest` | Admin, Team Lead |

## Notes

- Bulk-imported agents get a placeholder email (`crmname@placeholder.local`) and a random
  password — edit those via `PUT /api/agents/:id` after import, or extend the import flow
  to collect real emails per row.
- `npx prisma studio` gives you a GUI to browse/edit the database directly while developing.
