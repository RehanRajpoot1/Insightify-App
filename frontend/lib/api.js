// Central API client for the Roster backend.
// Handles auth token storage, attaches Authorization headers, and exposes
// one function per backend endpoint the frontend actually uses.

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
const TOKEN_KEY = 'roster_token';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body (e.g. 204 No Content) — fine
  }

  if (!res.ok) {
    if (res.status === 401) setToken(null);
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  }

  return data;
}

// ---- Auth ----
export async function login(email, password) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
  setToken(data.token);
  return data.user;
}

export async function fetchMe() {
  const data = await request('/api/auth/me');
  return data.user;
}

export function logout() {
  setToken(null);
}

export async function changePassword(currentPassword, newPassword) {
  await request('/api/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } });
}

// ---- Campaigns ----
export async function fetchCampaigns() {
  const data = await request('/api/campaigns');
  return data.campaigns;
}

// ---- Teams ----
export async function fetchGroupedTeams(campaignTag) {
  const data = await request(`/api/teams/grouped?campaign_tag=${encodeURIComponent(campaignTag)}`);
  return data;
}

export async function fetchAllTeams() {
  const data = await request('/api/teams');
  return data.teams;
}

export async function fetchTeamDetail(teamId) {
  const data = await request(`/api/teams/${teamId}`);
  return data.team;
}

export async function createTeam(payload) {
  const data = await request('/api/teams', { method: 'POST', body: payload });
  return data.team;
}

export async function updateTeamRecord(id, payload) {
  const data = await request(`/api/teams/${id}`, { method: 'PUT', body: payload });
  return data.team;
}

export async function deleteTeamRecord(id) {
  await request(`/api/teams/${id}`, { method: 'DELETE' });
}

// ---- Agents ----
export async function fetchAllAgents() {
  const data = await request('/api/agents?limit=500');
  return data.agents;
}

export async function fetchAgentsByTeam(teamId) {
  const data = await request(`/api/agents?team_id=${encodeURIComponent(teamId)}&limit=500`);
  return data.agents;
}

export async function suggestCrmName(fullName) {
  const data = await request('/api/agents/crm-name-suggest', {
    method: 'POST',
    body: { full_name: fullName },
  });
  return data.suggestion;
}

export async function createAgent(payload) {
  const data = await request('/api/agents', { method: 'POST', body: payload });
  return data.agent;
}

export async function updateAgent(id, payload) {
  const data = await request(`/api/agents/${id}`, { method: 'PUT', body: payload });
  return data.agent;
}

export async function deactivateAgent(id) {
  const data = await request(`/api/agents/${id}`, { method: 'DELETE' });
  return data.agent;
}

export async function bulkDeleteAgents(ids) {
  const data = await request('/api/agents/bulk', { method: 'DELETE', body: { ids } });
  return data.deleted;
}

export async function reassignAgent(agentId, teamId) {
  const data = await request(`/api/agents/${agentId}/reassign`, {
    method: 'PATCH',
    body: { team_id: teamId },
  });
  return data.agent;
}

// ---- Daily Reports ----
export async function fetchDailyReport(dateStr, teamId) {
  const data = await request(`/api/daily-reports?date=${encodeURIComponent(dateStr)}&team_id=${encodeURIComponent(teamId)}`);
  return data.report;
}

export async function fetchDailyReportDates(teamId) {
  const data = await request(`/api/daily-reports/dates?team_id=${encodeURIComponent(teamId)}`);
  return data.dates;
}

export async function fetchReportSummary(teamId, from, to) {
  const params = new URLSearchParams({ team_id: teamId, from, to });
  return request(`/api/daily-reports/summary?${params.toString()}`); // { agents, totals, reportCount }
}

export async function saveDailyReport(payload) {
  const data = await request('/api/daily-reports', { method: 'PUT', body: payload });
  return data.report;
}

export async function updateDailyReportRow(reportId, rowId, payload) {
  const data = await request(`/api/daily-reports/${reportId}/rows/${rowId}`, { method: 'PATCH', body: payload });
  return data.row;
}

// ---- Roles ----
export async function fetchRoles() {
  return request('/api/roles'); // { roles, catalog, nonDelegable }
}

export async function createRole(payload) {
  const data = await request('/api/roles', { method: 'POST', body: payload });
  return data.role;
}

export async function updateRole(id, payload) {
  const data = await request(`/api/roles/${id}`, { method: 'PUT', body: payload });
  return data.role;
}

export async function deleteRole(id) {
  await request(`/api/roles/${id}`, { method: 'DELETE' });
}

// ---- Report Options (custom Call Target / Attendance dropdown values) ----
export async function fetchReportOptions(type) {
  const data = await request(`/api/report-options?type=${encodeURIComponent(type)}`);
  return data.options;
}

export async function addReportOption(type, value) {
  await request('/api/report-options', { method: 'POST', body: { type, value } });
}

// ---- Dashboard ----
export async function fetchDashboardData(teamId, from, to) {
  const params = new URLSearchParams({ team_id: teamId || 'all', from, to });
  return request(`/api/daily-reports/dashboard?${params.toString()}`); // { kpis, trend, attendance, callTarget }
}

export { ApiError };
