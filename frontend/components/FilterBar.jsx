'use client';

const filters = [
  { key: 'all', label: 'All statuses' },
  { key: 'active', label: 'Active', dot: 'bg-success' },
  { key: 'leave', label: 'On leave', dot: 'bg-warning' },
  { key: 'inactive', label: 'Inactive', dot: 'bg-muted/50' },
];

export default function FilterBar({ statusFilter, onChange, count, teamCount }) {
  return (
    <div className="flex items-center gap-2 flex-wrap px-6 py-3 border-b border-border">
      {filters.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`px-3 py-1.5 rounded-full border text-[12.5px] font-medium flex items-center gap-1.5 transition-colors ${
            statusFilter === f.key
              ? 'bg-accent-soft border-accent text-accent'
              : 'border-border bg-surface text-muted hover:text-text hover:border-accent'
          }`}
        >
          {f.dot && <span className={`w-1.5 h-1.5 rounded-full ${f.dot}`} />}
          {f.label}
        </button>
      ))}
      <div className="ml-auto text-[12.5px] text-muted">
        {count} agent{count !== 1 ? 's' : ''} · {teamCount} teams
      </div>
    </div>
  );
}
