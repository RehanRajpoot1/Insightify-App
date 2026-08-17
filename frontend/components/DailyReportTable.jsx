'use client';

import { Fragment } from 'react';

const numCls =
  'w-12 text-center px-1 py-1.5 bg-surface border border-transparent rounded text-[12.5px] ' +
  'focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed';
const textCls =
  'w-full px-2 py-1.5 bg-surface border border-transparent rounded text-[12.5px] ' +
  'focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed';

function rowTotalFtds(row) {
  return (row.hours || []).reduce((sum, h) => sum + (Number(h?.ftds) || 0), 0);
}

// If `editableRowId` is set, every row EXCEPT that one is fully locked (agent view).
// If `editableRowId` is not set, everyone with write access can edit every row (admin/team_lead view).
export default function DailyReportTable({ hourCount, rows, onChangeRow, onRemoveRow, editableRowId }) {
  const hours = Array.from({ length: hourCount }, (_, i) => i);
  const restrictedMode = editableRowId !== undefined;

  const teamTotals = {
    hours: hours.map((h) =>
      rows.reduce(
        (acc, row) => ({
          ftds: acc.ftds + (Number(row.hours?.[h]?.ftds) || 0),
          freshLead: acc.freshLead + (Number(row.hours?.[h]?.freshLead) || 0),
        }),
        { ftds: 0, freshLead: 0 }
      )
    ),
    totalFtds: rows.reduce((sum, r) => sum + rowTotalFtds(r), 0),
    totalLeadsFintana: rows.reduce((sum, r) => sum + (Number(r.totalLeadsFintana) || 0), 0),
    totalLeadsSpova: rows.reduce((sum, r) => sum + (Number(r.totalLeadsSpova) || 0), 0),
  };

  function updateHourField(rowIdx, hourIdx, field, value) {
    const row = rows[rowIdx];
    const newHours = [...(row.hours || [])];
    newHours[hourIdx] = { ...newHours[hourIdx], [field]: value === '' ? 0 : Number(value) };
    onChangeRow(rowIdx, { ...row, hours: newHours });
  }

  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="border-collapse w-full min-w-max">
        <thead>
          <tr>
            <th rowSpan={2} className="sticky left-0 bg-surface-alt border-b border-r border-border px-3 py-2 text-left text-[11px] font-semibold text-muted uppercase">
              Agent Name
            </th>
            {hours.map((h) => (
              <th key={h} colSpan={2} className="bg-surface-alt border-b border-r border-border px-2 py-1.5 text-[11px] font-semibold text-muted uppercase text-center">
                Hour {h + 1}
              </th>
            ))}
            <th rowSpan={2} className="bg-accent-soft border-b border-r border-border px-2 py-2 text-[11px] font-semibold text-accent uppercase text-center">
              Total<br />FTDs
            </th>
            <th rowSpan={2} className="bg-surface-alt border-b border-r border-border px-2 py-2 text-[11px] font-semibold text-muted uppercase text-center">
              Leads on<br />Fintana
            </th>
            <th rowSpan={2} className="bg-surface-alt border-b border-r border-border px-2 py-2 text-[11px] font-semibold text-muted uppercase text-center">
              Leads on<br />Spova
            </th>
            <th rowSpan={2} className="bg-surface-alt border-b border-r border-border px-2 py-2 text-[11px] font-semibold text-muted uppercase text-left min-w-[160px]">
              Reason
            </th>
            <th rowSpan={2} className="bg-surface-alt border-b border-border px-2 py-2 text-[11px] font-semibold text-muted uppercase text-left min-w-[160px]">
              Campaign
            </th>
            {!restrictedMode && <th rowSpan={2} className="bg-surface-alt border-b border-border px-2 py-2 w-8"></th>}
          </tr>
          <tr>
            {hours.map((h) => (
              <Fragment key={h}>
                <th className="bg-surface-alt border-b border-border px-1.5 py-1 text-[10px] font-semibold text-muted text-center">
                  FTDs
                </th>
                <th className="bg-surface-alt border-b border-r border-border px-1.5 py-1 text-[10px] font-semibold text-muted text-center">
                  Lead
                </th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => {
            const rowLocked = restrictedMode && row.id !== editableRowId;
            const isMine = restrictedMode && row.id === editableRowId;
            return (
              <tr key={row.id} className={`hover:bg-surface-alt/50 ${isMine ? 'bg-accent-soft/20' : ''}`}>
                <td className="sticky left-0 bg-surface border-b border-r border-border px-2 py-1.5">
                  <input
                    value={row.agentName}
                    disabled={restrictedMode}
                    onChange={(e) => onChangeRow(rowIdx, { ...row, agentName: e.target.value })}
                    className={textCls}
                    placeholder="Agent name"
                  />
                </td>
                {hours.map((h) => (
                  <Fragment key={h}>
                    <td className="border-b border-border px-1 py-1.5 text-center">
                      <input
                        type="number"
                        min={0}
                        disabled={rowLocked}
                        value={row.hours?.[h]?.ftds ?? 0}
                        onChange={(e) => updateHourField(rowIdx, h, 'ftds', e.target.value)}
                        className={numCls}
                      />
                    </td>
                    <td className="border-b border-r border-border px-1 py-1.5 text-center">
                      <input
                        type="number"
                        min={0}
                        disabled={rowLocked}
                        value={row.hours?.[h]?.freshLead ?? 0}
                        onChange={(e) => updateHourField(rowIdx, h, 'freshLead', e.target.value)}
                        className={numCls}
                      />
                    </td>
                  </Fragment>
                ))}
                <td className="bg-accent-soft/40 border-b border-r border-border px-2 py-1.5 text-center font-mono font-semibold text-[13px] text-accent">
                  {rowTotalFtds(row)}
                </td>
                <td className="border-b border-r border-border px-1 py-1.5 text-center">
                  <input
                    type="number"
                    min={0}
                    disabled={rowLocked}
                    value={row.totalLeadsFintana ?? 0}
                    onChange={(e) => onChangeRow(rowIdx, { ...row, totalLeadsFintana: Number(e.target.value) || 0 })}
                    className={numCls}
                  />
                </td>
                <td className="border-b border-r border-border px-1 py-1.5 text-center">
                  <input
                    type="number"
                    min={0}
                    disabled={rowLocked}
                    value={row.totalLeadsSpova ?? 0}
                    onChange={(e) => onChangeRow(rowIdx, { ...row, totalLeadsSpova: Number(e.target.value) || 0 })}
                    className={numCls}
                  />
                </td>
                <td className="border-b border-r border-border px-1.5 py-1.5">
                  <input
                    value={row.reason}
                    disabled={rowLocked}
                    onChange={(e) => onChangeRow(rowIdx, { ...row, reason: e.target.value })}
                    className={textCls}
                    placeholder="—"
                  />
                </td>
                <td className="border-b border-border px-1.5 py-1.5">
                  <input
                    value={row.campaign}
                    disabled={rowLocked}
                    onChange={(e) => onChangeRow(rowIdx, { ...row, campaign: e.target.value })}
                    className={textCls}
                    placeholder="—"
                  />
                </td>
                {!restrictedMode && (
                  <td className="border-b border-border px-1 py-1.5 text-center">
                    <button
                      onClick={() => onRemoveRow(rowIdx)}
                      title="Remove row"
                      className="text-muted hover:text-danger text-[13px]"
                    >
                      ×
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={hourCount * 2 + (restrictedMode ? 6 : 7)} className="px-3 py-8 text-center text-[13px] text-muted">
                No agents yet.
              </td>
            </tr>
          )}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr className="bg-surface-alt">
              <td className="sticky left-0 bg-surface-alt border-t-2 border-border px-2 py-2 font-bold text-[12.5px]">
                TEAM TOTAL
              </td>
              {hours.map((h) => (
                <Fragment key={h}>
                  <td className="border-t-2 border-border px-1 py-2 text-center font-mono font-semibold text-[12.5px]">
                    {teamTotals.hours[h].ftds}
                  </td>
                  <td className="border-t-2 border-r border-border px-1 py-2 text-center font-mono font-semibold text-[12.5px]">
                    {teamTotals.hours[h].freshLead}
                  </td>
                </Fragment>
              ))}
              <td className="bg-accent-soft border-t-2 border-r border-border px-2 py-2 text-center font-mono font-bold text-[13px] text-accent">
                {teamTotals.totalFtds}
              </td>
              <td className="border-t-2 border-r border-border px-2 py-2 text-center font-mono font-semibold text-[12.5px]">
                {teamTotals.totalLeadsFintana}
              </td>
              <td className="border-t-2 border-r border-border px-2 py-2 text-center font-mono font-semibold text-[12.5px]">
                {teamTotals.totalLeadsSpova}
              </td>
              <td className="border-t-2 border-r border-border" colSpan={2}></td>
              {!restrictedMode && <td className="border-t-2 border-border"></td>}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
