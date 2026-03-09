import { useState } from 'react';
import { C, F, fmtINR, fmtHrs, fmtDate } from '../lib/utils';
import { Cap, Card, FilterBar, Empty, Badge, Btn, StatBox } from '../components/UI';

export default function Dashboard({ clients, team, projects, logs, invoices, onNav, onMarkInvoice }) {
  const [filter, setFilter] = useState('all');

  const totalInv    = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const totalPaid   = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0);
  const totalOut    = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.total || 0), 0);
  const unbilledH   = logs.filter(l => !l.billed).reduce((s, l) => s + (l.hours || 0), 0);
  const activeProj  = projects.filter(p => p.status === 'active').length;

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '44px 32px 80px' }}>

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
            <Btn onClick={() => onNav('invoice')}>+ Invoice</Btn>
          </div>
        </div>
      </div>

      {/* Nav cards — 2 cols on mobile, 4 on desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 24 }}>
        {[
          { label: 'Clients',  val: clients.length,  sub: 'registered',    icon: '◎', s: 'clients' },
          { label: 'Team',     val: team.length,      sub: 'members',       icon: '◈', s: 'team' },
          { label: 'Projects', val: activeProj,       sub: 'active',        icon: '◇', s: 'projects' },
          { label: 'Unbilled', val: fmtHrs(unbilledH),sub: 'hours logged',  icon: '◷', s: 'timelog' },
        ].map(n => (
          <Card key={n.s} hover onClick={() => onNav(n.s)} style={{ padding: '20px 18px' }}>
            <div style={{ fontFamily: F.con, fontSize: 20, color: C.muted, marginBottom: 14 }}>{n.icon}</div>
            <div style={{ fontFamily: F.con, fontWeight: 800, fontSize: 20, color: C.cream, marginBottom: 2 }}>{n.val}</div>
            <Cap style={{ marginBottom: 2, color: C.label }}>{n.label}</Cap>
            <div style={{ fontFamily: F.con, fontSize: 9, color: C.muted, letterSpacing: 1 }}>{n.sub}</div>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: C.border, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 36 }}>
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

      {/* Invoice history */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Cap style={{ marginBottom: 0 }}>Invoice History</Cap>
        <FilterBar options={['all', 'unpaid', 'paid', 'overdue']} value={filter} onChange={setFilter} />
      </div>

      {filtered.length === 0
        ? <Empty icon="◻" text={filter === 'all' ? 'No invoices yet' : `No ${filter} invoices`} />
        : filtered.map(inv => (
            <div key={inv.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 14, alignItems: 'center', padding: '13px 16px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, marginBottom: 6 }}>
              <div>
                <div style={{ fontFamily: F.con, fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: C.cream }}>{inv.client_name}</div>
                <div style={{ fontFamily: F.con, fontSize: 9, color: C.muted, marginTop: 3, letterSpacing: 1 }}>
                  No.{String(inv.no || '').padStart(2, '0')} · {fmtDate(inv.date)} · {inv.project_name || ''} · {inv.terms}
                </div>
              </div>
              <div style={{ fontFamily: F.con, fontWeight: 700, fontSize: 14, color: C.cream }}>{fmtINR(inv.total)}</div>
              <Badge status={inv.status} />
              <div style={{ display: 'flex', gap: 4 }}>
                {inv.status !== 'paid' && (
                  <button onClick={() => onMarkInvoice(inv.id, 'paid')}
                    style={{ background: 'transparent', border: `1px solid rgba(82,184,122,.3)`, borderRadius: 3, padding: '3px 9px', fontFamily: F.con, fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: C.green, cursor: 'pointer' }}>
                    Paid
                  </button>
                )}
                {inv.status === 'unpaid' && (
                  <button onClick={() => onMarkInvoice(inv.id, 'overdue')}
                    style={{ background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 3, padding: '3px 9px', fontFamily: F.con, fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: C.muted, cursor: 'pointer' }}>
                    Overdue
                  </button>
                )}
              </div>
            </div>
          ))
      }
    </div>
  );
}
