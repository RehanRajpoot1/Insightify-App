'use client';

import { useEffect, useState } from 'react';
import { updateAgent, deactivateAgent, reassignAgent, fetchRoles, ApiError } from '../lib/api';

export default function AgentDetailModal({ agent, teams, onClose, onUpdated, onDeactivated }) {
  const [fullName, setFullName] = useState(agent.fullName);
  const [email, setEmail] = useState(agent.email);
  const [status, setStatus] = useState(agent.status);
  const [teamId, setTeamId] = useState(agent.teamId || '');
  const [customRoleId, setCustomRoleId] = useState(agent.customRoleId || '');
  const [availableRoles, setAvailableRoles] = useState([]);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false);

  useEffect(() => {
    fetchRoles()
      .then((data) => setAvailableRoles(data.roles))
      .catch(() => {});
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    if (newPassword && newPassword.length < 6) {
      return setError('New password must be at least 6 characters');
    }
    setSubmitting(true);
    try {
      let updated = await updateAgent(agent.id, {
        fullName,
        email,
        status,
        customRoleId: customRoleId || null,
        ...(newPassword ? { password: newPassword } : {}),
      });
      if (teamId !== (agent.teamId || '')) {
        updated = await reassignAgent(agent.id, teamId || null);
      }
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update agent');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate() {
    setSubmitting(true);
    setError('');
    try {
      const updated = await deactivateAgent(agent.id);
      onDeactivated(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to deactivate agent');
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
          <h2 className="font-bold text-[15px]">Edit agent</h2>
          <button onClick={onClose} className="text-muted hover:text-text text-lg leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <Field label="Full name">
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
          </Field>

          <Field label="CRM name">
            <input disabled value={agent.crmName} className={`${inputCls} font-mono opacity-60`} />
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
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                <option value="active">Active</option>
                <option value="leave">On leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>

          <Field label="Custom role">
            <select value={customRoleId} onChange={(e) => setCustomRoleId(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {availableRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Set new temporary password (optional)">
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              className={`${inputCls} font-mono`}
            />
          </Field>

          {error && <div className="text-[12.5px] text-danger">{error}</div>}

          <div className="flex items-center justify-between mt-2">
            {confirmingDeactivate ? (
              <div className="flex items-center gap-2">
                <span className="text-[12.5px] text-muted">Deactivate this agent?</span>
                <button
                  type="button"
                  onClick={handleDeactivate}
                  disabled={submitting}
                  className="text-[12.5px] font-semibold text-danger"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDeactivate(false)}
                  className="text-[12.5px] text-muted"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDeactivate(true)}
                className="text-[12.5px] font-semibold text-danger"
              >
                Deactivate agent
              </button>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="bg-accent text-white px-3.5 py-2 rounded-lg font-semibold text-[13px]
                         hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save changes'}
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
