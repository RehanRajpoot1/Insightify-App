'use client';

import { useState } from 'react';
import { updateTeamRecord, deleteTeamRecord, ApiError } from '../lib/api';

export default function EditTeamModal({ team, teamLeads, canDelete, onClose, onUpdated, onDeleted }) {
  const [name, setName] = useState(team.name);
  const [teamLeadId, setTeamLeadId] = useState(team.team_lead?.id || team.teamLead?.id || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const updated = await updateTeamRecord(team.id, { name, teamLeadId: teamLeadId || null });
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update team');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    setError('');
    try {
      await deleteTeamRecord(team.id);
      onDeleted(team.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete team');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-surface border border-border rounded-lg shadow-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[15px]">Edit team</h2>
          <button onClick={onClose} className="text-muted hover:text-text text-lg leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <div>
            <label className="block text-[12px] font-semibold text-muted mb-1">Team name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-surface-alt border border-transparent rounded-lg text-[13px] focus:outline-none focus:border-accent focus:bg-surface"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-muted mb-1">Team lead</label>
            <select
              value={teamLeadId}
              onChange={(e) => setTeamLeadId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-alt border border-transparent rounded-lg text-[13px] focus:outline-none focus:border-accent focus:bg-surface"
            >
              <option value="">— None —</option>
              {teamLeads.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="text-[12.5px] text-danger">{error}</div>}

          <div className="flex items-center justify-between mt-2">
            {canDelete ? (
              confirmingDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] text-muted">Delete team?</span>
                  <button type="button" onClick={handleDelete} disabled={submitting} className="text-[12.5px] font-semibold text-danger">
                    Confirm
                  </button>
                  <button type="button" onClick={() => setConfirmingDelete(false)} className="text-[12.5px] text-muted">
                    Cancel
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmingDelete(true)} className="text-[12.5px] font-semibold text-danger">
                  Delete team
                </button>
              )
            ) : (
              <span />
            )}

            <button
              type="submit"
              disabled={submitting}
              className="bg-accent text-white px-3.5 py-2 rounded-lg font-semibold text-[13px] hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
