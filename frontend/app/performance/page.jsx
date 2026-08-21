'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../lib/auth-context';
import { fetchAllTeams, fetchReportSummary, ApiError } from '../../lib/api';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function PerformancePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [allTeams, setAllTeams] = useState([]);
  const [teamId, setTeamId] = useState(null);
  const [teamSearch, setTeamSearch] = useState('');
  const [showTeamList, setShowTeamList] = useState(false);

  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
    else if (!authLoading && user && user.role === 'agent') router.replace('/');
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

  const filteredTeams = useMemo(() => {
    const q = teamSearch.trim().toLowerCase();
    if (!q) return allTeams;
    return allTeams.filter((t) => t.name.toLowerCase().includes(q));
  }, [allTeams, teamSearch]);

  const selectedTeamName = allTeams.find((t) => t.id === teamId)?.name || '';

  function handleSearch() {
    if (!teamId) return setError('Please select a team first');
    if (!from || !to) return setError('Please pick both dates');
    setError('');
    setLoading(true);
    fetchReportSummary(teamId, from, to)
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load summary'))
      .finally(() => setLoading(false));
  }

  if (authLoading || !user || user.role === 'agent') {
    return <div className="min-h-screen flex items-center justify-center text-muted text-[13px]">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-4 border-b border-border bg-surface">
          <h1 className="font-bold text-[17px] tracking-tight">Performance</h1>
          <p className="text-[12.5px] text-muted">
            Pick a date range to see each agent&apos;s FTDs, Fintana leads, and Spova leads totalled up.
          </p>
        </div>

        <div className="px-6 py-4 border-b border-border flex flex-wrap items-end gap-3">
          {isAdmin && (
            <div className="relative">
              <label className="block text-[12px] font-semibold text-muted mb-1">Team leader</label>
              <input
                value={teamId ? selectedTeamName : teamSearch}
                onChange={(e) => {
                  setTeamId(null);
                  setTeamSearch(e.target.value);
                  setShowTeamList(true);
                }}
                onFocus={() => setShowTeamList(true)}
                placeholder="Search team leader name…"
                className="w-64 px-3 py-2 bg-surface-alt border border-transparent rounded-lg text-[13px] focus:outline-none focus:border-accent"
              />
              {showTeamList && filteredTeams.length > 0 && (
                <div className="absolute z-10 mt-1 w-64 max-h-56 overflow-y-auto bg-surface border border-border rounded-lg shadow-card">
                  {filteredTeams.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setTeamId(t.id);
                        setTeamSearch('');
                        setShowTeamList(false);
                      }}
                      className="px-3 py-2 text-[13px] hover:bg-surface-alt cursor-pointer"
                    >
                      {t.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-[12px] font-semibold text-muted mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-2 bg-surface-alt border border-transparent rounded-lg text-[13px] focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-muted mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-2 bg-surface-alt border border-transparent rounded-lg text-[13px] focus:outline-none focus:border-accent"
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-accent text-white px-4 py-2 rounded-lg font-semibold text-[13px] hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? 'Loading…' : 'Search'}
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 text-[13px] text-danger bg-surface-alt border border-danger rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {!result && !loading && (
            <div className="text-[13px] text-muted text-center py-10">
              {isAdmin ? 'Search a team leader, pick a date range, then click Search.' : 'Pick a date range, then click Search.'}
            </div>
          )}

          {result && (
            <>
              <p className="text-[12.5px] text-muted mb-3">
                {result.reportCount} day(s) of reports found for {selectedTeamName || 'this team'} between {from} and {to}.
              </p>
              <table className="w-full border-collapse bg-surface border border-border rounded-lg overflow-hidden shadow-card">
                <thead>
                  <tr>
                    {['Agent', 'Total FTDs', 'Leads on Fintana', 'Leads on Spova'].map((h) => (
                      <th
                        key={h}
                        className="text-left text-[11px] font-semibold text-muted uppercase tracking-wide px-3.5 py-2.5 bg-surface-alt border-b border-border"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.agents.map((a) => (
                    <tr key={a.agentId || a.agentName} className="hover:bg-surface-alt transition-colors">
                      <td className="px-3.5 py-2.5 border-b border-border text-[13px] font-semibold">{a.agentName}</td>
                      <td className="px-3.5 py-2.5 border-b border-border font-mono text-[13px]">{a.totalFtds}</td>
                      <td className="px-3.5 py-2.5 border-b border-border font-mono text-[13px]">{a.totalLeadsFintana}</td>
                      <td className="px-3.5 py-2.5 border-b border-border font-mono text-[13px]">{a.totalLeadsSpova}</td>
                    </tr>
                  ))}
                  {result.agents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3.5 py-8 text-center text-[13px] text-muted">
                        No report data found for this range.
                      </td>
                    </tr>
                  )}
                </tbody>
                {result.agents.length > 0 && (
                  <tfoot>
                    <tr className="bg-surface-alt">
                      <td className="px-3.5 py-2.5 border-t-2 border-border font-bold text-[13px]">TOTAL</td>
                      <td className="px-3.5 py-2.5 border-t-2 border-border font-mono font-bold text-[13px]">
                        {result.totals.totalFtds}
                      </td>
                      <td className="px-3.5 py-2.5 border-t-2 border-border font-mono font-bold text-[13px]">
                        {result.totals.totalLeadsFintana}
                      </td>
                      <td className="px-3.5 py-2.5 border-t-2 border-border font-mono font-bold text-[13px]">
                        {result.totals.totalLeadsSpova}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
