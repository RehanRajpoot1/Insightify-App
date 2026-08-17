'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import RoleFormModal from '../../components/RoleFormModal';
import { useAuth } from '../../lib/auth-context';
import { fetchRoles, deleteRole as apiDeleteRole, fetchAllTeams, ApiError } from '../../lib/api';

export default function RolesPage() {
  const router = useRouter();
  const { user, loading: authLoading, hasPermission } = useAuth();

  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState({});
  const [nonDelegable, setNonDelegable] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
    else if (!authLoading && user && !hasPermission('roles.manage')) router.replace('/');
  }, [authLoading, user, hasPermission, router]);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    const tasks = [fetchRoles()];
    if (user?.role === 'admin') tasks.push(fetchAllTeams());
    Promise.all(tasks)
      .then(([rolesData, teamsData]) => {
        setRoles(rolesData.roles);
        setCatalog(rolesData.catalog);
        setNonDelegable(rolesData.nonDelegable);
        if (teamsData) setTeams(teamsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (user && hasPermission('roles.manage')) load();
  }, [user, hasPermission, load]);

  async function handleDelete(id) {
    try {
      await apiDeleteRole(id);
      setEditingRole(null);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete role');
    }
  }

  if (authLoading || !user || !hasPermission('roles.manage')) {
    return <div className="min-h-screen flex items-center justify-center text-muted text-[13px]">Loading…</div>;
  }

  // What THIS user is allowed to hand out — admin: everything; team_lead: what they hold, minus non-delegable.
  const delegableKeys =
    user.role === 'admin'
      ? Object.keys(catalog)
      : (user.permissions || []).filter((k) => !nonDelegable.includes(k));

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
          <div>
            <h1 className="font-bold text-[17px] tracking-tight">Roles</h1>
            <p className="text-[12.5px] text-muted">
              {user.role === 'admin'
                ? 'Create custom roles and assign them to any user.'
                : 'Create roles for your own team, using only permissions you hold.'}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-accent text-white px-3.5 py-2 rounded-lg font-semibold text-[13px] hover:opacity-90 transition-opacity"
          >
            + Create role
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 text-[13px] text-danger bg-surface-alt border border-danger rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-[13px] text-muted py-10 text-center">Loading roles…</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {roles.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setEditingRole(r)}
                  className="bg-surface border border-border rounded-lg p-4 cursor-pointer hover:border-accent transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[14px]">{r.name}</span>
                    <span className="text-[10.5px] font-mono text-muted bg-surface-alt px-1.5 py-0.5 rounded">
                      {r.scope === 'global' ? 'Global' : r.team?.name || 'Team'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.permissions.map((p) => (
                      <span key={p} className="text-[10.5px] bg-accent-soft text-accent px-1.5 py-0.5 rounded font-mono">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {roles.length === 0 && (
                <div className="col-span-full text-[13px] text-muted text-center py-10">
                  No roles yet — create one to start delegating specific permissions.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <RoleFormModal
          catalog={catalog}
          delegableKeys={delegableKeys}
          isAdmin={user.role === 'admin'}
          teams={teams}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {editingRole && (
        <RoleFormModal
          role={editingRole}
          catalog={catalog}
          delegableKeys={delegableKeys}
          isAdmin={user.role === 'admin'}
          teams={teams}
          onClose={() => setEditingRole(null)}
          onSaved={() => {
            setEditingRole(null);
            load();
          }}
          onDeleted={handleDelete}
        />
      )}
    </div>
  );
}
