import { useState, useEffect, useRef } from 'react';
import { C, F, fmtINR, fmtHrs, fmtDate, fmtDateLong, calcDueDate, uid, today } from '../lib/utils';
import { Cap, Inp, Sel, Btn, Badge, Card, Modal, Divider, Row, PageShell, Empty, Avatar, StatBox, Sec } from '../components/UI';
import { ConfirmModal } from '../components/ConfirmModal';
import { WORK_TYPES, getWorkType } from '../lib/workTypes';

// ─── FLOATING TIMER ───────────────────────────────────────────────
export function FloatingTimer({ team, projects, clients, onAdd }) {
  const [open,      setOpen]      = useState(false);
  const [running,   setRunning]   = useState(false);
  const [elapsed,   setElapsed]   = useState(0);       // seconds
  const [startedAt, setStartedAt] = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState({ date: today(), work_type: 'client_design' });
  const [formError, setFormError] = useState('');
  // Use a ref for hours so save() always reads the latest value regardless of render cycle
  const hoursRef = useRef(0);
  const intervalRef = useRef(null);

  // Tick every second when running
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, startedAt]);

  const start = () => {
    const now = Date.now();
    setStartedAt(now);
    setElapsed(0);
    setRunning(true);
    setOpen(true);
    setFormError('');
  };

  const stop = () => {
    setRunning(false);
    setSaving(true);
    // Round to nearest 0.25h and store in ref immediately
    const hrs = Math.max(0.25, Math.round((elapsed / 3600) * 4) / 4);
    hoursRef.current = hrs;
    setForm(p => ({ ...p, hours: hrs.toString(), date: today() }));
    setFormError('');
  };

  const reset = () => {
    setRunning(false);
    setElapsed(0);
    setStartedAt(null);
    setSaving(false);
    hoursRef.current = 0;
    setForm({ date: today(), work_type: 'client_design' });
    setFormError('');
  };

  const save = async () => {
    // Read hours from ref (always current) and fall back to form state
    const hours = hoursRef.current || parseFloat(form.hours) || 0;
    if (!form.member_id) { setFormError('Please select a team member.'); return; }
    if (!form.project_id) { setFormError('Please select a project.'); return; }
    if (!hours) { setFormError('No hours recorded.'); return; }
    setFormError('');
    await onAdd({ ...form, hours, billed: false });
    reset();
    setOpen(false);
  };

  const fmtElapsed = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <>
      {/* Floating button */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 500,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10
      }}>
        {/* Pill timer display when running */}
        {running && !open && (
          <div onClick={() => setOpen(true)} style={{
            background: C.red, borderRadius: 20, padding: '8px 16px',
            fontFamily: F.con, fontSize: 16, fontWeight: 700, color: '#fff',
            letterSpacing: 2, cursor: 'pointer', boxShadow: '0 4px 20px rgba(201,79,79,.5)',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'pulse 1s infinite' }} />
            {fmtElapsed(elapsed)}
          </div>
        )}

        {/* Main FAB */}
        <div onClick={() => {
          if (!running && !saving) { start(); }
          else { setOpen(true); }
        }} style={{
          width: 56, height: 56, borderRadius: '50%',
          background: running ? C.red : C.cream,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: `0 4px 20px ${running ? 'rgba(201,79,79,.5)' : 'rgba(0,0,0,.4)'}`,
          transition: 'all .2s', fontSize: 22,
          animation: running ? 'none' : 'none',
        }}>
          {running ? '⏸' : saving ? '💾' : '⏱'}
        </div>
      </div>

      {/* Timer panel */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 0 }}
          onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div style={{ background: C.surface, borderRadius: '16px 16px 0 0', padding: '28px 24px 40px', width: '100%', maxWidth: 480, boxShadow: '0 -20px 60px rgba(0,0,0,.5)' }}>

            {/* Handle bar */}
            <div style={{ width: 36, height: 4, background: C.border2, borderRadius: 2, margin: '0 auto 24px' }} />

            {/* Timer display */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: F.con, fontWeight: 900, fontSize: 52, letterSpacing: 2, color: running ? C.red : C.cream, lineHeight: 1 }}>
                {fmtElapsed(elapsed)}
              </div>
              <div style={{ fontFamily: F.con, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: C.muted, marginTop: 6 }}>
                {running ? 'Timer running' : saving ? 'Timer stopped — save your entry' : 'Ready to start'}
              </div>
            </div>

            {/* Controls */}
            {!saving ? (
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                {running
                  ? <Btn variant="red" size="lg" style={{ flex: 1 }} onClick={stop}>⏹ Stop Timer</Btn>
                  : <Btn size="lg" style={{ flex: 1 }} onClick={start}>▶ Start Timer</Btn>
                }
                {(running || elapsed > 0) && (
                  <Btn variant="secondary" onClick={reset}>Reset</Btn>
                )}
              </div>
            ) : (
              <>
                {/* Save form */}
                <div style={{ background: C.card, borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <Cap style={{ marginBottom: 0 }}>Hours logged</Cap>
                    <Inp type="number" step="0.25"
                      value={form.hours || ''} onChange={f('hours')}
                      style={{ width: 90, textAlign: 'center', fontSize: 18, fontWeight: 700, padding: '6px 8px' }}
                      containerStyle={{ marginBottom: 0 }} />
                  </div>
                  <Sel label="Team Member *" value={form.member_id || ''} onChange={f('member_id')}>
                    <option value="">Who worked?</option>
                    {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </Sel>
                  <Sel label="Project *" value={form.project_id || ''} onChange={f('project_id')}>
                    <option value="">Which project?</option>
                    {projects.filter(p => p.status === 'active').map(p => {
                      const c = clients.find(cl => cl.id === p.client_id);
                      return <option key={p.id} value={p.id}>{p.name} ({c?.name || '?'})</option>;
                    })}
                  </Sel>
                  <Inp label="Date" type="date" value={form.date} onChange={f('date')} containerStyle={{ marginBottom: 0 }} />
                  <Sel label="Work Type *" value={form.work_type || 'client_design'} onChange={f('work_type')}>
                    {WORK_TYPES.map(wt => <option key={wt.id} value={wt.id}>{wt.label}</option>)}
                  </Sel>
                  <Inp label="Notes (optional)" value={form.notes || ''} onChange={f('notes')} placeholder="What did you work on?" containerStyle={{ marginBottom: 0, marginTop: 12 }} />
                </div>

                {formError && (
                  <div style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: C.red, marginBottom: 12, padding: '8px 12px', background: 'rgba(201,79,79,.08)', border: '1px solid rgba(201,79,79,.2)', borderRadius: 4 }}>
                    {formError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <Btn variant="secondary" style={{ flex: 0 }} onClick={reset}>Discard</Btn>
                  <Btn variant="green" size="lg" style={{ flex: 1 }} onClick={save}>Save Time Entry ✓</Btn>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.3; } }
      `}</style>
    </>
  );
}

// ─── TIME LOG PAGE ────────────────────────────────────────────────
export function TimeLogPage({ logs, team, projects, clients, onAdd, onDelete, onDeleteMany, onNav, navData }) {
  const [modal,    setModal]   = useState(false);
  const [confirm,  setConfirm] = useState(null);  // { ids: [], label: '' }
  const [selected, setSelected] = useState(new Set());
  const [fMember,  setFM]      = useState('all');
  const [fProject, setFP]      = useState(navData?.projectId || 'all');
  const [form,     setForm]    = useState({ date: today(), hours: '', ...(navData?.projectId ? { project_id: navData.projectId } : {}) });
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const [saveError, setSaveError] = useState('');
  const save = async () => {
    if (!form.member_id) { setSaveError('Please select a team member.'); return; }
    if (!form.project_id) { setSaveError('Please select a project.'); return; }
    if (!form.hours || parseFloat(form.hours) <= 0) { setSaveError('Please enter valid hours.'); return; }
    setSaveError('');
    await onAdd({ ...form, hours: parseFloat(form.hours), billed: false });
    setModal(false);
    setForm({ date: today(), hours: '', work_type: 'client_design', ...(navData?.projectId ? { project_id: navData.projectId } : {}) });
  };

  const filtered = logs.filter(l =>
    (fMember  === 'all' || l.member_id  === fMember) &&
    (fProject === 'all' || l.project_id === fProject)
  );
  const totalH    = filtered.reduce((s, l) => s + (l.hours || 0), 0);
  const unbilledH = filtered.filter(l => !l.billed).reduce((s, l) => s + (l.hours || 0), 0);

  const toggleSelect = id => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(l => l.id)));
  };

  const confirmDelete = (ids, label) => setConfirm({ ids, label });

  const doDelete = async () => {
    if (!confirm) return;
    if (confirm.ids.length === 1) {
      await onDelete(confirm.ids[0]);
    } else {
      await onDeleteMany(confirm.ids);
    }
    setSelected(new Set());
    setConfirm(null);
  };

  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  return (
    <PageShell title="Time Log" onBack={() => onNav('dashboard')} action={<Btn onClick={() => setModal(true)}>+ Manual Entry</Btn>}>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
        <Sel value={fMember} onChange={e => setFM(e.target.value)} containerStyle={{ marginBottom: 0 }}>
          <option value="all">All members</option>
          {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </Sel>
        <Sel value={fProject} onChange={e => setFP(e.target.value)} containerStyle={{ marginBottom: 0 }}>
          <option value="all">All projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Sel>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '0 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, minHeight: 44 }}>
          <StatBox label="Total" value={fmtHrs(totalH)} />
          <StatBox label="Unbilled" value={fmtHrs(unbilledH)} color={unbilledH > 0 ? C.orange : C.green} />
        </div>
      </div>

      {/* Multi-select toolbar */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, marginBottom: 10 }}>
          {/* Select all checkbox */}
          <div onClick={toggleAll} style={{ width: 18, height: 18, borderRadius: 3, border: `2px solid ${allSelected ? C.cream : C.border2}`, background: allSelected ? C.cream : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {allSelected && <div style={{ width: 10, height: 10, background: C.bg, borderRadius: 1 }} />}
          </div>
          <span style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: C.label }}>
            {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
          </span>
          {selected.size > 0 && (
            <button onClick={() => confirmDelete([...selected], `${selected.size} time entr${selected.size === 1 ? 'y' : 'ies'}`)}
              style={{ marginLeft: 'auto', background: 'transparent', border: `1px solid rgba(201,79,79,.3)`, borderRadius: 3, padding: '4px 12px', fontFamily: F.con, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: C.red, cursor: 'pointer' }}>
              Delete {selected.size} selected
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? <Empty icon="◷" text="No time entries — use the ⏱ button to start tracking" /> :
        filtered.map(log => {
          const member  = team.find(m => m.id === log.member_id);
          const project = projects.find(p => p.id === log.project_id);
          const client  = clients.find(c => c.id === project?.client_id);
          const isSelected = selected.has(log.id);
          return (
            <div key={log.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', background: isSelected ? 'rgba(237,232,222,.04)' : C.card, border: `1px solid ${isSelected ? C.cream + '44' : C.border}`, borderRadius: 6, marginBottom: 6, flexWrap: 'wrap', transition: 'all .1s' }}>
              {/* Checkbox */}
              <div onClick={() => toggleSelect(log.id)} style={{ width: 18, height: 18, borderRadius: 3, border: `2px solid ${isSelected ? C.cream : C.border2}`, background: isSelected ? C.cream : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isSelected && <div style={{ width: 10, height: 10, background: C.bg, borderRadius: 1 }} />}
              </div>
              <Avatar name={member?.name || '?'} size={34} />
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontFamily: F.con, fontWeight: 700, fontSize: 12, color: C.cream, letterSpacing: 1, marginBottom: 2 }}>
                  {member?.name || 'Unknown'} <span style={{ color: C.muted, fontWeight: 400 }}>on</span> {project?.name || 'Unknown project'}
                </div>
                <div style={{ fontFamily: F.con, fontSize: 9, color: C.muted, letterSpacing: 1 }}>
                  {client?.name || ''}{log.notes ? ` · ${log.notes}` : ''} · {fmtDate(log.date)}
                </div>
              </div>
              <div style={{ fontFamily: F.con, fontWeight: 800, fontSize: 15, color: C.cream }}>{log.hours}h</div>
              {log.work_type && (() => { const wt = getWorkType(log.work_type); return <span style={{ fontFamily: F.con, fontSize: 8, letterSpacing: 1, padding: '2px 7px', borderRadius: 3, background: wt.color + '22', color: wt.color, border: `1px solid ${wt.color}44` }}>{wt.short}</span>; })()}
              <Badge status={log.billed ? 'billed' : 'unpaid'} />
              <Btn variant="danger" onClick={() => confirmDelete([log.id], '1 time entry')}>✕</Btn>
            </div>
          );
        })
      }

      {/* Manual entry modal */}
      {modal && (
        <Modal title="Manual Time Entry" onClose={() => setModal(false)}>
          <Sel label="Team Member *" value={form.member_id || ''} onChange={f('member_id')}>
            <option value="">Select member…</option>
            {team.map(m => <option key={m.id} value={m.id}>{m.name} — {m.role || 'Team'}</option>)}
          </Sel>
          <Sel label="Project *" value={form.project_id || ''} onChange={f('project_id')}>
            <option value="">Select project…</option>
            {projects.filter(p => p.status === 'active').map(p => {
              const c = clients.find(cl => cl.id === p.client_id);
              return <option key={p.id} value={p.id}>{p.name} ({c?.name || '?'})</option>;
            })}
          </Sel>
          <Row>
            <Inp label="Date *" type="date" value={form.date} onChange={f('date')} />
            <Inp label="Hours *" type="number" step="0.25" value={form.hours} onChange={f('hours')} placeholder="e.g. 3.5" />
          </Row>
          <Sel label="Work Type *" value={form.work_type || 'client_design'} onChange={f('work_type')}>
            {WORK_TYPES.map(wt => <option key={wt.id} value={wt.id}>{wt.label}</option>)}
          </Sel>
          <Inp label="Notes" value={form.notes || ''} onChange={f('notes')} placeholder="What was worked on?" />
          {saveError && (
            <div style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: C.red, marginBottom: 12, padding: '8px 12px', background: 'rgba(201,79,79,.08)', border: '1px solid rgba(201,79,79,.2)', borderRadius: 4 }}>
              {saveError}
            </div>
          )}
          <Row style={{ marginTop: 18 }}>
            <Btn variant="secondary" onClick={() => { setModal(false); setSaveError(''); }}>Cancel</Btn>
            <Btn onClick={save}>Save Entry</Btn>
          </Row>
        </Modal>
      )}

      {/* Confirm delete modal */}
      {confirm && (
        <ConfirmModal
          title="Delete Time Entries"
          message={`Are you sure you want to delete ${confirm.label}? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={doDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </PageShell>
  );
}

// ─── INVOICE PAGE ─────────────────────────────────────────────────
export function InvoicePage({ clients, team, projects, logs, invoices, onSave, onNav, navData }) {
  const [clientId,  setClientId]  = useState('');
  const [projectId, setProjectId] = useState(navData?.projectId || '');
  const [invNo,     setInvNo]     = useState(String((invoices?.length || 0) + 1).padStart(2, '0'));
  const [invDate,   setInvDate]   = useState(today());
  const [terms,     setTerms]     = useState('Net 30');
  const [gst,       setGst]       = useState(false);
  const [gstRate,   setGstRate]   = useState(18);
  const [extras,    setExtras]    = useState([]);
  const [preview,   setPreview]   = useState(false);

  useEffect(() => {
    if (projectId) {
      const proj = projects.find(p => p.id === projectId);
      if (proj) {
        setClientId(proj.client_id);
        const c = clients.find(x => x.id === proj.client_id);
        if (c?.terms) setTerms(c.terms);
      }
    }
  }, [projectId]);

  const client         = clients.find(c => c.id === clientId);
  const project        = projects.find(p => p.id === projectId);
  const clientProjects = projects.filter(p => p.client_id === clientId);
  const unbilledLogs   = project ? logs.filter(l => l.project_id === projectId && !l.billed) : [];

  const buildLines = () => {
    const ext = extras.map(l => ({ ...l, amount: parseFloat(l.amount) || 0 }));
    if (!project) return ext;
    if (project.type === 'fixed') return [{ title: project.name, desc: project.description || 'Fixed project fee', amount: parseFloat(project.amount) || 0 }, ...ext];
    const byMember = {};
    unbilledLogs.forEach(log => {
      const member = team.find(m => m.id === log.member_id);
      if (!member) return;
      const rate = parseFloat(member.rates?.[clientId]) || parseFloat(member.default_rate) || parseFloat(client?.default_rate) || 0;
      if (!byMember[log.member_id]) byMember[log.member_id] = { member, rate, hours: 0 };
      byMember[log.member_id].hours += log.hours;
    });
    return [...Object.values(byMember).map(({ member, rate, hours }) => ({
      title: member.name, desc: `${Math.round(hours * 10) / 10}h × ${fmtINR(rate)}/hr`, amount: hours * rate
    })), ...ext];
  };

  const lines    = buildLines();
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const gstAmt   = gst ? subtotal * gstRate / 100 : 0;
  const total    = subtotal + gstAmt;

  const addExtra = () => setExtras(p => [...p, { id: uid(), title: '', desc: '', amount: '' }]);
  const updExtra = (id, k, v) => setExtras(p => p.map(l => l.id === id ? { ...l, [k]: v } : l));
  const delExtra = id => setExtras(p => p.filter(l => l.id !== id));

  const saveInvoice = () => {
    if (!clientId || !projectId) return;
    onSave({
      client_id: clientId, client_name: client?.name || '—',
      project_id: projectId, project_name: project?.name || '',
      no: invNo, date: invDate, terms, subtotal, gst,
      gst_rate: gst ? gstRate : 0, total, status: 'unpaid', line_items: lines,
    }, unbilledLogs.map(l => l.id));
    onNav('dashboard');
  };

  return (
    <PageShell title="New Invoice" onBack={() => onNav('dashboard')}>
      {/* Stack on mobile, side-by-side on desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Sec title="Client & Project">
            <Sel label="Client" value={clientId} onChange={e => { setClientId(e.target.value); setProjectId(''); setPreview(false); }}>
              <option value="">Select client…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Sel>
            {clientId && (
              <Sel label="Project" value={projectId} onChange={e => { setProjectId(e.target.value); setPreview(false); }}>
                <option value="">Select project…</option>
                {clientProjects.map(p => <option key={p.id} value={p.id}>{p.name} — {p.type}</option>)}
              </Sel>
            )}
            {projectId && project?.type === 'hourly' && (
              <div style={{ padding: '10px 12px', borderRadius: 5, background: unbilledLogs.length > 0 ? 'rgba(82,184,122,.06)' : 'rgba(217,140,69,.06)', border: `1px solid ${unbilledLogs.length > 0 ? 'rgba(82,184,122,.2)' : 'rgba(217,140,69,.2)'}` }}>
                <div style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: unbilledLogs.length > 0 ? C.green : C.orange }}>
                  {unbilledLogs.length > 0
                    ? `${unbilledLogs.length} unbilled entries · ${fmtHrs(unbilledLogs.reduce((s, l) => s + l.hours, 0))} across ${new Set(unbilledLogs.map(l => l.member_id)).size} member(s)`
                    : 'No unbilled time entries for this project'
                  }
                </div>
              </div>
            )}
          </Sec>

          <Sec title="Invoice Details">
            <Row>
              <Inp label="Invoice No." value={invNo} onChange={e => setInvNo(e.target.value)} />
              <Inp label="Date" type="date" value={invDate} onChange={e => setInvDate(e.target.value)} />
            </Row>
            <Sel label="Payment Terms" value={terms} onChange={e => setTerms(e.target.value)}>
              {['Due on receipt','Net 7','Net 15','Net 30','Net 45','Net 60'].map(t => <option key={t}>{t}</option>)}
            </Sel>
          </Sec>

          {projectId && (
            <Sec title="Line Items">
              {lines.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontFamily: F.con, fontWeight: 700, fontSize: 12, color: C.cream }}>{item.title}</div>
                    <div style={{ fontFamily: F.con, fontSize: 9, color: C.label, marginTop: 1 }}>{item.desc}</div>
                  </div>
                  <div style={{ fontFamily: F.con, fontSize: 12, color: C.cream, flexShrink: 0, marginLeft: 12 }}>{fmtINR(item.amount)}</div>
                </div>
              ))}
              {extras.map(l => (
                <div key={l.id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 5, padding: 10, marginTop: 8, position: 'relative' }}>
                  <button onClick={() => delExtra(l.id)} style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13 }}>×</button>
                  <Inp placeholder="Line item title" value={l.title} onChange={e => updExtra(l.id, 'title', e.target.value)} style={{ marginBottom: 6 }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 8 }}>
                    <Inp placeholder="Description" value={l.desc} onChange={e => updExtra(l.id, 'desc', e.target.value)} />
                    <Inp type="number" placeholder="₹" value={l.amount} onChange={e => updExtra(l.id, 'amount', e.target.value)} />
                  </div>
                </div>
              ))}
              <button onClick={addExtra} style={{ marginTop: 10, width: '100%', background: 'transparent', border: `1px dashed ${C.border2}`, borderRadius: 4, padding: 8, fontFamily: F.con, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: C.muted, cursor: 'pointer' }}>
                + Extra Line Item
              </button>
            </Sec>
          )}

          <Sec title="Tax">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div onClick={() => setGst(!gst)} style={{ position: 'relative', width: 34, height: 20, borderRadius: 20, background: gst ? C.cream : C.border2, cursor: 'pointer', transition: '.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: gst ? C.bg : C.muted, top: 3, left: gst ? 17 : 3, transition: '.2s' }} />
              </div>
              <Cap style={{ marginBottom: 0, cursor: 'pointer' }} onClick={() => setGst(!gst)}>Apply GST</Cap>
              {gst && <Inp type="number" value={gstRate} onChange={e => setGstRate(parseFloat(e.target.value))} style={{ width: 70, marginLeft: 'auto' }} containerStyle={{ marginBottom: 0 }} />}
            </div>
          </Sec>

          {projectId && (
            <Sec>
              {[['Subtotal', fmtINR(subtotal)], ['Tax (GST)', gst ? `${fmtINR(gstAmt)} (${gstRate}%)` : 'NA'], ['Total', fmtINR(total)]].map(([l, v], i) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < 2 ? `1px solid ${C.border}` : 'none' }}>
                  <Cap style={{ marginBottom: 0, fontSize: i === 2 ? 10 : 9, fontWeight: i === 2 ? 800 : 600 }}>{l}</Cap>
                  <div style={{ fontFamily: F.con, fontWeight: i === 2 ? 800 : 400, fontSize: i === 2 ? 16 : 12, color: i === 2 ? C.cream : C.text }}>{v}</div>
                </div>
              ))}
            </Sec>
          )}

          <div style={{ padding: 18 }}>
            <Btn style={{ width: '100%' }} onClick={() => { if (!clientId || !projectId) return; setPreview(true); }}>
              Preview Invoice →
            </Btn>
          </div>
        </Card>

        {/* Preview */}
        <div>
          {!preview
            ? <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 48, textAlign: 'center', opacity: .2 }}>
                <Cap>Select client and project to preview</Cap>
              </div>
            : <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <Cap style={{ marginBottom: 0 }}>Preview</Cap>
                  <Btn variant="green" onClick={saveInvoice}>Save &amp; Mark Billed ✓</Btn>
                </div>
                <InvoiceRender client={client} invNo={invNo} invDate={invDate}
                  lines={lines} subtotal={subtotal} gst={gst} gstRate={gstRate}
                  gstAmt={gstAmt} total={total} due={calcDueDate(invDate, terms)} />
              </>
          }
        </div>
      </div>
    </PageShell>
  );
}

// ─── INVOICE RENDER ───────────────────────────────────────────────
export function InvoiceRender({ client, invNo, invDate, lines, subtotal, gst, gstRate, gstAmt, total, due }) {
  const INV = { bg: '#EDE8DE', black: '#0C0C0C', gray: '#888', light: '#C8C2B8' };
  return (
    <div style={{ background: INV.bg, borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 70px rgba(0,0,0,.6)' }}>
      <div style={{ background: INV.black, padding: '20px 24px 16px' }}>
        <div style={{ fontFamily: F.con, fontWeight: 900, fontSize: 'clamp(32px,8vw,60px)', lineHeight: .88, letterSpacing: -1.5, color: INV.bg, textTransform: 'uppercase' }}>ALTR COLLECTIVE</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 11, flexWrap: 'wrap', gap: 4 }}>
          <span style={{ fontFamily: F.con, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: INV.bg }}>FOR: <strong>{client?.name || '—'}</strong></span>
          <span style={{ fontFamily: F.con, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: INV.bg }}>DATE: <strong>{fmtDateLong(invDate)}</strong></span>
        </div>
      </div>
      <div style={{ padding: '22px 24px 0', color: INV.black }}>
        <div style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 3, color: INV.gray, marginBottom: 4 }}>INVOICE NO: <strong style={{ color: INV.black }}>{String(invNo).padStart(2, '0')}</strong></div>
        <div style={{ borderTop: `1px solid ${INV.black}`, margin: '5px 0 12px' }} />
        <div style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: INV.gray, marginBottom: 16 }}>{due}</div>
        {lines.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
            <div>
              <div style={{ fontFamily: F.body, fontWeight: 700, fontSize: 13, color: INV.black }}>{(item.title || '').toUpperCase()}</div>
              <div style={{ fontFamily: F.body, fontWeight: 300, fontSize: 11, color: INV.black }}>{item.desc}</div>
            </div>
            <div style={{ fontFamily: F.con, fontSize: 13, color: INV.black, whiteSpace: 'nowrap' }}>{fmtINR(item.amount)}</div>
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${INV.light}`, margin: '8px 0 6px' }} />
        {[['SUBTOTAL', fmtINR(subtotal), false], ['TAX (GST)', gst ? `${fmtINR(gstAmt)} (${gstRate}%)` : 'NA', false], ['TOTAL', fmtINR(total), true]].map(([l, v, bold]) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
            <span style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: INV.black, fontWeight: bold ? 700 : 400 }}>{l}</span>
            <span style={{ fontFamily: F.con, fontSize: bold ? 14 : 12, color: INV.black, fontWeight: bold ? 700 : 400 }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '16px 24px', borderTop: `1px solid ${INV.black}`, marginTop: 16 }}>
        <div style={{ fontFamily: F.con, fontWeight: 700, fontSize: 20, textTransform: 'uppercase', color: INV.black, marginBottom: 10 }}>PAYMENT</div>
        {[['ACCOUNT HOLDER','ALTR COLLECTIVE'],['ACCOUNT NO.','5020 0111 0781 68'],['BRANCH','BORIVALI, SHIMPOLI'],['IFSC','HDFC0000546']].map(([k, v]) => (
          <div key={k} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', marginBottom: 4 }}>
            <span style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: INV.gray }}>{k}</span>
            <span style={{ fontFamily: F.con, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: INV.black }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 24px', borderTop: `1px solid ${INV.black}` }}>
        <span style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: INV.black }}>ALTR COLLECTIVE</span>
        <span style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: INV.black }}>MUMBAI</span>
      </div>
    </div>
  );
}
