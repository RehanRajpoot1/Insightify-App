const prisma = require('../config/db');

function toDateOnly(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// Resolves which team a request is allowed to act on.
// Admins may pass any team_id. Team leads and agents are always pinned to their own team.
function resolveTeamId(req, requestedTeamId) {
  if (req.user.role === 'admin') return requestedTeamId || null;
  return req.user.teamId || null;
}

// GET /api/daily-reports?date=YYYY-MM-DD&team_id=...
async function getReportByDate(req, res) {
  const date = toDateOnly(req.query.date);
  if (!date) return res.status(400).json({ error: 'Valid date query param required' });

  const teamId = resolveTeamId(req, req.query.team_id);
  if (!teamId) return res.status(400).json({ error: 'team_id is required' });
  if (req.user.role !== 'admin' && teamId !== req.user.teamId) {
    return res.status(403).json({ error: 'Forbidden — not your team' });
  }

  const report = await prisma.dailyReport.findUnique({
    where: { date_teamId: { date, teamId } },
    include: { rows: { orderBy: { position: 'asc' } } },
  });

  res.json({ report: report || null });
}

// GET /api/daily-reports/dates?team_id=...
async function listReportDates(req, res) {
  const teamId = resolveTeamId(req, req.query.team_id);
  if (!teamId) return res.status(400).json({ error: 'team_id is required' });
  if (req.user.role !== 'admin' && teamId !== req.user.teamId) {
    return res.status(403).json({ error: 'Forbidden — not your team' });
  }

  const reports = await prisma.dailyReport.findMany({
    where: { teamId },
    select: { date: true },
    orderBy: { date: 'desc' },
    take: 90,
  });
  res.json({ dates: reports.map((r) => r.date) });
}

// PUT /api/daily-reports — upsert the whole report (admin + team_lead only, own team)
async function saveReport(req, res) {
  const { date: rawDate, rows, team_id } = req.body;
  const date = toDateOnly(rawDate);
  if (!date) return res.status(400).json({ error: 'Valid date is required' });
  if (!Array.isArray(rows)) return res.status(400).json({ error: 'rows must be an array' });

  const teamId = resolveTeamId(req, team_id);
  if (!teamId) return res.status(400).json({ error: 'team_id is required' });
  if (req.user.role !== 'admin' && teamId !== req.user.teamId) {
    return res.status(403).json({ error: 'Forbidden — not your team' });
  }

  const result = await prisma.$transaction(async (tx) => {
    const report = await tx.dailyReport.upsert({
      where: { date_teamId: { date, teamId } },
      update: {},
      create: { date, teamId },
    });

    await tx.dailyReportRow.deleteMany({ where: { reportId: report.id } });

    if (rows.length > 0) {
      await tx.dailyReportRow.createMany({
        data: rows.map((row, idx) => ({
          reportId: report.id,
          agentId: row.agentId || null,
          agentName: row.agentName || '',
          totalFtds: Number(row.totalFtds) || 0,
          totalLeadsFintana: Number(row.totalLeadsFintana) || 0,
          totalLeadsSpova: Number(row.totalLeadsSpova) || 0,
          reason: row.reason || '',
          campaign: row.campaign || '',
          callTarget: ['on_target', 'underperforming', 'critical'].includes(row.callTarget)
            ? row.callTarget
            : 'on_target',
          attendance: ['present', 'absent'].includes(row.attendance) ? row.attendance : 'present',
          position: idx,
        })),
      });
    }

    return tx.dailyReport.findUnique({
      where: { id: report.id },
      include: { rows: { orderBy: { position: 'asc' } } },
    });
  });

  res.json({ report: result });
}

// PATCH /api/daily-reports/:reportId/rows/:rowId
// Lets an agent fill in only their own row. Admin/team_lead may also use this
// for a quick single-row edit (they already have full access via saveReport).
async function updateOwnRow(req, res) {
  const { reportId, rowId } = req.params;
  const { totalFtds, totalLeadsFintana, totalLeadsSpova, reason, campaign, callTarget, attendance } = req.body;

  const row = await prisma.dailyReportRow.findUnique({
    where: { id: rowId },
    include: { report: { include: { team: true } } },
  });
  if (!row || row.reportId !== reportId) return res.status(404).json({ error: 'Row not found' });

  const sameTeam = req.user.role === 'admin' || row.report.teamId === req.user.teamId;
  const isOwner = row.agentId === req.user.id;
  const isManager = req.user.role === 'admin' || req.user.role === 'team_lead';

  if (!sameTeam || !(isOwner || isManager)) {
    return res.status(403).json({ error: 'Forbidden — you can only edit your own row' });
  }

  const data = {
    totalFtds: totalFtds !== undefined ? Number(totalFtds) || 0 : undefined,
    totalLeadsFintana: totalLeadsFintana !== undefined ? Number(totalLeadsFintana) || 0 : undefined,
    totalLeadsSpova: totalLeadsSpova !== undefined ? Number(totalLeadsSpova) || 0 : undefined,
    reason: reason !== undefined ? reason : undefined,
    campaign: campaign !== undefined ? campaign : undefined,
  };
  if (callTarget !== undefined && ['on_target', 'underperforming', 'critical'].includes(callTarget)) {
    data.callTarget = callTarget;
  }
  if (attendance !== undefined && ['present', 'absent'].includes(attendance)) {
    data.attendance = attendance;
  }

  const updated = await prisma.dailyReportRow.update({ where: { id: rowId }, data });

  res.json({ row: updated });
}

// GET /api/daily-reports/summary?team_id=...&from=YYYY-MM-DD&to=YYYY-MM-DD
// Aggregates FTDs / Fintana / Spova per agent across a date range (kept separate, never merged).
async function getReportSummary(req, res) {
  const from = toDateOnly(req.query.from);
  const to = toDateOnly(req.query.to);
  if (!from || !to) return res.status(400).json({ error: 'Valid from and to dates are required' });

  const teamId = resolveTeamId(req, req.query.team_id);
  if (!teamId) return res.status(400).json({ error: 'team_id is required' });
  if (req.user.role !== 'admin' && teamId !== req.user.teamId) {
    return res.status(403).json({ error: 'Forbidden — not your team' });
  }

  const reports = await prisma.dailyReport.findMany({
    where: { teamId, date: { gte: from, lte: to } },
    include: { rows: true },
  });

  const byAgent = new Map();
  for (const report of reports) {
    for (const row of report.rows) {
      const key = row.agentId || `name:${row.agentName}`;
      if (!byAgent.has(key)) {
        byAgent.set(key, {
          agentId: row.agentId,
          agentName: row.agentName,
          totalFtds: 0,
          totalLeadsFintana: 0,
          totalLeadsSpova: 0,
        });
      }
      const entry = byAgent.get(key);
      entry.totalFtds += row.totalFtds;
      entry.totalLeadsFintana += row.totalLeadsFintana;
      entry.totalLeadsSpova += row.totalLeadsSpova;
      entry.agentName = row.agentName; // keep the most recent name
    }
  }

  const agents = [...byAgent.values()].sort((a, b) => a.agentName.localeCompare(b.agentName));
  const totals = agents.reduce(
    (acc, a) => ({
      totalFtds: acc.totalFtds + a.totalFtds,
      totalLeadsFintana: acc.totalLeadsFintana + a.totalLeadsFintana,
      totalLeadsSpova: acc.totalLeadsSpova + a.totalLeadsSpova,
    }),
    { totalFtds: 0, totalLeadsFintana: 0, totalLeadsSpova: 0 }
  );

  res.json({ agents, totals, reportCount: reports.length });
}

module.exports = { getReportByDate, listReportDates, saveReport, updateOwnRow, getReportSummary };
