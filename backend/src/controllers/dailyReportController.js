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
  const { date: rawDate, hourCount, rows, team_id } = req.body;
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
      update: { hourCount: hourCount || 8 },
      create: { date, teamId, hourCount: hourCount || 8 },
    });

    await tx.dailyReportRow.deleteMany({ where: { reportId: report.id } });

    if (rows.length > 0) {
      await tx.dailyReportRow.createMany({
        data: rows.map((row, idx) => ({
          reportId: report.id,
          agentId: row.agentId || null,
          agentName: row.agentName || '',
          hours: row.hours || [],
          totalLeadsFintana: Number(row.totalLeadsFintana) || 0,
          totalLeadsSpova: Number(row.totalLeadsSpova) || 0,
          reason: row.reason || '',
          campaign: row.campaign || '',
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
  const { hours, totalLeadsFintana, totalLeadsSpova, reason, campaign } = req.body;

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

  const updated = await prisma.dailyReportRow.update({
    where: { id: rowId },
    data: {
      hours: hours !== undefined ? hours : undefined,
      totalLeadsFintana: totalLeadsFintana !== undefined ? Number(totalLeadsFintana) || 0 : undefined,
      totalLeadsSpova: totalLeadsSpova !== undefined ? Number(totalLeadsSpova) || 0 : undefined,
      reason: reason !== undefined ? reason : undefined,
      campaign: campaign !== undefined ? campaign : undefined,
    },
  });

  res.json({ row: updated });
}

module.exports = { getReportByDate, listReportDates, saveReport, updateOwnRow };
