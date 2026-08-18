'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import DailyReportTable from '../../components/DailyReportTable';
import BulkAddModal from '../../components/BulkAddModal';
import AddFromRosterModal from '../../components/AddFromRosterModal';
import { useAuth } from '../../lib/auth-context';
import {
  fetchDailyReport,
  fetchDailyReportDates,
  saveDailyReport,
  updateDailyReportRow,
  fetchAllTeams,
  fetchAgentsByTeam,
  ApiError,
} from '../../lib/api';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function emptyRow(overrides = {}) {
  return {
    id: `new-${Math.random().toString(36).slice(2)}`,
    agentId: null,
    agentName: '',
    totalFtds: 0,
    totalLeadsFintana: 0,
    totalLeadsSpova: 0,
    reason: '',
    campaign: '',
    callTarget: 'on_target',
    attendance: 'present',
    ...overrides,
  };
}

export default function DailyReportPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const isManager = user?.role === 'admin' || user?.role === 'team_lead';

  const [date, setDate] = useState(todayStr());
  const [reportId, setReportId] = useState(null);
  const [rows, setRows] = useState([]);
  const [recentDates, setRecentDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [showRosterPicker, setShowRosterPicker] = useState(false);
  const [rosterAgents, setRosterAgents] = useState([]);

  // Admin picks which team's report to view; team_lead/agent are pinned to their own team.
  const [allTeams, setAllTeams] = useState([]);
  const [teamId, setTeamId] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin') {
      fetchAllTeams()
        .then((teams) => {
          setAllTeams(teams);
          setTeamId((prev) => prev || teams[0]?.id || null);
        })
        .catch((err) => setError(err.message));
    } else {
      setTeamId(user.teamId || null);
    }
  }, [user]);

  useEffect(() => {
    if (!teamId) return;
    fetchAgentsByTeam(teamId)
      .then(setRosterAgents)
      .catch(() => {});
  }, [teamId]);

  useEffect(() => {
    if (!teamId) return;
    fetchDailyReportDates(teamId)
      .then(setRecentDates)
      .catch(() => {});
  }, [teamId, savedMsg]);

  const loadReport = useCallback((d, tId) => {
    if (!tId) return;
    setLoading(true);
    setError('');
    fetchDailyReport(d, tId)
      .then((report) => {
        if (report) {
          setReportId(report.id);
          setRows(
            report.rows.map((r) => ({
              id: r.id,
              agentId: r.agentId,
              agentName: r.agentName,
              totalFtds: r.totalFtds,
              totalLeadsFintana: r.totalLeadsFintana,
              totalLeadsSpova: r.totalLeadsSpova,
              reason: r.reason,
              campaign: r.campaign,
              callTarget: r.callTarget,
              attendance: r.attendance,
            }))
          );
        } else {
          setReportId(null);
          setRows([]);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (teamId) loadReport(date, teamId);
  }, [date, teamId, loadReport]);

  function updateRow(idx, newRow) {
    setRows((prev) => prev.map((r, i) => (i === idx ? newRow : r)));
  }

  function removeRow(idx) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function bulkAddRows(names) {
    setRows((prev) => [...prev, ...names.map((name) => emptyRow({ agentName: name }))]);
    setShowBulkAdd(false);
  }

  function addFromRoster(agents) {
    setRows((prev) => {
      const existingIds = new Set(prev.map((r) => r.agentId).filter(Boolean));
      const toAdd = agents.filter((a) => !existingIds.has(a.id));
      return [...prev, ...toAdd.map((a) => emptyRow({ agentId: a.id, agentName: a.fullName }))];
    });
    setShowRosterPicker(false);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSavedMsg('');
    try {
      const saved = await saveDailyReport({
        date,
        team_id: teamId,
        rows: rows.map((r) => ({
          agentId: r.agentId,
          agentName: r.agentName,
          totalFtds: r.totalFtds,
          totalLeadsFintana: r.totalLeadsFintana,
          totalLeadsSpova: r.totalLeadsSpova,
          reason: r.reason,
          campaign: r.campaign,
          callTarget: r.callTarget,
          attendance: r.attendance,
        })),
      });
      setReportId(saved.id);
      setSavedMsg('Saved ✓');
      setTimeout(() => setSavedMsg(''), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save report');
    } finally {
      setSaving(false);
    }
  }

  const myRow = !isManager ? rows.find((r) => r.agentId === user?.id) : null;

  async function handleSaveMyRow() {
    if (!reportId || !myRow) return;
    setSaving(true);
    setError('');
    setSavedMsg('');
    try {
      await updateDailyReportRow(reportId, myRow.id, {
        totalFtds: myRow.totalFtds,
        totalLeadsFintana: myRow.totalLeadsFintana,
        totalLeadsSpova: myRow.totalLeadsSpova,
        reason: myRow.reason,
        campaign: myRow.campaign,
        callTarget: myRow.callTarget,
        attendance: myRow.attendance,
      });
      setSavedMsg('Saved ✓');
      setTimeout(() => setSavedMsg(''), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save your row');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-muted text-[13px]">Loading…</div>;
  }

  if (!teamId) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-muted text-[13px]">
          You&apos;re not assigned to a team yet — ask an admin to add you to one.
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface flex-wrap gap-3">
          <div>
            <h1 className="font-bold text-[17px] tracking-tight">Daily Report</h1>
            <p className="text-[12.5px] text-muted">
              {isManager ? 'Enter each agent\'s totals for the day — Total Leads calculates automatically.' : 'You can only edit your own row.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {user.role === 'admin' && (
              <>
                <label className="text-[12.5px] text-muted font-medium">Team</label>
                <select
                  value={teamId || ''}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="px-2.5 py-1.5 bg-surface-alt border border-transparent rounded-lg text-[13px] focus:outline-none focus:border-accent"
                >
                  {allTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </>
            )}
            <label className="text-[12.5px] text-muted font-medium">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-2.5 py-1.5 bg-surface-alt border border-transparent rounded-lg text-[13px] focus:outline-none focus:border-accent"
            />
            {isManager && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="ml-2 bg-accent text-white px-3.5 py-2 rounded-lg font-semibold text-[13px] hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save report'}
              </button>
            )}
            {!isManager && myRow && (
              <button
                onClick={handleSaveMyRow}
                disabled={saving}
                className="ml-2 bg-accent text-white px-3.5 py-2 rounded-lg font-semibold text-[13px] hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save my numbers'}
              </button>
            )}
            {savedMsg && <span className="text-[12.5px] text-success font-semibold">{savedMsg}</span>}
          </div>
        </div>

        {recentDates.length > 0 && (
          <div className="flex items-center gap-1.5 px-6 py-2.5 border-b border-border overflow-x-auto">
            <span className="text-[11px] text-muted font-semibold uppercase mr-1 shrink-0">Recent:</span>
            {recentDates.map((d) => {
              const dStr = d.slice(0, 10);
              const active = dStr === date;
              return (
                <button
                  key={dStr}
                  onClick={() => setDate(dStr)}
                  className={`shrink-0 text-[12px] px-2 py-1 rounded-md font-mono transition-colors ${
                    active ? 'bg-accent text-white' : 'bg-surface-alt text-muted hover:text-text'
                  }`}
                >
                  {dStr}
                </button>
              );
            })}
          </div>
        )}

        <div className="p-6">
          {error && (
            <div className="mb-4 text-[13px] text-danger bg-surface-alt border border-danger rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {!isManager && !loading && !myRow && (
            <div className="mb-4 text-[13px] text-muted bg-surface-alt border border-border rounded-lg px-3 py-2">
              Your row hasn&apos;t been added to today&apos;s report yet — ask your team lead to add you.
            </div>
          )}

          {loading ? (
            <div className="text-[13px] text-muted py-10 text-center">Loading report…</div>
          ) : (
            <>
              <DailyReportTable
                rows={rows}
                onChangeRow={updateRow}
                onRemoveRow={removeRow}
                editableRowId={isManager ? undefined : myRow?.id ?? '__none__'}
              />
              {isManager && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={addRow}
                    className="px-3.5 py-2 rounded-lg border border-dashed border-border text-muted text-[12.5px] font-semibold hover:border-accent hover:text-accent transition-colors"
                  >
                    + Add agent
                  </button>
                  <button
                    onClick={() => setShowRosterPicker(true)}
                    className="px-3.5 py-2 rounded-lg border border-dashed border-border text-muted text-[12.5px] font-semibold hover:border-accent hover:text-accent transition-colors"
                  >
                    + Add from roster
                  </button>
                  <button
                    onClick={() => setShowBulkAdd(true)}
                    className="px-3.5 py-2 rounded-lg border border-dashed border-border text-muted text-[12.5px] font-semibold hover:border-accent hover:text-accent transition-colors"
                  >
                    + Bulk add agents
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showBulkAdd && (
        <BulkAddModal
          title="Bulk add agents"
          placeholder={'Ahmed Raza\nSara Khan\nBilal Ahmed'}
          onClose={() => setShowBulkAdd(false)}
          onConfirm={bulkAddRows}
        />
      )}

      {showRosterPicker && (
        <AddFromRosterModal
          agents={rosterAgents}
          onClose={() => setShowRosterPicker(false)}
          onConfirm={addFromRoster}
        />
      )}
    </div>
  );
}
