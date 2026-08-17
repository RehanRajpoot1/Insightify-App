'use client';

import { initials, statusMeta } from '../lib/utils';

export default function AgentCard({ agent, teamColor, onClick }) {
  const s = statusMeta(agent.status);

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-surface cursor-pointer
                     hover:border-accent hover:-translate-y-0.5 transition-all"
    >
      <div
        className="w-[34px] h-[34px] rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0"
        style={{ background: teamColor }}
      >
        {initials(agent.fullName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-[13px] truncate">{agent.fullName}</div>
        <span className="font-mono text-[11px] text-accent bg-accent-soft inline-block px-1.5 py-px rounded mt-0.5">
          {agent.crmName}
        </span>
      </div>
      <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} title={s.label} />
    </div>
  );
}
