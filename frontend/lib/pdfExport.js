'use client';

// Conversion Rate color bands, matching the reference report style:
// >=4% green, 2-4% yellow, <2% red.
function crColor(cr) {
  if (cr >= 4) return [198, 239, 206];
  if (cr >= 2) return [255, 235, 156];
  return [255, 199, 206];
}

export async function exportDailyReportPdf({ teamName, date, rows }) {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Daily Report', 14, 18);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Team: ${teamName || '—'}`, 14, 26);
  doc.text(`Date: ${date}`, 14, 32);

  const body = rows.map((r) => {
    const leads = (Number(r.totalLeadsFintana) || 0) + (Number(r.totalLeadsSpova) || 0);
    const ftds = Number(r.totalFtds) || 0;
    const cr = leads > 0 ? (ftds / leads) * 100 : 0;
    return { name: r.agentName || '—', leads, ftds, cr };
  });

  const totalLeads = body.reduce((s, r) => s + r.leads, 0);
  const totalFtds = body.reduce((s, r) => s + r.ftds, 0);
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

  const safeTeam = (teamName || 'team').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  doc.save(`daily-report-${safeTeam}-${date}.pdf`);
}
