const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { generateCrmName } = require('../utils/crmNameGenerator');

/**
 * POST /api/agents/bulk-import
 * Accepts a CSV/XLSX file (field name "file"), parses it, validates rows,
 * and returns a preview WITHOUT writing to the database.
 * Expected columns: Team | Full Name | CRM Name (CRM Name optional — auto-suggested if blank)
 */
async function previewImport(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const existingCrmNames = (await prisma.user.findMany({ select: { crmName: true } })).map((u) => u.crmName);
  const seenInBatch = [];

  const errors = [];
  const validRows = [];

  rows.forEach((row, i) => {
    const fullName = row['Full Name'] || row['full_name'];
    const team = row['Team'] || row['team'];
    let crmName = row['CRM Name'] || row['crm_name'];

    if (!fullName || !team) {
      errors.push({ row: i + 2, reason: 'Missing Full Name or Team' });
      return;
    }

    if (!crmName) {
      crmName = generateCrmName(fullName, [...existingCrmNames, ...seenInBatch]);
    }

    if (existingCrmNames.includes(crmName) || seenInBatch.includes(crmName)) {
      errors.push({ row: i + 2, reason: `CRM Name "${crmName}" already in use` });
      return;
    }

    seenInBatch.push(crmName);
    validRows.push({ team, fullName, crmName });
  });

  res.json({
    total: rows.length,
    validCount: validRows.length,
    errorCount: errors.length,
    errors,
    preview: validRows,
  });
}

/**
 * POST /api/agents/bulk-import/confirm
 * Commits a previously-previewed batch. Body: { campaignId, rows: [{team, fullName, crmName}] }
 * Auto-creates any team under the given campaign that doesn't already exist.
 */
async function confirmImport(req, res) {
  const { campaignId, rows, fileName } = req.body;
  if (!campaignId || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'campaignId and rows are required' });
  }

  let success = 0;
  const errorLog = [];

  const result = await prisma.$transaction(async (tx) => {
    const teamCache = {};

    for (const row of rows) {
      try {
        let team = teamCache[row.team];
        if (!team) {
          team = await tx.team.upsert({
            where: { campaignId_name: { campaignId, name: row.team } },
            update: {},
            create: { campaignId, name: row.team },
          });
          teamCache[row.team] = team;
        }

        const tempPassword = Math.random().toString(36).slice(-10);
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        await tx.user.create({
          data: {
            fullName: row.fullName,
            crmName: row.crmName,
            email: `${row.crmName}@placeholder.local`, // should be replaced/edited post-import
            role: 'agent',
            teamId: team.id,
            passwordHash,
          },
        });

        success += 1;
      } catch (err) {
        errorLog.push({ row: row.fullName, reason: err.message });
      }
    }

    return { success, errorLog };
  });

  await prisma.importBatch.create({
    data: {
      uploadedById: req.user.id,
      fileName: fileName || null,
      totalRows: rows.length,
      successRows: result.success,
      failedRows: result.errorLog.length,
      errorLog: result.errorLog,
    },
  });

  res.json({ imported: result.success, failed: result.errorLog.length, errors: result.errorLog });
}

module.exports = { previewImport, confirmImport };
