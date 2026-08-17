'use client';

import ThemeToggle from './ThemeToggle';

export default function Topbar({ campaign, query, onQueryChange, view, onViewChange, onAddAgent }) {
  return (
    <div className="flex items-center gap-3 px-6 py-3.5 border-b border-border bg-surface">
      <div className="hidden sm:block font-bold text-[16px] tracking-tight whitespace-nowrap mr-2">
        {campaign.name}{' '}
        <span className="font-mono text-muted text-xs font-medium">{campaign.tag}</span>
      </div>

      <div className="relative flex-1 max-w-[360px]">
        <svg
          width="14" height="14" viewBox="0 0 16 16" fill="none"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
        >
          <circle cx="7" cy="7" r="4.8" stroke="currentColor" strokeWidth="1.4" />
          <path d="M13.2 13.2L11 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search name, CRM tag, or team…"
          className="w-full pl-8 pr-2.5 py-2 bg-surface-alt border border-transparent rounded-lg text-[13px]
                     text-text placeholder:text-muted focus:outline-none focus:border-accent focus:bg-surface"
        />
      </div>

      <div className="flex-1" />

      <div className="flex bg-surface-alt rounded-lg p-0.5">
        {['kanban', 'table'].map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={`px-3 py-1.5 rounded-md text-[12.5px] font-semibold transition-all ${
              view === v ? 'bg-surface text-text shadow-card' : 'text-muted'
            }`}
          >
            {v === 'kanban' ? 'Board' : 'Table'}
          </button>
        ))}
      </div>

      <ThemeToggle />

      <button
        onClick={() => onAddAgent?.()}
        className="bg-accent text-white px-3.5 py-2 rounded-lg font-semibold text-[13px] flex items-center gap-1.5 hover:opacity-90 transition-opacity"
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M3 8h10" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        Add agent
      </button>
    </div>
  );
}
