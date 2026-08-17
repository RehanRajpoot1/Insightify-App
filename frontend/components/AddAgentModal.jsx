'use client';

import { useEffect, useState } from 'react';
import { createAgent, suggestCrmName, fetchRoles, ApiError } from '../lib/api';
import { previewCrmName } from '../lib/utils';
import { useAuth } from '../lib/auth-context';

export default function AddAgentModal({ teams, defaultTeamId, onClose, onCreated }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [fullName, setFullName] = useState('');
  const [crmName, setCrmName] = useState('');
  const [crmTouched, setCrmTouched] = useState(false);
  const [email, setEmail] = useState('');
  const [teamId, setTeamId] = useState(defaultTeamId || teams[0]?.id || '');
  const [role, setRole] = useState('agent');
  const [customRoleId, setCustomRoleId] = useState('');
  const [availableRoles, setAvailableRoles] = useState([]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRoles()
      .then((data) => setAvailableRoles(data.roles))
      .catch(() => {});
  }, []);

  // Live-preview a CRM name as the user types, unless they've edited it manually.
  useEffect(() => {
    if (crmTouched || !fullName.trim()) return;
    setCrmName(previewCrmName(fullName));
  }, [fullName, crmTouched]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // Ask the backend for the real, collision-checked crm name if the user
      // never customized the preview.
      let finalCrmName = crmName;
      if (!crmTouched && fullName.trim()) {
        finalCrmName = await suggestCrmName(fullName);
      }

      const agent = await createAgent({
        fullName,
        crmName: finalCrmName,
        email,
        teamId: teamId || undefined,
        role: isAdmin ? role : 'agent',
        customRoleId: customRoleId || undefined,
        password,
      });
      onCreated(agent);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create agent');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-surface border border-border rounded-lg shadow-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[15px]">Add agent</h2>
          <button onClick={onClose} className="text-muted hover:text-text text-lg leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Field label="Full name">
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputCls}
              placeholder="e.g. Ahmed Raza Khan"
            />
          </Field>

          <Field label="CRM name">
            <input
              value={crmName}
              onChange={(e) => {
                setCrmTouched(true);
                setCrmName(e.target.value);
              }}
              className={`${inputCls} font-mono`}
              placeholder="auto-suggested"
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Team">
              <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className={inputCls}>
                <option value="">— No team —</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Base role">
              {isAdmin ? (
                <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
                  <option value="agent">Agent</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="admin">Admin</option>
                </select>
              ) : (
                <input disabled value="Agent" className={`${inputCls} opacity-60`} />
              )}
            </Field>
          </div>

          <Field label="Custom role (optional)">
            <select value={customRoleId} onChange={(e) => setCustomRoleId(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {availableRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Temporary password">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </Field>

          {error && <div className="text-[12.5px] text-danger">{error}</div>}

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg font-semibold text-[13px] text-muted hover:text-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-accent text-white px-3.5 py-2 rounded-lg font-semibold text-[13px]
                         hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {submitting ? 'Adding…' : 'Add agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 bg-surface-alt border border-transparent rounded-lg text-[13px] ' +
  'focus:outline-none focus:border-accent focus:bg-surface';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-muted mb-1">{label}</label>
      {children}
    </div>
  );
}
