'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import AddAgentModal from '../../components/AddAgentModal';
import AgentDetailModal from '../../components/AgentDetailModal';
import { useAuth } from '../../lib/auth-context';
import { fetchAllAgents, fetchAllTeams, bulkDeleteAgents, ApiError } from '../../lib/api';
import { initials, roleLabel, statusMeta } from '../../lib/utils';

export default function UsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [checked, setChecked] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
    else if (!authLoading && user && user.role !== 'admin') router.replace('/');
  }, [authLoading, user, router]);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([fetchAllAgents(), fetchAllTeams()])
      .then(([agentsList, teamsList]) => {
        setUsers(agentsList);
        setTeams(teamsList);
        setChecked(new Set());
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') load();
  }, [user, load]);

  const teamName = (teamId) => teams.find((t) => t.id === teamId)?.name || '—';

  function toggleOne(id) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setChecked((prev) => (prev.size === users.length ? new Set() : new Set(users.map((u) => u.id))));
  }

  async function handleBulkDelete() {
    const ids = [...checked].filter((id) => id !== user.id);
    if (ids.length === 0) return;
    if (!confirm(`Permanently delete ${ids.length} user(s)? This cannot be undone.`)) return;

    setDeleting(true);
    setError('');
    try {
      await bulkDeleteAgents(ids);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete users');
    } finally {
      setDeleting(false);
    }
  }

  if (authLoading || !user || user.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center text-muted text-[13px]">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
          <div>
            <h1 className="font-bold text-[17px] tracking-tight">User Management</h1>
            <p className="text-[12.5px] text-muted">Create login accounts and assign roles.</p>
          </div>
          <div className="flex items-center gap-2">
            {checked.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={deleting}
                className="bg-danger text-white px-3.5 py-2 rounded-lg font-semibold text-[13px] hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : `Delete ${checked.size} selected`}
              </button>
            )}
            <button
              onClick={() => setShowAdd(true)}
              className="bg-accent text-white px-3.5 py-2 rounded-lg font-semibold text-[13px] hover:opacity-90 transition-opacity"
            >
              + Add user
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 text-[13px] text-danger bg-surface-alt border border-danger rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-[13px] text-muted py-10 text-center">Loading users…</div>
          ) : (
            <table className="w-full border-collapse bg-surface border border-border rounded-lg overflow-hidden shadow-card">
              <thead>
                <tr>
                  <th className="px-3.5 py-2.5 bg-surface-alt border-b border-border w-10">
                    <input
                      type="checkbox"
                      checked={users.length > 0 && checked.size === users.length}
                      onChange={toggleAll}
                    />
                  </th>
                  {['User', 'Email', 'Role', 'Team', 'Status', ''].map((h, i) => (
                    <th
                      key={i}
                      className="text-left text-[11px] font-semibold text-muted uppercase tracking-wide px-3.5 py-2.5 bg-surface-alt border-b border-border"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const s = statusMeta(u.status);
                  const isSelf = u.id === user.id;
                  return (
                    <tr key={u.id} className="hover:bg-surface-alt transition-colors">
                      <td className="px-3.5 py-2.5 border-b border-border" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={checked.has(u.id)}
                          disabled={isSelf}
                          title={isSelf ? "You can't delete your own account" : undefined}
                          onChange={() => toggleOne(u.id)}
                        />
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-border cursor-pointer" onClick={() => setSelectedUser(u)}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-accent-soft text-accent flex items-center justify-center font-bold text-[10.5px] shrink-0">
                            {initials(u.fullName)}
                          </div>
                          <span className="font-semibold text-[13px]">{u.fullName}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-border text-[13px] text-muted cursor-pointer" onClick={() => setSelectedUser(u)}>
                        {u.email}
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-border cursor-pointer" onClick={() => setSelectedUser(u)}>
                        <span className="text-[11px] font-semibold bg-accent-soft text-accent px-2 py-0.5 rounded">
                          {roleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-border text-[13px] cursor-pointer" onClick={() => setSelectedUser(u)}>
                        {teamName(u.teamId)}
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-border cursor-pointer" onClick={() => setSelectedUser(u)}>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1.5 ${s.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-border text-muted cursor-pointer" onClick={() => setSelectedUser(u)}>
                        ⋯
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3.5 py-8 text-center text-[13px] text-muted">
                      No users yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAdd && (
        <AddAgentModal
          teams={teams}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}

      {selectedUser && (
        <AgentDetailModal
          agent={selectedUser}
          teams={teams}
          onClose={() => setSelectedUser(null)}
          onUpdated={() => {
            setSelectedUser(null);
            load();
          }}
          onDeactivated={() => {
            setSelectedUser(null);
            load();
          }}
        />
      )}
    </div>
  );
}
