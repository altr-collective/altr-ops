import { useState } from 'react';
import { C, F, fmtINR, fmtHrs, fmtDate, fmtDateLong, calcDueDate } from '../lib/utils';
import { Cap, Card, FilterBar, Empty, Badge, Btn, StatBox } from '../components/UI';
import { isBillableWorkType } from '../lib/workTypes';
import { ConfirmModal } from '../components/ConfirmModal';
import { InvoiceRender } from './TimeLogInvoice';

export default function Dashboard({ clients, team, projects, logs, invoices, onNav, onMarkInvoice, onDeleteInvoice, isAdmin, streak, checkIn }) {
  const [filter,       setFilter]       = useState('all');
  const [confirm,      setConfirm]      = useState(null);
  const [previewInv,   setPreviewInv]   = useState(null);

  const totalInv   = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const totalPaid  = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0);
  const totalOut   = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.total || 0), 0);
  const unbilledH  = logs.filter(l => !l.billed && isBillableWorkType(l.work_type)).reduce((s, l) => s + (l.hours || 0), 0);
  const activeProj = projects.filter(p => p.status === 'active').length;

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);

  const navCards = isAdmin
    ? [
        { label: 'Clients',   val: clients.length,    sub: 'registered',   icon: '◎', s: 'clients' },
        { label: 'Team',      val: team.length,        sub: 'members',      icon: '◈', s: 'team' },
        { label: 'Projects',  val: activeProj,         sub: 'active',       icon: '◇', s: 'projects' },
        { label: 'Unbilled',  val: fmtHrs(unbilledH),  sub: 'hours logged', icon: '◷', s: 'timelog' },
        { label: 'Analytics', val: '→',                sub: 'productivity', icon: '◈', s: 'analytics' },
      ]
    : [
        { label: 'Time Log',  val: fmtHrs(unbilledH), sub: 'unbilled hours',    icon: '◷', s: 'timelog' },
        { label: 'Projects',  val: activeProj,         sub: 'active projects',   icon: '◇', s: 'projects' },
        { label: 'Analytics', val: '→',                sub: 'your productivity', icon: '◈', s: 'analytics' },
      ];

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '36px 24px 80px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: F.con, fontWeight: 900, fontSize: 10, letterSpacing: 6, textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>ALTR COLLECTIVE</div>
          <div style={{ fontFamily: F.con, fontWeight: 900, fontSize: 'clamp(28px,6vw,48px)', lineHeight: .9, letterSpacing: -2, textTransform: 'uppercase', color: C.cream }}>
            Operations<br /><span style={{ color: C.muted }}>Dashboard</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
          <Cap style={{ marginBottom: 0, color: C.muted }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
          </Cap>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" onClick={() => onNav('timelog')}>+ Log Time</Btn>
            {isAdmin && <Btn onClick={() => onNav('invoice')}>+ Invoice</Btn>}
          </div>
        </div>
      </div>

      {/* Streak + intention banner */}
      {(streak?.count > 0 || checkIn) && (
        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
          {streak?.count > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 16px', background:'rgba(217,140,69,.08)', border:`1px solid rgba(217,140,69,.2)`, borderRadius:6 }}>
              <span style={{ fontSize:16 }}>🔥</span>
              <div>
                <div style={{ fontFamily:F.con, fontWeight:800, fontSize:14, color:C.orange }}>{streak.count} day streak</div>
                <div style={{ fontFamily:F.con, fontSize:8, letterSpacing:2, textTransform:'uppercase', color:C.muted }}>{streak.hasLoggedToday ? 'Logged today ✓' : 'Log something to keep it!'}</div>
              </div>
            </div>
          )}
          {checkIn && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 16px', background:'rgba(82,184,122,.06)', border:`1px solid rgba(82,184,122,.15)`, borderRadius:6, flex:1, minWidth:200 }}>
              <span style={{ fontSize:14 }}>🎯</span>
              <div>
                <div style={{ fontFamily:F.con, fontSize:8, letterSpacing:2, textTransform:'uppercase', color:C.muted, marginBottom:2 }}>Today's focus</div>
                <div style={{ fontFamily:F.body, fontSize:12, color:C.text, fontStyle:'italic' }}>"{checkIn.intention}"</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nav cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 24 }}>
        {navCards.map(n => (
          <Card key={n.s} hover onClick={() => onNav(n.s)} style={{ padding: '20px 18px' }}>
            <div style={{ fontFamily: F.con, fontSize: 20, color: C.muted, marginBottom: 14 }}>{n.icon}</div>
            <div style={{ fontFamily: F.con, fontWeight: 800, fontSize: 20, color: C.cream, marginBottom: 2 }}>{n.val}</div>
            <Cap style={{ marginBottom: 2, color: C.label }}>{n.label}</Cap>
            <div style={{ fontFamily: F.con, fontSize: 9, color: C.muted, letterSpacing: 1 }}>{n.sub}</div>
          </Card>
        ))}
      </div>

      {/* Financial stats — admin only */}
      {isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: C.border, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 36 }}>
          {[
            { label: 'Total Invoiced', value: fmtINR(totalInv),  color: C.cream },
            { label: 'Collected',      value: fmtINR(totalPaid), color: C.green },
            { label: 'Outstanding',    value: fmtINR(totalOut),  color: C.orange },
          ].map(s => (
            <div key={s.label} style={{ background: C.card, padding: '18px 22px' }}>
              <Cap style={{ marginBottom: 6 }}>{s.label}</Cap>
              <div style={{ fontFamily: F.con, fontWeight: 800, fontSize: 24, color: s.color, letterSpacing: -0.5 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice history — admin only */}
      {isAdmin && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Cap style={{ marginBottom: 0 }}>Invoice History</Cap>
            <FilterBar options={['all', 'unpaid', 'paid', 'overdue']} value={filter} onChange={setFilter} />
          </div>

          {filtered.length === 0
            ? <Empty icon="◻" text={filter === 'all' ? 'No invoices yet' : `No ${filter} invoices`} />
            : filtered.map(inv => (
                <div key={inv.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', padding: '13px 16px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, marginBottom: 6 }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontFamily: F.con, fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: C.cream }}>{inv.client_name}</div>
                    <div style={{ fontFamily: F.con, fontSize: 9, color: C.muted, marginTop: 3, letterSpacing: 1 }}>
                      No.{String(inv.no || '').padStart(2, '0')} · {fmtDate(inv.date)} · {inv.project_name || ''} · {inv.terms}
                    </div>
                  </div>
                  <div style={{ fontFamily: F.con, fontWeight: 700, fontSize: 14, color: C.cream }}>{fmtINR(inv.total)}</div>
                  <Badge status={inv.status} />
                  <div style={{ display: 'flex', gap: 4 }}>
                    {/* Preview */}
                    <button onClick={() => setPreviewInv(inv)}
                      style={{ background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 3, padding: '3px 9px', fontFamily: F.con, fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: C.label, cursor: 'pointer' }}>
                      Preview
                    </button>
                    {/* Mark paid */}
                    {inv.status !== 'paid' && (
                      <button onClick={() => onMarkInvoice(inv.id, 'paid')}
                        style={{ background: 'transparent', border: `1px solid rgba(82,184,122,.3)`, borderRadius: 3, padding: '3px 9px', fontFamily: F.con, fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: C.green, cursor: 'pointer' }}>
                        Paid
                      </button>
                    )}
                    {/* Mark overdue */}
                    {inv.status === 'unpaid' && (
                      <button onClick={() => onMarkInvoice(inv.id, 'overdue')}
                        style={{ background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 3, padding: '3px 9px', fontFamily: F.con, fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: C.muted, cursor: 'pointer' }}>
                        Overdue
                      </button>
                    )}
                    {/* Delete */}
                    <button onClick={() => setConfirm(inv)}
                      style={{ background: 'transparent', border: `1px solid rgba(201,79,79,.25)`, borderRadius: 3, padding: '3px 9px', fontFamily: F.con, fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: C.red, cursor: 'pointer' }}>
                      ✕
                    </button>
                  </div>
                </div>
              ))
          }
        </>
      )}

      {/* Member view */}
      {!isAdmin && (
        <div>
          <Cap style={{ marginBottom: 14 }}>Recent Time Entries</Cap>
          {logs.length === 0
            ? <Empty icon="◷" text="No time entries yet — tap ⏱ to start tracking" />
            : logs.slice(0, 10).map(log => {
                const proj = projects.find(p => p.id === log.project_id);
                return (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, marginBottom: 6 }}>
                    <div>
                      <div style={{ fontFamily: F.con, fontWeight: 700, fontSize: 12, color: C.cream, letterSpacing: 1 }}>{proj?.name || 'Unknown project'}</div>
                      <div style={{ fontFamily: F.con, fontSize: 9, color: C.muted, marginTop: 2 }}>{fmtDate(log.date)}{log.notes ? ` · ${log.notes}` : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ fontFamily: F.con, fontWeight: 700, fontSize: 14, color: C.cream }}>{log.hours}h</div>
                      <Badge status={log.billed ? 'billed' : 'unpaid'} />
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}

      {/* Invoice delete confirmation */}
      {confirm && (
        <ConfirmModal
          title="Delete Invoice"
          message={`Delete invoice for ${confirm.client_name} (${fmtINR(confirm.total)})? This cannot be undone.`}
          confirmLabel="Delete Invoice"
          onConfirm={() => { onDeleteInvoice(confirm.id); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Invoice preview modal */}
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
    </div>
  );
}
