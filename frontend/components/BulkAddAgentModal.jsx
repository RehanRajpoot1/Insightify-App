'use client';

import { useState } from 'react';
import { createAgent, suggestCrmName } from '../lib/api';

function emailSlug(name) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join('.');
  return base || 'agent';
}

export default function BulkAddAgentModal({ teamId, onClose, onDone }) {
  const [text, setText] = useState('');
  const [password, setPassword] = useState('changeme123');
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState([]);

  const names = text
    .split(/[\n,]/)
    .map((n) => n.trim())
    .filter(Boolean);

  async function handleSubmit() {
    if (names.length === 0 || password.length < 6) return;
    setSubmitting(true);
    const out = [];
    for (const name of names) {
      const email = `${emailSlug(name)}.${Math.random().toString(36).slice(2, 6)}@insightify.local`;
      try {
        const crmName = await suggestCrmName(name).catch(() => undefined);
        await createAgent({
          fullName: name,
          crmName,
          email,
          teamId,
          role: 'agent',
          password,
        });
        out.push({ name, status: 'ok', email });
      } catch (err) {
        out.push({ name, status: 'error', message: err.message });
      }
      setResults([...out]);
    }
    setSubmitting(false);
  }

  const finished = results.length === names.length && names.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-surface border border-border rounded-lg shadow-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-[15px]">Bulk add agents</h2>
          <button onClick={onClose} className="text-muted hover:text-text text-lg leading-none">
            ×
          </button>
        </div>

        {results.length === 0 ? (
          <>
            <p className="text-[12.5px] text-muted mb-2">
              Ek line mein ek naam likhein — har naam ke liye login account ban jayega.
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={7}
              placeholder={'Ahmed Raza\nSara Khan\nBilal Ahmed'}
              className="w-full px-3 py-2 bg-surface-alt border border-transparent rounded-lg text-[13px]
                         focus:outline-none focus:border-accent focus:bg-surface resize-none"
            />
            <p className="text-[11.5px] text-muted mt-2 mb-1">
              Sab agents ke liye same temporary password set hoga — baad mein har agent ke Edit page se badla ja
              sakta hai.
            </p>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              placeholder="Temporary password (min 6 chars)"
              className="w-full px-3 py-2 bg-surface-alt border border-transparent rounded-lg text-[13px] font-mono
                         focus:outline-none focus:border-accent focus:bg-surface"
            />
            {password.length > 0 && password.length < 6 && (
              <p className="text-[11.5px] text-danger mt-1">Password kam az kam 6 characters ka hona chahiye.</p>
            )}

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
                  onClick={handleSubmit}
                  disabled={names.length === 0 || password.length < 6 || submitting}
                  className="bg-accent text-white px-3.5 py-2 rounded-lg font-semibold text-[13px]
                             hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {submitting ? 'Adding…' : `Add ${names.length || ''}`}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="max-h-64 overflow-y-auto flex flex-col gap-1.5">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-[12.5px] px-2 py-1.5 rounded-md bg-surface-alt">
                  <span className="font-medium">{r.name}</span>
                  {r.status === 'ok' ? (
                    <span className="text-success font-semibold">Added ✓</span>
                  ) : (
                    <span className="text-danger font-semibold" title={r.message}>
                      Failed
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => (finished ? onDone() : null)}
                disabled={!finished}
                className="bg-accent text-white px-3.5 py-2 rounded-lg font-semibold text-[13px]
                           hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {finished ? 'Done' : 'Adding…'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
