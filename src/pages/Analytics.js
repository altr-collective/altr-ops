import { useState, useMemo } from 'react';
import { C, F, fmtHrs, fmtINR } from '../lib/utils';
import { WORK_TYPES, DEFAULT_TARGETS, getWorkType, clientTypes } from '../lib/workTypes';
import { Cap, PageShell, Card, Divider, Empty, Badge, StatBox } from '../components/UI';

// ─── HELPERS ──────────────────────────────────────────────────────
const pct = (a, b) => b === 0 ? 0 : Math.round((a / b) * 100);

const dateRanges = {
  'This Week':  () => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split('T')[0]; },
  'This Month': () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`; },
  'Last Month': () => { const d = new Date(); d.setMonth(d.getMonth()-1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`; },
  'Last 3 Months': () => { const d = new Date(); d.setMonth(d.getMonth()-3); return d.toISOString().split('T')[0]; },
  'All Time': () => '2000-01-01',
};

// ─── MINI BAR ─────────────────────────────────────────────────────
function Bar({ value, max, color, height = 8, label }) {
  const w = max === 0 ? 0 : Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: 6 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: C.label }}>{label}</span>
          <span style={{ fontFamily: F.con, fontSize: 9, color: C.text }}>{fmtHrs(value)}</span>
        </div>
      )}
      <div style={{ height, background: C.border, borderRadius: height/2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: height/2, transition: 'width .4s ease' }} />
      </div>
    </div>
  );
}

