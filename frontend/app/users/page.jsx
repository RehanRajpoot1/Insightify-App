'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import AddAgentModal from '../../components/AddAgentModal';
import AgentDetailModal from '../../components/AgentDetailModal';
import { useAuth } from '../../lib/auth-context';
import { fetchAllAgents, fetchAllTeams } from '../../lib/api';
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
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') load();
  }, [user, load]);

  const teamName = (teamId) => teams.find((t) => t.id === teamId)?.name || '—';

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
          <button
            onClick={() => setShowAdd(true)}
            className="bg-accent text-white px-3.5 py-2 rounded-lg font-semibold text-[13px] hover:opacity-90 transition-opacity"
          >
            + Add user
          </button>
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
                  return (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className="hover:bg-surface-alt transition-colors cursor-pointer"
                    >
                      <td className="px-3.5 py-2.5 border-b border-border">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-accent-soft text-accent flex items-center justify-center font-bold text-[10.5px] shrink-0">
                            {initials(u.fullName)}
                          </div>
                          <span className="font-semibold text-[13px]">{u.fullName}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-border text-[13px] text-muted">{u.email}</td>
                      <td className="px-3.5 py-2.5 border-b border-border">
                        <span className="text-[11px] font-semibold bg-accent-soft text-accent px-2 py-0.5 rounded">
                          {roleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-border text-[13px]">{teamName(u.teamId)}</td>
                      <td className="px-3.5 py-2.5 border-b border-border">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1.5 ${s.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-border text-muted">⋯</td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3.5 py-8 text-center text-[13px] text-muted">
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
