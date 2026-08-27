'use client';

const numCls =
  'w-16 text-center px-1 py-1.5 bg-surface border border-transparent rounded text-[12.5px] ' +
  'focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed';
const textCls =
  'w-full px-2 py-1.5 bg-surface border border-transparent rounded text-[12.5px] ' +
  'focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed';
const selectCls =
  'text-[11.5px] font-semibold px-2 py-1 rounded-md border-none focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer';

const ADD_NEW = '__add_new__';

function totalLeads(row) {
  return (Number(row.totalLeadsFintana) || 0) + (Number(row.totalLeadsSpova) || 0);
}

// Known built-in values get a meaningful color; anything a team lead has typed
// in fresh gets a neutral accent color since we don't know its intended meaning.
function targetColorCls(value) {
  if (value === 'on_target') return 'bg-success-soft text-success';
  if (value === 'underperforming') return 'bg-warning-soft text-warning';
  if (value === 'critical') return 'bg-danger text-white';
  return 'bg-accent-soft text-accent';
}
function attendanceColorCls(value) {
  if (value === 'present') return 'bg-success-soft text-success';
  if (value === 'absent') return 'bg-danger text-white';
  return 'bg-accent-soft text-accent';
}

// If `editableRowId` is set, every row EXCEPT that one is fully locked (agent view).
// If not set, everyone with write access can edit every row (admin/team_lead view).
export default function DailyReportTable({
  rows,
  onChangeRow,
  onRemoveRow,
  editableRowId,
  callTargetOptions = [],
  attendanceOptions = [],
  onAddOption, // async (type) => newValue | null — only called for admin/team_lead
}) {
  const restrictedMode = editableRowId !== undefined;

  const teamTotals = {
    totalFtds: rows.reduce((sum, r) => sum + (Number(r.totalFtds) || 0), 0),
    totalLeadsFintana: rows.reduce((sum, r) => sum + (Number(r.totalLeadsFintana) || 0), 0),
    totalLeadsSpova: rows.reduce((sum, r) => sum + (Number(r.totalLeadsSpova) || 0), 0),
    totalLeads: rows.reduce((sum, r) => sum + totalLeads(r), 0),
  };

  async function handleSelectChange(rowIdx, row, field, type, value) {
    if (value === ADD_NEW) {
      const newValue = await onAddOption?.(type);
      if (newValue) onChangeRow(rowIdx, { ...row, [field]: newValue });
      return;
    }
    onChangeRow(rowIdx, { ...row, [field]: value });
  }

  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="border-collapse w-full min-w-max">
        <thead>
          <tr>
            <th className="sticky left-0 bg-surface-alt border-b border-r border-border px-3 py-2 text-left text-[11px] font-semibold text-muted uppercase">
              Agent Name
            </th>
            <th className="bg-surface-alt border-b border-r border-border px-2 py-2 text-[11px] font-semibold text-muted uppercase text-center">
              Total FTDs
            </th>
            <th className="bg-surface-alt border-b border-r border-border px-2 py-2 text-[11px] font-semibold text-muted uppercase text-center">
              Leads on Fintana
            </th>
            <th className="bg-surface-alt border-b border-r border-border px-2 py-2 text-[11px] font-semibold text-muted uppercase text-center">
              Leads on Spova
            </th>
            <th className="bg-accent-soft border-b border-r border-border px-2 py-2 text-[11px] font-semibold text-accent uppercase text-center">
              Total Leads
            </th>
            <th className="bg-surface-alt border-b border-r border-border px-2 py-2 text-[11px] font-semibold text-muted uppercase text-left min-w-[260px]">
              Reason
            </th>
            <th className="bg-surface-alt border-b border-r border-border px-2 py-2 text-[11px] font-semibold text-muted uppercase text-left min-w-[160px]">
              Campaign
            </th>
            <th className="bg-surface-alt border-b border-r border-border px-2 py-2 text-[11px] font-semibold text-muted uppercase text-center">
              Call Target
            </th>
            <th className="bg-surface-alt border-b border-border px-2 py-2 text-[11px] font-semibold text-muted uppercase text-center">
              Attendance
            </th>
            {!restrictedMode && <th className="bg-surface-alt border-b border-border px-2 py-2 w-8"></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => {
            const rowLocked = restrictedMode && row.id !== editableRowId;
            const isMine = restrictedMode && row.id === editableRowId;
            const target = row.callTarget || 'on_target';
            const attendance = row.attendance || 'present';
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
                <td className="border-b border-r border-border px-1 py-1.5 text-center">
                  <input
                    type="number"
                    min={0}
                    disabled={rowLocked}
                    value={row.totalFtds ?? 0}
                    onChange={(e) => onChangeRow(rowIdx, { ...row, totalFtds: Number(e.target.value) || 0 })}
                    className={numCls}
                  />
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
                <td className="bg-accent-soft/40 border-b border-r border-border px-2 py-1.5 text-center font-mono font-semibold text-[13px] text-accent">
                  {totalLeads(row)}
                </td>
                <td className="border-b border-r border-border px-1.5 py-1.5">
                  <textarea
                    value={row.reason}
                    disabled={rowLocked}
                    onChange={(e) => onChangeRow(rowIdx, { ...row, reason: e.target.value })}
                    className={`${textCls} resize-none`}
                    rows={2}
                    placeholder="—"
                  />
                </td>
                <td className="border-b border-r border-border px-1.5 py-1.5">
                  <input
                    value={row.campaign}
                    disabled={rowLocked}
                    onChange={(e) => onChangeRow(rowIdx, { ...row, campaign: e.target.value })}
                    className={textCls}
                    placeholder="—"
                  />
                </td>
                <td className="border-b border-r border-border px-1.5 py-1.5 text-center">
                  <select
                    value={target}
                    disabled={rowLocked}
                    onChange={(e) => handleSelectChange(rowIdx, row, 'callTarget', 'call_target', e.target.value)}
                    className={`${selectCls} ${targetColorCls(target)}`}
                  >
                    {!callTargetOptions.some((o) => o.value === target) && (
                      <option value={target}>{target}</option>
                    )}
                    {callTargetOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                    {!restrictedMode && <option value={ADD_NEW}>+ Add new…</option>}
                  </select>
                </td>
                <td className="border-b border-border px-1.5 py-1.5 text-center">
                  <select
                    value={attendance}
                    disabled={rowLocked}
                    onChange={(e) => handleSelectChange(rowIdx, row, 'attendance', 'attendance', e.target.value)}
                    className={`${selectCls} ${attendanceColorCls(attendance)}`}
                  >
                    {!attendanceOptions.some((o) => o.value === attendance) && (
                      <option value={attendance}>{attendance}</option>
                    )}
                    {attendanceOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                    {!restrictedMode && <option value={ADD_NEW}>+ Add new…</option>}
                  </select>
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
              <td colSpan={restrictedMode ? 9 : 10} className="px-3 py-8 text-center text-[13px] text-muted">
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
              <td className="border-t-2 border-r border-border px-1 py-2 text-center font-mono font-semibold text-[12.5px]">
                {teamTotals.totalFtds}
              </td>
              <td className="border-t-2 border-r border-border px-1 py-2 text-center font-mono font-semibold text-[12.5px]">
                {teamTotals.totalLeadsFintana}
              </td>
              <td className="border-t-2 border-r border-border px-1 py-2 text-center font-mono font-semibold text-[12.5px]">
                {teamTotals.totalLeadsSpova}
              </td>
              <td className="bg-accent-soft border-t-2 border-r border-border px-2 py-2 text-center font-mono font-bold text-[13px] text-accent">
                {teamTotals.totalLeads}
              </td>
              <td className="border-t-2 border-r border-border" colSpan={2}></td>
              <td className="border-t-2 border-r border-border" colSpan={2}></td>
              {!restrictedMode && <td className="border-t-2 border-border"></td>}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
