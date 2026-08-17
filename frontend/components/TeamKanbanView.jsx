'use client';

import AgentCard from './AgentCard';
import { agentMatchesFilters, colorForTeam } from '../lib/utils';

export default function TeamKanbanView({ teams, query, statusFilter, onSelectAgent, onAddAgent, onEditTeam, onBulkAddAgents }) {
  return (
    <div className="flex gap-4 items-start overflow-x-auto pb-2">
      {teams.map((team) => {
        const color = colorForTeam(team.id);
        const visibleAgents = team.agents.filter((a) => agentMatchesFilters(a, team.name, query, statusFilter));
        return (
          <div key={team.id} className="w-[300px] shrink-0 bg-surface border border-border rounded-lg shadow-card">
            <div className="p-3.5 pb-3 border-b border-border">
              <div className="flex items-center justify-between mb-1.5">
                <div className="font-bold text-[14px] tracking-tight">{team.name}</div>
                <div className="flex items-center gap-1.5">
                  <div className="font-mono text-[11px] text-muted bg-surface-alt px-1.5 py-0.5 rounded">
                    {visibleAgents.length}
                  </div>
                  {onEditTeam && (
                    <button
                      onClick={() => onEditTeam(team)}
                      title="Edit team"
                      className="text-muted hover:text-accent text-[13px] leading-none px-1"
                    >
                      ⋯
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                {team.team_lead ? `Lead: ${team.team_lead.fullName.split(' ')[0]}` : 'No lead assigned'}
              </div>
            </div>

            <div className="p-2.5 flex flex-col gap-2">
              {visibleAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  teamColor={color}
                  onClick={() => onSelectAgent(agent)}
                />
              ))}
              {visibleAgents.length === 0 && (
                <div className="text-center text-[12px] text-muted py-4">No agents match filters</div>
              )}
            </div>

            <div className="mx-2.5 mb-2.5 flex gap-2">
              <button
                onClick={() => onAddAgent(team.id)}
                className="flex-1 p-2 rounded-lg border border-dashed border-border text-muted
                                 text-[12.5px] font-semibold flex items-center justify-center gap-1.5
                                 hover:border-accent hover:text-accent transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                Add agent
              </button>
              {onBulkAddAgents && (
                <button
                  onClick={() => onBulkAddAgents(team.id)}
                  title="Bulk add agents"
                  className="p-2 rounded-lg border border-dashed border-border text-muted
                                   text-[12.5px] font-semibold flex items-center justify-center
                                   hover:border-accent hover:text-accent transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
