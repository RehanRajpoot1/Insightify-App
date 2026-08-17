'use client';

import { initials, statusMeta, agentMatchesFilters, colorForTeam, formatDate, roleLabel } from '../lib/utils';

export default function AgentTable({ teams, query, statusFilter, onSelectAgent }) {
  const rows = teams.flatMap((team) =>
    team.agents
      .filter((a) => agentMatchesFilters(a, team.name, query, statusFilter))
      .map((agent) => ({ agent, team }))
  );

  return (
    <table className="w-full border-collapse bg-surface border border-border rounded-lg overflow-hidden shadow-card">
      <thead>
        <tr>
          {['', 'Agent', 'CRM Name', 'Team', 'Role', 'Status', 'Joined', ''].map((h, i) => (
            <th
              key={i}
              className="text-left text-[11px] font-semibold text-muted uppercase tracking-wide px-3.5 py-2.5 bg-surface-alt border-b border-border"
            >
              {h === '' && i === 0 ? <input type="checkbox" /> : h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ agent, team }) => {
          const s = statusMeta(agent.status);
          const color = colorForTeam(team.id);
          return (
            <tr
              key={agent.id}
              onClick={() => onSelectAgent(agent)}
              className="hover:bg-surface-alt transition-colors cursor-pointer"
            >
              <td className="px-3.5 py-2.5 border-b border-border" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" />
              </td>
              <td className="px-3.5 py-2.5 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10.5px] text-white shrink-0"
                    style={{ background: color }}
                  >
                    {initials(agent.fullName)}
                  </div>
                  <span className="font-semibold text-[13px]">{agent.fullName}</span>
                </div>
              </td>
              <td className="px-3.5 py-2.5 border-b border-border">
                <span className="font-mono text-[11px] text-accent bg-accent-soft px-1.5 py-px rounded">
                  {agent.crmName}
                </span>
              </td>
              <td className="px-3.5 py-2.5 border-b border-border text-[13px]">{team.name}</td>
              <td className="px-3.5 py-2.5 border-b border-border">
                <span className="text-[11px] font-semibold bg-surface-alt text-muted px-2 py-0.5 rounded">
                  {roleLabel(agent.role)}
                </span>
              </td>
              <td className="px-3.5 py-2.5 border-b border-border">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1.5 ${s.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  {s.label}
                </span>
              </td>
              <td className="px-3.5 py-2.5 border-b border-border font-mono text-[12px] text-muted">
                {formatDate(agent.dateJoined)}
              </td>
              <td className="px-3.5 py-2.5 border-b border-border text-muted">⋯</td>
            </tr>
          );
        })}
        {rows.length === 0 && (
          <tr>
            <td colSpan={8} className="px-3.5 py-8 text-center text-[13px] text-muted">
              No agents match filters
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
