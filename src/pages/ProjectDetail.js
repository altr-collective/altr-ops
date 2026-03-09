import { useState } from 'react';
import { C, F, fmtINR, fmtHrs, fmtDate, fmtDateLong, calcDueDate } from '../lib/utils';
import { Cap, Card, Divider, Badge, Btn, Empty, Avatar, StatBox, FilterBar, PageShell, Modal, Sel, Inp, Row } from '../components/UI';
import { ConfirmModal } from '../components/ConfirmModal';
import { InvoiceRender } from './TimeLogInvoice';
import { WORK_TYPES, getWorkType, isBillableWorkType } from '../lib/workTypes';

export default function ProjectDetail({ projectId, projects, clients, team, logs, invoices, onNav, onMarkInvoice, onDeleteInvoice, isAdmin }) {
  const [logFilter,    setLogFilter]    = useState('all');   // all | billable | non-billable | unbilled
  const [previewInv,   setPreviewInv]   = useState(null);
  const [confirmInv,   setConfirmInv]   = useState(null);

  const project = projects.find(p => p.id === projectId);
  if (!project) return (
    <PageShell title="Project" onBack={() => onNav('projects')}>
      <Empty icon="◇" text="Project not found" />
    </PageShell>
  );

  const client    = clients.find(c => c.id === project.client_id);
  const projLogs  = logs.filter(l => l.project_id === projectId);
  const projInvs  = invoices.filter(i => i.project_id === projectId);

  const totalH      = projLogs.reduce((s, l) => s + (l.hours || 0), 0);
  const billedH     = projLogs.filter(l => l.billed).reduce((s, l) => s + (l.hours || 0), 0);
  const billableH   = projLogs.filter(l => isBillableWorkType(l.work_type)).reduce((s, l) => s + (l.hours || 0), 0);
  const unbilledBillableH = projLogs.filter(l => !l.billed && isBillableWorkType(l.work_type)).reduce((s, l) => s + (l.hours || 0), 0);
  const internalH   = totalH - billableH;
  const totalInvoiced = projInvs.reduce((s, i) => s + (i.total || 0), 0);

  // Filtered log entries
  const filteredLogs = projLogs.filter(l => {
    if (logFilter === 'billable')     return isBillableWorkType(l.work_type);
    if (logFilter === 'non-billable') return !isBillableWorkType(l.work_type);
    if (logFilter === 'unbilled')     return !l.billed && isBillableWorkType(l.work_type);
    return true;
  }).sort((a, b) => b.date?.localeCompare(a.date));

  // Work type breakdown
  const byType = WORK_TYPES.map(wt => ({
    ...wt,
    hours: projLogs.filter(l => (l.work_type || 'client_design') === wt.id).reduce((s, l) => s + (l.hours || 0), 0)
  })).filter(wt => wt.hours > 0);

  return (
    <PageShell title={project.name} onBack={() => onNav('projects')}
      action={isAdmin && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" onClick={() => onNav('timelog', { projectId })}>+ Log Time</Btn>
          <Btn onClick={() => onNav('invoice', { projectId })}>+ Invoice</Btn>
        </div>
      )}>

      {/* Project meta */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: F.con, fontSize: 11, color: C.label, letterSpacing: 1 }}>{client?.name || '—'}</div>
        <Badge status={project.type} />
        <Badge status={project.status} />
        {project.description && <div style={{ fontFamily: F.body, fontSize: 11, color: C.muted }}>{project.description}</div>}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 1, background: C.border, borderRadius: 8, overflow: 'hidden', marginBottom: 28 }}>
        {[
          { label: 'Total Hours',       value: fmtHrs(totalH),            color: C.cream },
          { label: 'Billable Hours',    value: fmtHrs(billableH),         color: C.blue },
          { label: 'Internal Hours',    value: fmtHrs(internalH),         color: C.label },
          { label: 'Unbilled (Billable)',value: fmtHrs(unbilledBillableH), color: unbilledBillableH > 0 ? C.orange : C.green },
          { label: 'Total Invoiced',    value: fmtINR(totalInvoiced),     color: C.cream },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, padding: '16px 18px' }}>
            <Cap style={{ marginBottom: 5 }}>{s.label}</Cap>
            <div style={{ fontFamily: F.con, fontWeight: 800, fontSize: 18, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Hours estimate progress */}
      {project.estimated_hours > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Cap style={{ marginBottom: 0 }}>Hours burned vs estimate</Cap>
            <span style={{ fontFamily: F.con, fontSize: 12, fontWeight: 700, color: totalH / project.estimated_hours >= 1 ? C.red : totalH / project.estimated_hours >= .8 ? C.orange : C.green }}>
              {Math.round((totalH / project.estimated_hours) * 100)}%
            </span>
          </div>
          <div style={{ height: 10, background: C.border, borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, (totalH / project.estimated_hours) * 100)}%`, background: totalH / project.estimated_hours >= 1 ? C.red : totalH / project.estimated_hours >= .8 ? C.orange : C.green, borderRadius: 5, transition: 'width .4s' }} />
          </div>
          <div style={{ fontFamily: F.con, fontSize: 9, color: C.muted, marginTop: 5 }}>{fmtHrs(totalH)} of {fmtHrs(project.estimated_hours)} estimated</div>
        </Card>
      )}

      {/* Work type breakdown */}
      {byType.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <Cap style={{ marginBottom: 14 }}>Work Type Breakdown</Cap>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {byType.map(wt => (
              <div key={wt.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: wt.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.con, fontSize: 10, color: C.text, letterSpacing: 1 }}>{wt.short}</div>
                  <div style={{ fontFamily: F.con, fontSize: 8, color: C.muted }}>
                    {wt.billable ? 'Billable' : 'Non-billable'}
                  </div>
                </div>
                <div style={{ fontFamily: F.con, fontWeight: 700, fontSize: 12, color: C.cream }}>{fmtHrs(wt.hours)}</div>
              </div>
            ))}
          </div>
          {/* Stacked bar */}
          <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 1, marginTop: 14 }}>
            {byType.map(wt => (
              <div key={wt.id} title={`${wt.short}: ${fmtHrs(wt.hours)}`}
                style={{ flex: wt.hours, background: wt.color, minWidth: 3 }} />
            ))}
          </div>
        </Card>
      )}

      {/* Two columns: time log + invoices */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

        {/* Time Entries */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <Cap style={{ marginBottom: 0 }}>Time Entries ({projLogs.length})</Cap>
            <div style={{ display: 'flex', gap: 3 }}>
              {['all','billable','non-billable','unbilled'].map(f => (
                <button key={f} onClick={() => setLogFilter(f)}
                  style={{ background: logFilter===f ? C.cream : 'transparent', border: `1px solid ${logFilter===f ? C.cream : C.border2}`, borderRadius: 3, padding: '3px 8px', fontFamily: F.con, fontSize: 7, letterSpacing: 2, textTransform: 'uppercase', color: logFilter===f ? C.bg : C.muted, cursor: 'pointer' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredLogs.length === 0
            ? <Empty icon="◷" text="No entries" />
            : filteredLogs.map(log => {
                const member = team.find(m => m.id === log.member_id);
                const wt = getWorkType(log.work_type);
                return (
                  <div key={log.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, marginBottom: 5 }}>
                    <Avatar name={member?.name || '?'} size={28} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F.con, fontWeight: 700, fontSize: 11, color: C.cream, letterSpacing: 1 }}>{member?.name || 'Unknown'}</div>
                      <div style={{ fontFamily: F.con, fontSize: 8, color: C.muted, marginTop: 1 }}>
                        {fmtDate(log.date)}{log.notes ? ` · ${log.notes}` : ''}
                      </div>
                    </div>
                    <span style={{ fontFamily: F.con, fontSize: 7, letterSpacing: 1, padding: '2px 6px', borderRadius: 3, background: wt.color + '22', color: wt.color, border: `1px solid ${wt.color}44`, whiteSpace: 'nowrap' }}>{wt.short}</span>
                    <div style={{ fontFamily: F.con, fontWeight: 800, fontSize: 13, color: C.cream, whiteSpace: 'nowrap' }}>{log.hours}h</div>
                    <Badge status={log.billed ? 'billed' : isBillableWorkType(log.work_type) ? 'unpaid' : 'archived'} />
                  </div>
                );
              })
          }
        </div>

        {/* Invoices */}
        <div>
          <Cap style={{ marginBottom: 12 }}>Invoices ({projInvs.length})</Cap>

          {projInvs.length === 0
            ? <Empty icon="◻" text="No invoices yet for this project" />
            : projInvs.map(inv => (
                <div key={inv.id} style={{ padding: '12px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontFamily: F.con, fontWeight: 700, fontSize: 12, color: C.cream, letterSpacing: 1 }}>
                        Invoice No.{String(inv.no || '').padStart(2,'0')}
                      </div>
                      <div style={{ fontFamily: F.con, fontSize: 9, color: C.muted, marginTop: 2 }}>
                        {fmtDate(inv.date)} · {inv.terms}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: F.con, fontWeight: 800, fontSize: 14, color: C.cream }}>{fmtINR(inv.total)}</div>
                      <Badge status={inv.status} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button onClick={() => setPreviewInv(inv)}
                      style={{ background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 3, padding: '3px 10px', fontFamily: F.con, fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: C.label, cursor: 'pointer' }}>
                      Preview
                    </button>
                    {inv.status !== 'paid' && (
                      <button onClick={() => onMarkInvoice(inv.id, 'paid')}
                        style={{ background: 'transparent', border: `1px solid rgba(82,184,122,.3)`, borderRadius: 3, padding: '3px 10px', fontFamily: F.con, fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: C.green, cursor: 'pointer' }}>
                        Mark Paid
                      </button>
                    )}
                    {isAdmin && (
                      <button onClick={() => setConfirmInv(inv)}
                        style={{ background: 'transparent', border: `1px solid rgba(201,79,79,.25)`, borderRadius: 3, padding: '3px 10px', fontFamily: F.con, fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: C.red, cursor: 'pointer' }}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
          }
        </div>
      </div>

      {/* Invoice delete confirm */}
      {confirmInv && (
        <ConfirmModal
          title="Delete Invoice"
          message={`Delete Invoice No.${String(confirmInv.no||'').padStart(2,'0')} for ${fmtINR(confirmInv.total)}? This cannot be undone.`}
          confirmLabel="Delete Invoice"
          onConfirm={() => { onDeleteInvoice(confirmInv.id); setConfirmInv(null); }}
          onCancel={() => setConfirmInv(null)}
        />
      )}

      {/* Invoice preview */}
      {previewInv && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 24, overflowY: 'auto' }}
          onClick={e => e.target === e.currentTarget && setPreviewInv(null)}>
          <div style={{ width: '100%', maxWidth: 560 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Cap style={{ marginBottom: 0, color: C.label }}>Invoice Preview</Cap>
              <button onClick={() => setPreviewInv(null)}
                style={{ background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 4, padding: '5px 14px', fontFamily: F.con, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: C.muted, cursor: 'pointer' }}>
                Close
              </button>
            </div>
            <InvoiceRender
              client={{ name: previewInv.client_name }}
              invNo={previewInv.no}
              invDate={previewInv.date}
              lines={previewInv.line_items || []}
              subtotal={previewInv.subtotal}
              gst={previewInv.gst}
              gstRate={previewInv.gst_rate}
              gstAmt={previewInv.gst ? (previewInv.subtotal * previewInv.gst_rate / 100) : 0}
              total={previewInv.total}
              due={calcDueDate(previewInv.date, previewInv.terms)}
            />
          </div>
        </div>
      )}
    </PageShell>
  );
}
