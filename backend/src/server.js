require('dotenv').config();
const express = require('express');
require('express-async-errors'); // must load before routes — makes thrown/rejected errors in async handlers reach the error middleware
const cors = require('cors');

const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaigns');
const teamRoutes = require('./routes/teams');
const agentRoutes = require('./routes/agents');
const dailyReportRoutes = require('./routes/dailyReports');
const roleRoutes = require('./routes/roles');
const reportOptionRoutes = require('./routes/reportOptions');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/daily-reports', dailyReportRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/report-options', reportOptionRoutes);

// Central error handler — catches anything thrown/rejected in controllers
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Roster backend running on http://localhost:${PORT}`));
