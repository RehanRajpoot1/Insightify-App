'use client';

// Conversion Rate color bands: >=4% green, 2-4% yellow, <2% red.
function crColor(cr) {
  if (cr >= 4) return [198, 239, 206];
  if (cr >= 2) return [255, 235, 156];
  return [255, 199, 206];
}

const TARGET_COLOR = {
  on_target: [198, 239, 206],
  underperforming: [255, 235, 156],
  critical: [255, 199, 206],
};
const TARGET_LABEL = { on_target: 'On Target', underperforming: 'Underperforming', critical: 'Critical' };
const ATTENDANCE_COLOR = { present: [198, 239, 206], absent: [255, 199, 206] };
const ATTENDANCE_LABEL = { present: 'Present', absent: 'Absent' };

function safeName(name) {
  return (name || 'team').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

// Full Daily Report export — mirrors the on-screen table exactly (per-agent, single day).
export async function exportDailyReportFullPdf({ teamName, date, rows }) {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Daily Report', 14, 16);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Team: ${teamName || '—'}    Date: ${date}`, 14, 23);

  const body = rows.map((r) => {
    const leads = (Number(r.totalLeadsFintana) || 0) + (Number(r.totalLeadsSpova) || 0);
    return {
      name: r.agentName || '—',
      ftds: Number(r.totalFtds) || 0,
      fintana: Number(r.totalLeadsFintana) || 0,
      spova: Number(r.totalLeadsSpova) || 0,
      leads,
      reason: r.reason || '—',
      campaign: r.campaign || '—',
      target: r.callTarget || 'on_target',
      attendance: r.attendance || 'present',
    };
  });

  const totals = body.reduce(
    (acc, r) => ({
      ftds: acc.ftds + r.ftds,
      fintana: acc.fintana + r.fintana,
      spova: acc.spova + r.spova,
      leads: acc.leads + r.leads,
    }),
    { ftds: 0, fintana: 0, spova: 0, leads: 0 }
  );

  doc.autoTable({
    startY: 28,
    head: [['Agent', 'FTDs', 'Fintana', 'Spova', 'Total Leads', 'Reason', 'Campaign', 'Target', 'Attendance']],
    body: body.map((r) => [
      r.name,
      r.ftds,
      r.fintana,
      r.spova,
      r.leads,
      r.reason,
      r.campaign,
      TARGET_LABEL[r.target] || r.target,
      ATTENDANCE_LABEL[r.attendance] || r.attendance,
    ]),
    foot: [['TOTAL', totals.ftds, totals.fintana, totals.spova, totals.leads, '', '', '', '']],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak', valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 12, halign: 'center' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 95 }, // Reason — wide, per request
      6: { cellWidth: 48 },
      7: { cellWidth: 22 },
      8: { cellWidth: 20 },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        if (data.column.index === 7) {
          data.cell.styles.fillColor = TARGET_COLOR[body[data.row.index].target] || [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [30, 30, 30];
        }
        if (data.column.index === 8) {
          data.cell.styles.fillColor = ATTENDANCE_COLOR[body[data.row.index].attendance] || [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [30, 30, 30];
        }
      }
    },
  });

  doc.save(`daily-report-${safeName(teamName)}-${date}.pdf`);
}

// Performance summary export (date range) — Agent / Leads / FTDs / CR, color-coded CR.
export async function exportPerformanceSummaryPdf({ teamName, from, to, agents, totals }) {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Performance Summary', 14, 18);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Team: ${teamName || '—'}`, 14, 26);
  doc.text(`Range: ${from} to ${to}`, 14, 32);

  const body = agents.map((a) => {
    const leads = (Number(a.totalLeadsFintana) || 0) + (Number(a.totalLeadsSpova) || 0);
    const ftds = Number(a.totalFtds) || 0;
    const cr = leads > 0 ? (ftds / leads) * 100 : 0;
    return { name: a.agentName, leads, ftds, cr };
  });

  const totalLeads = (Number(totals.totalLeadsFintana) || 0) + (Number(totals.totalLeadsSpova) || 0);
  const totalFtds = Number(totals.totalFtds) || 0;
  const totalCr = totalLeads > 0 ? (totalFtds / totalLeads) * 100 : 0;

  doc.autoTable({
    startY: 38,
    head: [['Agent', 'Leads', 'FTDs', 'CR']],
    body: body.map((r) => [r.name, r.leads, r.ftds, `${r.cr.toFixed(2)}%`]),
    foot: [['TOTAL', totalLeads, totalFtds, `${totalCr.toFixed(2)}%`]],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        data.cell.styles.fillColor = crColor(body[data.row.index].cr);
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [30, 30, 30];
      }
    },
  });

  doc.save(`performance-${safeName(teamName)}-${from}-to-${to}.pdf`);
}
