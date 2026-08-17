'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import FilterBar from '../components/FilterBar';
import TeamKanbanView from '../components/TeamKanbanView';
import AgentTable from '../components/AgentTable';
import AddAgentModal from '../components/AddAgentModal';
import AgentDetailModal from '../components/AgentDetailModal';
import AddTeamModal from '../components/AddTeamModal';
import EditTeamModal from '../components/EditTeamModal';
import BulkAddAgentModal from '../components/BulkAddAgentModal';
import { useAuth } from '../lib/auth-context';
import { fetchCampaigns, fetchGroupedTeams, fetchAllAgents } from '../lib/api';
import { agentMatchesFilters } from '../lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [view, setView] = useState('kanban');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaignTag, setActiveCampaignTag] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [teams, setTeams] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');

  const [addAgentTeamId, setAddAgentTeamId] = useState(undefined); // undefined = closed
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [bulkAddTeamId, setBulkAddTeamId] = useState(null);

  // Guard the dashboard — bounce agents straight to their Daily Report,
  // and everyone else to /login if not authenticated.
  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace('/login');
    else if (user.role === 'agent') router.replace('/daily-report');
  }, [authLoading, user, router]);

  // Load the campaign list once logged in.
  useEffect(() => {
    if (!user || user.role === 'agent') return;
    fetchCampaigns()
      .then((list) => {
        setCampaigns(list);
        if (list.length > 0) setActiveCampaignTag((prev) => prev || list[0].tag);
      })
      .catch((err) => setError(err.message));
    if (user.role === 'admin') {
      fetchAllAgents()
        .then((all) => setTeamLeads(all.filter((a) => a.role === 'team_lead')))
        .catch(() => {});
    }
  }, [user]);

  const loadTeams = useCallback((tag) => {
    setDataLoading(true);
    setError('');
    fetchGroupedTeams(tag)
      .then((data) => {
        setCampaign(data.campaign);
        setTeams(data.teams);
      })
      .catch((err) => setError(err.message))
      .finally(() => setDataLoading(false));
  }, []);

  useEffect(() => {
    if (activeCampaignTag) loadTeams(activeCampaignTag);
  }, [activeCampaignTag, loadTeams]);

  const refresh = useCallback(() => {
    if (activeCampaignTag) loadTeams(activeCampaignTag);
  }, [activeCampaignTag, loadTeams]);

  const activeCampaignId = campaigns.find((c) => c.tag === activeCampaignTag)?.id;

  // Team leads only ever manage their own team, even though the campaign may have others.
  const visibleTeams = user?.role === 'team_lead' ? teams.filter((t) => t.id === user.teamId) : teams;

  const visibleCount = useMemo(
    () =>
      visibleTeams.reduce(
        (sum, team) =>
          sum + team.agents.filter((a) => agentMatchesFilters(a, team.name, query, statusFilter)).length,
        0
      ),
    [visibleTeams, query, statusFilter]
  );

  if (authLoading || !user || user.role === 'agent') {
    return <div className="min-h-screen flex items-center justify-center text-muted text-[13px]">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar campaigns={campaigns} activeCampaignTag={activeCampaignTag} onSelectCampaign={setActiveCampaignTag} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          campaign={campaign || { name: 'Loading…', tag: '' }}
          query={query}
          onQueryChange={setQuery}
          view={view}
          onViewChange={setView}
          onAddAgent={() => setAddAgentTeamId(null)}
        />
        <div className="flex items-center justify-between px-6 pt-3">
          <FilterBar
            statusFilter={statusFilter}
            onChange={setStatusFilter}
            count={visibleCount}
            teamCount={visibleTeams.length}
          />
          {user.role === 'admin' && (
            <button
              onClick={() => setShowAddTeam(true)}
              className="text-[12.5px] font-semibold text-accent hover:opacity-80 transition-opacity"
            >
              + Add team
            </button>
          )}
        </div>

        <div className="p-6 overflow-x-auto">
          {error && (
            <div className="mb-4 text-[13px] text-danger bg-surface-alt border border-danger rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {dataLoading ? (
            <div className="text-[13px] text-muted py-10 text-center">Loading teams…</div>
          ) : view === 'kanban' ? (
            <TeamKanbanView
              teams={visibleTeams}
              query={query}
              statusFilter={statusFilter}
              onSelectAgent={setSelectedAgent}
              onAddAgent={(teamId) => setAddAgentTeamId(teamId)}
              onEditTeam={(team) => setEditingTeam(team)}
              onBulkAddAgents={(teamId) => setBulkAddTeamId(teamId)}
            />
          ) : (
            <AgentTable teams={visibleTeams} query={query} statusFilter={statusFilter} onSelectAgent={setSelectedAgent} />
          )}
        </div>
      </div>

      {addAgentTeamId !== undefined && (
        <AddAgentModal
          teams={visibleTeams}
          defaultTeamId={addAgentTeamId}
          onClose={() => setAddAgentTeamId(undefined)}
          onCreated={() => {
            setAddAgentTeamId(undefined);
            refresh();
          }}
        />
      )}

      {selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          teams={visibleTeams}
          onClose={() => setSelectedAgent(null)}
          onUpdated={() => {
            setSelectedAgent(null);
            refresh();
          }}
          onDeactivated={() => {
            setSelectedAgent(null);
            refresh();
          }}
        />
      )}

      {showAddTeam && activeCampaignId && (
        <AddTeamModal
          campaignId={activeCampaignId}
          teamLeads={teamLeads}
          onClose={() => setShowAddTeam(false)}
          onCreated={() => {
            setShowAddTeam(false);
            refresh();
          }}
        />
      )}

      {editingTeam && (
        <EditTeamModal
          team={editingTeam}
          teamLeads={teamLeads}
          canDelete={user.role === 'admin'}
          onClose={() => setEditingTeam(null)}
          onUpdated={() => {
            setEditingTeam(null);
            refresh();
          }}
          onDeleted={() => {
            setEditingTeam(null);
            refresh();
          }}
        />
      )}

      {bulkAddTeamId && (
        <BulkAddAgentModal
          teamId={bulkAddTeamId}
          onClose={() => setBulkAddTeamId(null)}
          onDone={() => {
            setBulkAddTeamId(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
