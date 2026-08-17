'use client';

import { useState } from 'react';
import { createTeam, ApiError } from '../lib/api';

export default function AddTeamModal({ campaignId, teamLeads, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [teamLeadId, setTeamLeadId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const team = await createTeam({ campaignId, name, teamLeadId: teamLeadId || undefined });
      onCreated(team);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create team');
    } finally {
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
          <h2 className="font-bold text-[15px]">Add team</h2>
          <button onClick={onClose} className="text-muted hover:text-text text-lg leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-[12px] font-semibold text-muted mb-1">Team name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-surface-alt border border-transparent rounded-lg text-[13px] focus:outline-none focus:border-accent focus:bg-surface"
              placeholder="e.g. Hamza's Team"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-muted mb-1">Team lead (optional)</label>
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
              className="bg-accent text-white px-3.5 py-2 rounded-lg font-semibold text-[13px] hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {submitting ? 'Adding…' : 'Add team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
