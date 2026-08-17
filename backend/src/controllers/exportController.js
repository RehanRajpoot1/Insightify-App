const XLSX = require('xlsx');
const prisma = require('../config/db');

/**
 * GET /api/agents/export?format=csv|xlsx&team_id=
 */
async function exportAgents(req, res) {
  const { format = 'csv', team_id } = req.query;

  const scopeTeamId = req.user.role === 'admin' ? team_id : req.user.teamId;

  const agents = await prisma.user.findMany({
    where: { teamId: scopeTeamId || undefined },
    include: { team: { select: { name: true } } },
    orderBy: { fullName: 'asc' },
  });

  const rows = agents.map((a) => ({
    'Full Name': a.fullName,
    'CRM Name': a.crmName,
    Team: a.team?.name || '',
    Role: a.role,
    Status: a.status,
    Email: a.email,
    Phone: a.phone || '',
    'Date Joined': a.dateJoined.toISOString().slice(0, 10),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Roster');

  if (format === 'xlsx') {
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="roster.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  }

  const csv = XLSX.utils.sheet_to_csv(worksheet);
  res.setHeader('Content-Disposition', 'attachment; filename="roster.csv"');
  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);
}

module.exports = { exportAgents };
