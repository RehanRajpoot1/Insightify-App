export function initials(fullName) {
  const parts = (fullName || '').trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

export function statusMeta(status) {
  switch (status) {
    case 'active':
      return { label: 'Active', dot: 'bg-success', badge: 'bg-success-soft text-success' };
    case 'leave':
      return { label: 'On leave', dot: 'bg-warning', badge: 'bg-warning-soft text-warning' };
    default:
      return { label: 'Inactive', dot: 'bg-muted/50', badge: 'bg-surface-alt text-muted' };
  }
}

// Backend doesn't store a team color, so derive a stable one from the team id.
const TEAM_COLORS = ['#3452FF', '#17A673', '#E8A83C', '#D8546B', '#7C5CFF', '#0EA5A0'];

export function colorForTeam(teamId) {
  if (!teamId) return TEAM_COLORS[0];
  let hash = 0;
  for (let i = 0; i < teamId.length; i += 1) hash = (hash * 31 + teamId.charCodeAt(i)) >>> 0;
  return TEAM_COLORS[hash % TEAM_COLORS.length];
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function roleLabel(role) {
  if (role === 'team_lead') return 'Team Lead';
  if (role === 'admin') return 'Admin';
  return 'Agent';
}

// Matches an agent (camelCase fields from the API: fullName, crmName) against
// the current search query and status filter.
export function agentMatchesFilters(agent, teamName, query, statusFilter) {
  const q = query.trim().toLowerCase();
  const matchesQuery =
    !q ||
    agent.fullName?.toLowerCase().includes(q) ||
    agent.crmName?.toLowerCase().includes(q) ||
    teamName?.toLowerCase().includes(q);
  const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
  return matchesQuery && matchesStatus;
}

// CRM name preview — mirrors the backend logic in crmNameGenerator.js so the
// UI can show a suggestion before the agent is saved. The real, collision-checked
// value still comes from POST /api/agents/crm-name-suggest.
export function previewCrmName(fullName) {
  const skipWords = ['syed', 'syeda', 'muhammad', 'mohammad', 'mian'];
  const parts = fullName.trim().split(/\s+/);
  let firstIdx = parts.findIndex((p) => !skipWords.includes(p.toLowerCase()));
  if (firstIdx === -1) firstIdx = 0;

  const first = parts[firstIdx];
  const last = parts[parts.length - 1] || '';
  return `${first.toLowerCase()}_${last.slice(0, 2).toLowerCase()}`;
}
