'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../lib/auth-context';
import { fetchAllTeams, fetchDashboardData, ApiError } from '../../lib/api';

const ACCENT = '#6366f1';
const LEADS_COLOR = '#38bdf8';
const SUCCESS = '#22c55e';
const WARNING = '#f59e0b';
const DANGER = '#ef4444';
const NEUTRAL = '#94a3b8';

const TARGET_LABELS = { on_target: 'On Target', underperforming: 'Underperforming', critical: 'Critical' };
const TARGET_COLORS = { on_target: SUCCESS, underperforming: WARNING, critical: DANGER };
const ATTENDANCE_LABELS = { present: 'Present', absent: 'Absent' };
const ATTENDANCE_COLORS = { present: SUCCESS, absent: DANGER };

function niceLabel(map, key) {
  return map[key] || key;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [allTeams, setAllTeams] = useState([]);
  const [teamId, setTeamId] = useState(null); // null = "All Teams" (admin only)
  const [from, setFrom] = useState(daysAgo(6));
  const [to, setTo] = useState(daysAgo(0));

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
    else if (!authLoading && user?.role === 'agent') router.replace('/');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetchAllTeams()
      .then((teams) => {
        setAllTeams(teams);
        if (!isAdmin) setTeamId(user.teamId || null);
      })
      .catch((err) => setError(err.message));
  }, [user, isAdmin]);

  useEffect(() => {
    if (!user) return;
    if (!isAdmin && !teamId) return; // team_lead without a team yet
    setLoading(true);
    setError('');
    fetchDashboardData(isAdmin ? teamId || 'all' : teamId, from, to)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [user, isAdmin, teamId, from, to]);

  const attendanceChart = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.attendance).map(([key, count]) => ({
      key,
      name: niceLabel(ATTENDANCE_LABELS, key),
      value: count,
      color: ATTENDANCE_COLORS[key] || NEUTRAL,
    }));
  }, [data]);

  const targetChart = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.callTarget).map(([key, count]) => ({
      key,
      name: niceLabel(TARGET_LABELS, key),
      count,
      color: TARGET_COLORS[key] || NEUTRAL,
    }));
  }, [data]);

  if (authLoading || !user || user.role === 'agent') {
    return <div className="min-h-screen flex items-center justify-center text-muted text-[13px]">Loading…</div>;
  }

  const selectedTeamName = isAdmin
    ? teamId
      ? allTeams.find((t) => t.id === teamId)?.name
      : 'All Teams'
    : allTeams.find((t) => t.id === teamId)?.name;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-4 border-b border-border bg-surface flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-bold text-[17px] tracking-tight">Dashboard</h1>
            <p className="text-[12.5px] text-muted">A quick visual read on performance for the selected range.</p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            {isAdmin && (
              <div>
                <label className="block text-[12px] font-semibold text-muted mb-1">Team</label>
                <select
                  value={teamId || 'all'}
                  onChange={(e) => setTeamId(e.target.value === 'all' ? null : e.target.value)}
                  className="px-2.5 py-2 bg-surface-alt border border-transparent rounded-lg text-[13px] focus:outline-none focus:border-accent"
                >
                  <option value="all">All Teams</option>
                  {allTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-[12px] font-semibold text-muted mb-1">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="px-2.5 py-2 bg-surface-alt border border-transparent rounded-lg text-[13px] focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-muted mb-1">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="px-2.5 py-2 bg-surface-alt border border-transparent rounded-lg text-[13px] focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 text-[13px] text-danger bg-surface-alt border border-danger rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {!isAdmin && !teamId ? (
            <div className="text-[13px] text-muted text-center py-10">
              You&apos;re not assigned to a team yet — ask an admin to add you to one.
            </div>
          ) : loading ? (
            <div className="text-[13px] text-muted text-center py-10">Loading dashboard…</div>
          ) : data ? (
            <>
              <p className="text-[12px] text-muted mb-4">
                Showing <span className="font-semibold text-text">{selectedTeamName}</span> · {from} to {to}
              </p>

              {/* KPI cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <KpiCard label="Total FTDs" value={data.kpis.totalFtds} />
                <KpiCard label="Total Leads" value={data.kpis.totalLeads} />
                <KpiCard label="Conversion Rate" value={`${data.kpis.conversionRate.toFixed(2)}%`} />
                <KpiCard label="Active Agents" value={data.kpis.activeAgents} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Trend chart */}
                <div className="lg:col-span-2 bg-surface border border-border rounded-lg shadow-card p-4">
                  <h2 className="font-semibold text-[13.5px] mb-3">FTDs & Leads over time</h2>
                  {data.trend.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={data.trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="ftds" name="FTDs" stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="leads" name="Leads" stroke={LEADS_COLOR} strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Attendance breakdown */}
                <div className="bg-surface border border-border rounded-lg shadow-card p-4">
                  <h2 className="font-semibold text-[13.5px] mb-3">Attendance</h2>
                  {attendanceChart.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={attendanceChart} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                          {attendanceChart.map((entry) => (
                            <Cell key={entry.key} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Call target breakdown */}
                <div className="lg:col-span-3 bg-surface border border-border rounded-lg shadow-card p-4">
                  <h2 className="font-semibold text-[13.5px] mb-3">Call Target breakdown</h2>
                  {targetChart.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={targetChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {targetChart.map((entry) => (
                            <Cell key={entry.key} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value }) {
  return (
    <div className="bg-surface border border-border rounded-lg shadow-card p-4">
      <div className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-1.5">{label}</div>
      <div className="font-mono font-bold text-[22px] text-text">{value}</div>
    </div>
  );
}

function EmptyChart() {
  return <div className="text-[12.5px] text-muted text-center py-16">No data for this range.</div>;
}
