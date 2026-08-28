const express = require('express');
const { getReportByDate, listReportDates, saveReport, updateOwnRow, getReportSummary, getDashboardData } = require('../controllers/dailyReportController');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

router.use(requireAuth);

router.get('/dates', listReportDates);
router.get('/summary', getReportSummary);
router.get('/dashboard', getDashboardData);
router.get('/', getReportByDate);
router.put('/', requirePermission('reports.edit_all'), saveReport);
router.patch('/:reportId/rows/:rowId', updateOwnRow);

module.exports = router;
