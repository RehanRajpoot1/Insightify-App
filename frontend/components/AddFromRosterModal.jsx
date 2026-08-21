'use client';

import { useState } from 'react';
import { initials } from '../lib/utils';

export default function AddFromRosterModal({ agents, onClose, onConfirm }) {
  const [selected, setSelected] = useState(new Set());

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelected = agents.length > 0 && selected.size === agents.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(agents.map((a) => a.id)));
  }

  function handleConfirm() {
    const chosen = agents.filter((a) => selected.has(a.id));
    if (chosen.length === 0) return;
    onConfirm(chosen);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-surface border border-border rounded-lg shadow-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-[15px]">Add from team roster</h2>
          <button onClick={onClose} className="text-muted hover:text-text text-lg leading-none">
            ×
          </button>
        </div>

        {agents.length > 0 && (
          <label className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-surface-alt cursor-pointer border-b border-border mb-1">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            <span className="text-[13px] font-semibold text-muted">Select all</span>
          </label>
        )}

        <div className="max-h-72 overflow-y-auto flex flex-col gap-1 -mx-1 px-1">
          {agents.map((a) => (
            <label
              key={a.id}
              className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-surface-alt cursor-pointer"
            >
              <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggle(a.id)} />
              <div className="w-6 h-6 rounded-full bg-accent-soft text-accent flex items-center justify-center font-bold text-[10px] shrink-0">
                {initials(a.fullName)}
              </div>
              <span className="text-[13px] font-medium">{a.fullName}</span>
            </label>
          ))}
          {agents.length === 0 && (
            <div className="text-[12.5px] text-muted text-center py-6">
              This team has no registered agents yet.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3.5 py-2 rounded-lg font-semibold text-[13px] text-muted hover:text-text">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className="bg-accent text-white px-3.5 py-2 rounded-lg font-semibold text-[13px] hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            Add {selected.size || ''}
          </button>
        </div>
      </div>
    </div>
  );
}
