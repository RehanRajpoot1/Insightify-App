const prisma = require('../config/db');

// Built-in options that always exist, plus their display labels.
const BUILTIN = {
  call_target: [
    { value: 'on_target', label: 'On Target' },
    { value: 'underperforming', label: 'Underperforming' },
    { value: 'critical', label: 'Critical' },
  ],
  attendance: [
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
  ],
};

// GET /api/report-options?type=call_target|attendance
async function listOptions(req, res) {
  const { type } = req.query;
  if (!type || !BUILTIN[type]) return res.status(400).json({ error: 'Invalid type' });

  const custom = await prisma.reportOption.findMany({ where: { type }, orderBy: { createdAt: 'asc' } });
  const builtinValues = new Set(BUILTIN[type].map((o) => o.value));
  const customOptions = custom
    .filter((o) => !builtinValues.has(o.value))
    .map((o) => ({ value: o.value, label: o.value, custom: true }));

  res.json({ options: [...BUILTIN[type], ...customOptions] });
}

// POST /api/report-options — team leads (or admin) add a new dropdown value
async function addOption(req, res) {
  const { type, value } = req.body;
  if (!type || !BUILTIN[type]) return res.status(400).json({ error: 'Invalid type' });

  const trimmed = (value || '').trim();
  if (!trimmed) return res.status(400).json({ error: 'Value is required' });

  const alreadyBuiltin = BUILTIN[type].some((o) => o.label.toLowerCase() === trimmed.toLowerCase());
  if (alreadyBuiltin) return res.json({ ok: true });

  try {
    await prisma.reportOption.create({ data: { type, value: trimmed, createdById: req.user.id } });
  } catch (err) {
    if (err.code !== 'P2002') throw err; // ignore "already exists"
  }
  res.status(201).json({ ok: true });
}

module.exports = { listOptions, addOption };
