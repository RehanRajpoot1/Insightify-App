const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;

    if (!token) return res.status(401).json({ error: 'No token provided' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        fullName: true,
        crmName: true,
        role: true,
        teamId: true,
        status: true,
        customRoleId: true,
        customRole: { select: { id: true, name: true, scope: true, teamId: true, permissions: true } },
      },
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };
