const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { effectivePermissions } = require('../utils/permissions');

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { customRole: { select: { id: true, name: true, scope: true, teamId: true, permissions: true } } },
  });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Account is not active' });
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  res.json({
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      crmName: user.crmName,
      email: user.email,
      role: user.role,
      teamId: user.teamId,
      customRole: user.customRole,
      permissions: effectivePermissions(user),
    },
  });
}

async function me(req, res) {
  res.json({ user: { ...req.user, permissions: effectivePermissions(req.user) } });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });

  res.json({ ok: true });
}

module.exports = { login, me, changePassword };
