'use client';

import { useState } from 'react';
import { createRole, updateRole, ApiError } from '../lib/api';

export default function RoleFormModal({ role, catalog, delegableKeys, isAdmin, teams, onClose, onSaved, onDeleted }) {
  const isEdit = !!role;
  const [name, setName] = useState(role?.name || '');
  const [scope, setScope] = useState(role?.scope || (isAdmin ? 'global' : 'team'));
  const [teamId, setTeamId] = useState(role?.teamId || teams?.[0]?.id || '');
  const [selected, setSelected] = useState(new Set(role?.permissions || []));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function toggle(key) {
    if (!delegableKeys.includes(key)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Role name is required');
    if (selected.size === 0) return setError('Select at least one permission');
    setSubmitting(true);
    try {
      const payload = { name: name.trim(), permissions: [...selected] };
      if (isAdmin) {
        payload.scope = scope;
        if (scope === 'team') payload.team_id = teamId;
      }
      const saved = isEdit ? await updateRole(role.id, payload) : await createRole(payload);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save role');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    setError('');
    try {
      onDeleted(role.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete role');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-surface border border-border rounded-lg shadow-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-[15px]">{isEdit ? 'Edit role' : 'Create role'}</h2>
          <button onClick={onClose} className="text-muted hover:text-text text-lg leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-[12px] font-semibold text-muted mb-1">Role name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Supervisor"
              className="w-full px-3 py-2 bg-surface-alt border border-transparent rounded-lg text-[13px]
                         focus:outline-none focus:border-accent focus:bg-surface"
            />
          </div>

          {isAdmin && !isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-muted mb-1">Scope</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-alt border border-transparent rounded-lg text-[13px] focus:outline-none focus:border-accent"
                >
                  <option value="global">Global (any team)</option>
                  <option value="team">Specific team</option>
                </select>
              </div>
              {scope === 'team' && (
                <div>
                  <label className="block text-[12px] font-semibold text-muted mb-1">Team</label>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-alt border border-transparent rounded-lg text-[13px] focus:outline-none focus:border-accent"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-[12px] font-semibold text-muted mb-1.5">Permissions</label>
            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto -mx-1 px-1">
              {Object.entries(catalog).map(([key, label]) => {
                const allowed = delegableKeys.includes(key);
                return (
                  <label
                    key={key}
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg ${
                      allowed ? 'hover:bg-surface-alt cursor-pointer' : 'opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(key)}
                      disabled={!allowed}
                      onChange={() => toggle(key)}
                    />
                    <span className="text-[13px]">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {error && <div className="text-[12.5px] text-danger">{error}</div>}

          <div className="flex items-center justify-between mt-2">
            {isEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="text-[12.5px] font-semibold text-danger"
              >
                Delete role
              </button>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={submitting}
              className="bg-accent text-white px-3.5 py-2 rounded-lg font-semibold text-[13px]
                         hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