// ─── STACKED BAR ──────────────────────────────────────────────────
function StackedBar({ segments, total, height = 24 }) {
  if (total === 0) return (
    <div style={{ height, background: C.border, borderRadius: 4 }} />
  );
  return (
    <div style={{ display: 'flex', height, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
      {segments.filter(s => s.value > 0).map(s => (
        <div key={s.id} title={`${s.label}: ${fmtHrs(s.value)}`}
          style={{ flex: s.value, background: s.color, transition: 'flex .4s ease', minWidth: 3 }} />
      ))}
    </div>
  );
}

// ─── DONUT CHART (SVG) ────────────────────────────────────────────
function Donut({ segments, size = 120, thickness = 24 }) {
  const r = (size / 2) - thickness / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  let offset = 0;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {total === 0
        ? <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={thickness} />
        : segments.filter(s => s.value > 0).map(s => {
            const dash = (s.value / total) * circ;
            const gap = circ - dash;
            const el = (
              <circle key={s.id} cx={size/2} cy={size/2} r={r} fill="none"
                stroke={s.color} strokeWidth={thickness}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
                style={{ transition: 'stroke-dasharray .4s' }} />
            );
            offset += dash;
            return el;
          })
      }
    </svg>
  );
}

// ─── SPARKLINE ────────────────────────────────────────────────────
function Sparkline({ data, color = C.cream, width = 120, height = 36 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={parseFloat(pts.split(' ').pop().split(',')[0])} cy={parseFloat(pts.split(' ').pop().split(',')[1])} r={3} fill={color} />
    </svg>
  );
}

// ─── MAIN ANALYTICS PAGE ─────────────────────────────────────────
export default function AnalyticsPage({ logs, team, projects, clients, invoices, onNav, isAdmin }) {
  const [range,      setRange]      = useState('This Month');
  const [activeTab,  setActiveTab]  = useState('team');

  const fromDate = dateRanges[range]();

  const filteredLogs = useMemo(() =>
    logs.filter(l => l.date >= fromDate),
    [logs, fromDate]
  );

  // ── Team-wide totals ────────────────────────────────────────────
  const totalHours    = filteredLogs.reduce((s, l) => s + (l.hours || 0), 0);
  const billedHours   = filteredLogs.filter(l => l.billed).reduce((s, l) => s + (l.hours || 0), 0);
  const clientHours   = filteredLogs.filter(l => clientTypes.includes(l.work_type)).reduce((s, l) => s + (l.hours || 0), 0);
  const billableRatio = pct(billedHours, totalHours);
  const clientRatio   = pct(clientHours, totalHours);

  // ── Per-member breakdown ────────────────────────────────────────
  const memberStats = useMemo(() => team.map(m => {
    const mLogs = filteredLogs.filter(l => l.member_id === m.id);
    const total = mLogs.reduce((s, l) => s + (l.hours || 0), 0);
    const billed = mLogs.filter(l => l.billed).reduce((s, l) => s + (l.hours || 0), 0);

    const byType = {};
    WORK_TYPES.forEach(wt => {
      byType[wt.id] = mLogs.filter(l => l.work_type === wt.id || (!l.work_type && wt.id === 'client_design'))
        .reduce((s, l) => s + (l.hours || 0), 0);
    });

    const segments = WORK_TYPES.map(wt => ({ ...wt, value: byType[wt.id] || 0 }));

    // Weekly trend — last 8 weeks
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (7 * (7 - i)));
      const start = d.toISOString().split('T')[0];
      const end = new Date(d.getTime() + 7 * 86400000).toISOString().split('T')[0];
      return logs.filter(l => l.member_id === m.id && l.date >= start && l.date < end)
        .reduce((s, l) => s + (l.hours || 0), 0);
    });

    return { member: m, total, billed, segments, byType, weeks,
      billableRatio: pct(billed, total) };
  }), [team, filteredLogs, logs]);

  // ── Project health ──────────────────────────────────────────────
  const projectHealth = useMemo(() => projects
    .filter(p => p.status === 'active')
    .map(p => {
      const pLogs = filteredLogs.filter(l => l.project_id === p.id);
      const burned = pLogs.reduce((s, l) => s + (l.hours || 0), 0);
      const client = clients.find(c => c.id === p.client_id);
      const est = parseFloat(p.estimated_hours) || 0;
      const healthPct = est > 0 ? pct(burned, est) : null;
      const status = healthPct === null ? 'no-estimate'
        : healthPct >= 100 ? 'over' : healthPct >= 80 ? 'at-risk' : 'healthy';
      return { project: p, client, burned, est, healthPct, status };
    })
    .sort((a, b) => (b.healthPct || 0) - (a.healthPct || 0)),
    [projects, filteredLogs, clients]
  );

  // ── Monthly trend (last 6 months) ──────────────────────────────
  const monthlyTrend = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
      const y = d.getFullYear(); const mo = d.getMonth() + 1;
      const prefix = `${y}-${String(mo).padStart(2,'0')}`;
      const mLogs = logs.filter(l => l.date?.startsWith(prefix));
      const total = mLogs.reduce((s, l) => s + (l.hours || 0), 0);
      const billed = mLogs.filter(l => l.billed).reduce((s, l) => s + (l.hours || 0), 0);
      const label = d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
      return { label, total, billed };
    });
  }, [logs]);

  const tabs = [
    { id: 'team',     label: 'Team Overview' },
    { id: 'members',  label: 'Per Member' },
    { id: 'projects', label: 'Project Health' },
    { id: 'trend',    label: 'Monthly Trend' },
  ];

  return (
    <PageShell title="Analytics" onBack={() => onNav('dashboard')}
      action={
        <div style={{ display: 'flex', gap: 4 }}>
          {Object.keys(dateRanges).map(r => (
            <button key={r} onClick={() => setRange(r)}
              style={{ background: range===r ? C.cream : 'transparent', border: `1px solid ${range===r ? C.cream : C.border2}`, borderRadius: 3, padding: '4px 10px', fontFamily: F.con, fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: range===r ? C.bg : C.muted, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {r}
            </button>
          ))}
        </div>
      }>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab===t.id ? C.cream : 'transparent'}`,
            padding: '8px 16px', fontFamily: F.con, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase',
            color: activeTab===t.id ? C.cream : C.label, cursor: 'pointer', marginBottom: -1,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TEAM OVERVIEW ─────────────────────────────────────── */}
      {activeTab === 'team' && (
        <div>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 1, background: C.border, borderRadius: 8, overflow: 'hidden', marginBottom: 28 }}>
            {[
              { label: 'Total Hours',    value: fmtHrs(totalHours),  color: C.cream },
              { label: 'Billed Hours',   value: fmtHrs(billedHours), color: C.green },
              { label: 'Billable Ratio', value: `${billableRatio}%`, color: billableRatio >= 60 ? C.green : billableRatio >= 40 ? C.orange : C.red },
              { label: 'Client Time',    value: `${clientRatio}%`,   color: clientRatio >= 70 ? C.green : C.orange },
              { label: 'Active Members', value: memberStats.filter(m => m.total > 0).length, color: C.cream },
            ].map(s => (
              <div key={s.label} style={{ background: C.card, padding: '18px 20px' }}>
                <Cap style={{ marginBottom: 6 }}>{s.label}</Cap>
                <div style={{ fontFamily: F.con, fontWeight: 800, fontSize: 22, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Team time distribution donut */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

            <Card>
              <Cap style={{ marginBottom: 18 }}>Team Time Distribution</Cap>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                <Donut size={140} thickness={28} segments={
                  WORK_TYPES.map(wt => ({
                    ...wt,
                    value: filteredLogs.filter(l => (l.work_type || 'client_design') === wt.id)
                      .reduce((s, l) => s + (l.hours || 0), 0)
                  }))
                } />
                <div style={{ flex: 1 }}>
                  {WORK_TYPES.map(wt => {
                    const hrs = filteredLogs.filter(l => (l.work_type || 'client_design') === wt.id)
                      .reduce((s, l) => s + (l.hours || 0), 0);
                    if (hrs === 0) return null;
                    return (
                      <div key={wt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: wt.color, flexShrink: 0 }} />
                        <div style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 1, color: C.text, flex: 1 }}>{wt.short}</div>
                        <div style={{ fontFamily: F.con, fontSize: 9, color: C.label }}>{fmtHrs(hrs)}</div>
                        <div style={{ fontFamily: F.con, fontSize: 9, color: C.muted }}>{pct(hrs, totalHours)}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card>
              <Cap style={{ marginBottom: 18 }}>Team Capacity This Period</Cap>
              {memberStats.length === 0
                ? <Empty icon="◈" text="No team members" />
                : memberStats.map(ms => (
                    <div key={ms.member.id} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ fontFamily: F.con, fontWeight: 700, fontSize: 11, color: C.cream }}>{ms.member.name}</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontFamily: F.con, fontSize: 9, color: C.label }}>{fmtHrs(ms.total)}</span>
                          <span style={{ fontFamily: F.con, fontSize: 8, color: ms.billableRatio >= 60 ? C.green : C.orange }}>{ms.billableRatio}% billed</span>
                        </div>
                      </div>
                      <StackedBar segments={ms.segments} total={ms.total} height={16} />
                    </div>
                  ))
              }
              {/* Legend */}
              <Divider />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {WORK_TYPES.map(wt => (
                  <div key={wt.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: wt.color }} />
                    <span style={{ fontFamily: F.con, fontSize: 8, letterSpacing: 1, color: C.muted }}>{wt.short}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Skew alerts */}
          {memberStats.some(ms => {
            if (ms.total === 0) return false;
            const execPct = pct(ms.byType['client_design'] || 0, ms.total);
            const adminPct = pct(ms.byType['ops_admin'] || 0, ms.total);
            return execPct > 70 || adminPct > 30;
          }) && (
            <Card style={{ border: `1px solid rgba(217,140,69,.3)`, background: 'rgba(217,140,69,.04)', marginBottom: 16 }}>
              <Cap style={{ color: C.orange, marginBottom: 12 }}>⚠ Balance Alerts</Cap>
              {memberStats.map(ms => {
                if (ms.total === 0) return null;
                const execPct = pct(ms.byType['client_design'] || 0, ms.total);
                const adminPct = pct(ms.byType['ops_admin'] || 0, ms.total);
                const researchPct = pct((ms.byType['client_research'] || 0) + (ms.byType['client_strategy'] || 0), ms.total);
                const alerts = [];
                if (execPct > 70) alerts.push(`${execPct}% in execution — not enough research/strategy`);
                if (adminPct > 30) alerts.push(`${adminPct}% in admin — too much overhead`);
                if (researchPct < 10 && ms.total > 10) alerts.push(`Only ${researchPct}% in research/strategy`);
                if (alerts.length === 0) return null;
                return (
                  <div key={ms.member.id} style={{ marginBottom: 10 }}>
                    <div style={{ fontFamily: F.con, fontWeight: 700, fontSize: 11, color: C.cream, marginBottom: 3 }}>{ms.member.name}</div>
                    {alerts.map((a, i) => (
                      <div key={i} style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 1, color: C.orange, marginBottom: 2 }}>→ {a}</div>
                    ))}
                  </div>
                );
              })}
            </Card>
          )}
        </div>
      )}

      {/* ── PER MEMBER ──────────────────────────────────────────── */}
      {activeTab === 'members' && (
        <div>
          {memberStats.length === 0
            ? <Empty icon="◈" text="No team members" />
            : memberStats.map(ms => (
                <Card key={ms.member.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: F.con, fontWeight: 800, fontSize: 18, color: C.cream, marginBottom: 3 }}>{ms.member.name}</div>
                      <div style={{ fontFamily: F.con, fontSize: 10, color: C.label, letterSpacing: 1 }}>{ms.member.role}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 24 }}>
                      <StatBox label="Total" value={fmtHrs(ms.total)} />
                      <StatBox label="Billed" value={fmtHrs(ms.billed)} color={C.green} />
                      <StatBox label="Billable %" value={`${ms.billableRatio}%`} color={ms.billableRatio >= 60 ? C.green : ms.billableRatio >= 40 ? C.orange : C.red} />
                    </div>
                  </div>

                  {/* Stacked bar */}
                  <div style={{ marginBottom: 16 }}>
                    <Cap style={{ marginBottom: 8 }}>Time Distribution</Cap>
                    <StackedBar segments={ms.segments} total={ms.total} height={28} />
                  </div>

                  {/* Per-category vs target */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
                    {WORK_TYPES.map(wt => {
                      const actual = ms.byType[wt.id] || 0;
                      const actualPct = pct(actual, ms.total);
                      const targetPct = DEFAULT_TARGETS[wt.id] || 0;
                      const diff = actualPct - targetPct;
                      return (
                        <div key={wt.id} style={{ padding: '10px 12px', background: C.bg, borderRadius: 6, border: `1px solid ${C.border}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: wt.color, flexShrink: 0 }} />
                            <div style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: C.text, flex: 1 }}>{wt.short}</div>
                            <div style={{ fontFamily: F.con, fontSize: 9, color: Math.abs(diff) <= 5 ? C.green : Math.abs(diff) <= 15 ? C.orange : C.red }}>
                              {diff > 0 ? '+' : ''}{diff}%
                            </div>
                          </div>
                          {/* Actual bar */}
                          <div style={{ height: 5, background: C.border, borderRadius: 3, marginBottom: 3, position: 'relative' }}>
                            <div style={{ position: 'absolute', height: '100%', width: `${Math.min(100, actualPct)}%`, background: wt.color, borderRadius: 3 }} />
                          </div>
                          {/* Target line */}
                          <div style={{ height: 5, background: C.border, borderRadius: 3, position: 'relative' }}>
                            <div style={{ position: 'absolute', height: '100%', width: `${targetPct}%`, background: `${wt.color}44`, borderRadius: 3, border: `1px dashed ${wt.color}88` }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                            <span style={{ fontFamily: F.con, fontSize: 8, color: C.muted }}>{fmtHrs(actual)} actual</span>
                            <span style={{ fontFamily: F.con, fontSize: 8, color: C.muted }}>{targetPct}% target</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Weekly sparkline */}
                  <div>
                    <Cap style={{ marginBottom: 8 }}>Weekly Hours (Last 8 Weeks)</Cap>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                      <Sparkline data={ms.weeks} color={C.cream} width={240} height={40} />
                      <div style={{ fontFamily: F.con, fontSize: 9, color: C.muted, letterSpacing: 1 }}>
                        avg {fmtHrs(ms.weeks.reduce((s,v)=>s+v,0) / Math.max(1, ms.weeks.filter(v=>v>0).length))}/wk
                      </div>
                    </div>
                  </div>
                </Card>
              ))
          }
        </div>
      )}

      {/* ── PROJECT HEALTH ──────────────────────────────────────── */}
      {activeTab === 'projects' && (
        <div>
          {projectHealth.length === 0
            ? <Empty icon="◇" text="No active projects" />
            : projectHealth.map(({ project, client, burned, est, healthPct, status }) => {
                const statusColor = status === 'over' ? C.red : status === 'at-risk' ? C.orange : status === 'healthy' ? C.green : C.label;
                const statusLabel = status === 'over' ? 'Over budget' : status === 'at-risk' ? 'At risk' : status === 'healthy' ? 'On track' : 'No estimate';
                return (
                  <Card key={project.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontFamily: F.con, fontWeight: 700, fontSize: 15, color: C.cream, marginBottom: 3 }}>{project.name}</div>
                        <div style={{ fontFamily: F.con, fontSize: 9, color: C.label, letterSpacing: 1 }}>{client?.name || '—'} · {project.type}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <StatBox label="Burned" value={fmtHrs(burned)} />
                        {est > 0 && <StatBox label="Estimated" value={fmtHrs(est)} />}
                        <div style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 3, background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}33` }}>{statusLabel}</div>
                      </div>
                    </div>

                    {est > 0 ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Cap style={{ marginBottom: 0 }}>Hours burned vs estimate</Cap>
                          <span style={{ fontFamily: F.con, fontSize: 10, color: statusColor, fontWeight: 700 }}>{healthPct}%</span>
                        </div>
                        <div style={{ height: 12, background: C.border, borderRadius: 6, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, healthPct)}%`, background: statusColor, borderRadius: 6, transition: 'width .4s' }} />
                        </div>
                        {healthPct > 100 && (
                          <div style={{ fontFamily: F.con, fontSize: 9, color: C.red, marginTop: 6 }}>
                            → {fmtHrs(burned - est)} over estimate — consider scope conversation with client
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontFamily: F.con, fontSize: 9, color: C.muted, letterSpacing: 1 }}>
                        No hour estimate set — add one in Projects to track burn rate
                      </div>
                    )}

                    {/* Work type breakdown for this project */}
                    {burned > 0 && (() => {
                      const pLogs = logs.filter(l => l.project_id === project.id);
                      const segs = WORK_TYPES.map(wt => ({
                        ...wt,
                        value: pLogs.filter(l => (l.work_type || 'client_design') === wt.id).reduce((s, l) => s + (l.hours || 0), 0)
                      })).filter(s => s.value > 0);
                      return segs.length > 0 ? (
                        <div style={{ marginTop: 12 }}>
                          <Cap style={{ marginBottom: 6 }}>Work type breakdown</Cap>
                          <StackedBar segments={segs} total={burned} height={12} />
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                            {segs.map(s => (
                              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
                                <span style={{ fontFamily: F.con, fontSize: 8, color: C.muted }}>{s.short}: {fmtHrs(s.value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </Card>
                );
              })
          }
        </div>
      )}

      {/* ── MONTHLY TREND ───────────────────────────────────────── */}
      {activeTab === 'trend' && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <Cap style={{ marginBottom: 20 }}>Hours — Last 6 Months</Cap>
            {(() => {
              const maxVal = Math.max(...monthlyTrend.map(m => m.total), 1);
              return (
                <div>
                  {/* Bar chart */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120, marginBottom: 8 }}>
                    {monthlyTrend.map(m => (
                      <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                        <div style={{ fontFamily: F.con, fontSize: 8, color: C.label }}>{fmtHrs(m.total)}</div>
                        <div style={{ width: '100%', position: 'relative', height: `${(m.total / maxVal) * 100}%`, minHeight: 4 }}>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', background: C.border2, borderRadius: '3px 3px 0 0' }} />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${pct(m.billed, m.total)}%`, background: C.green, borderRadius: '3px 3px 0 0', opacity: .8 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* X axis labels */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {monthlyTrend.map(m => (
                      <div key={m.label} style={{ flex: 1, textAlign: 'center', fontFamily: F.con, fontSize: 8, letterSpacing: 2, color: C.muted }}>{m.label}</div>
                    ))}
                  </div>
                  {/* Legend */}
                  <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, background: C.border2, borderRadius: 2 }} />
                      <span style={{ fontFamily: F.con, fontSize: 9, color: C.label }}>Total hours</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, background: C.green, borderRadius: 2, opacity: .8 }} />
                      <span style={{ fontFamily: F.con, fontSize: 9, color: C.label }}>Billed hours</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </Card>

          {/* Per-member trend */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {memberStats.map(ms => (
              <Card key={ms.member.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontFamily: F.con, fontWeight: 700, fontSize: 13, color: C.cream }}>{ms.member.name}</div>
                  <Sparkline data={ms.weeks} color={C.cream} width={80} height={28} />
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <StatBox label="This Period" value={fmtHrs(ms.total)} />
                  <StatBox label="Billed" value={`${ms.billableRatio}%`} color={ms.billableRatio >= 60 ? C.green : C.orange} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
