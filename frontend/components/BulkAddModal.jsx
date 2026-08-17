'use client';

import { useState } from 'react';

export default function BulkAddModal({ title, placeholder, onClose, onConfirm }) {
  const [text, setText] = useState('');

  const names = text
    .split(/[\n,]/)
    .map((n) => n.trim())
    .filter(Boolean);

  function handleConfirm() {
    if (names.length === 0) return;
    onConfirm(names);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-surface border border-border rounded-lg shadow-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-[15px]">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-text text-lg leading-none">
            ×
          </button>
        </div>

        <p className="text-[12.5px] text-muted mb-2">
          Ek line mein ek naam likhein (ya comma se separate karein).
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-surface-alt border border-transparent rounded-lg text-[13px]
                     focus:outline-none focus:border-accent focus:bg-surface resize-none"
        />

        <div className="flex items-center justify-between mt-3">
          <span className="text-[12px] text-muted">{names.length} name(s) detected</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg font-semibold text-[13px] text-muted hover:text-text"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={names.length === 0}
              className="bg-accent text-white px-3.5 py-2 rounded-lg font-semibold text-[13px]
                         hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              Add {names.length || ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
