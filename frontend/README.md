# Roster — Agent Management Frontend

Next.js frontend for the CRM/Agent Management System, built from the approved dashboard design.
Currently wired to dummy data (`data/dummyTeams.js`) — no backend needed to run this.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Structure

```
app/
  layout.jsx        — root layout + theme provider
  page.jsx           — dashboard page (state: view, search, status filter)
  globals.css         — design tokens (CSS variables) + Tailwind
components/
  Sidebar.jsx         — campaign list + nav
  Topbar.jsx          — search, view toggle, add-agent button
  FilterBar.jsx        — status filter chips
  TeamKanbanView.jsx   — board view (one column per team)
  AgentTable.jsx        — spreadsheet-style table view
  AgentCard.jsx          — single agent card (used in kanban)
  ThemeToggle.jsx         — light/dark toggle (next-themes)
data/
  dummyTeams.js            — placeholder for GET /api/teams/grouped
lib/
  utils.js                  — initials, status badges, filtering, CRM-name suggestion
  api.js                     — fetch helpers, ready to point at the real backend
```

## Connecting to the real backend

In `app/page.jsx`, replace the static import:

```js
import { campaign, teams } from '../data/dummyTeams';
```

with a fetch on mount:

```js
import { useEffect, useState } from 'react';
import { fetchGroupedTeams } from '../lib/api';

const [data, setData] = useState(null);
useEffect(() => {
  fetchGroupedTeams('TR-1-ENAF').then(setData);
}, []);
```

Set `NEXT_PUBLIC_API_BASE` in `.env.local` to point at your Express/FastAPI backend
(see the backend blueprint for the `/api/teams/grouped` route).

## Notes

- Drag-and-drop reassignment (kanban → different team) is not wired yet — `lib/api.js`
  already has `reassignAgent()` ready for when you add `@dnd-kit/core`.
- The "Add agent" button currently doesn't open a form — next step once the backend
  agent-creation endpoint exists.
