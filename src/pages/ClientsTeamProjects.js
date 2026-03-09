import { useState } from 'react';
import { C, F, fmtINR, fmtHrs, uid } from '../lib/utils';
import { Cap, Inp, Sel, Btn, Badge, Card, Modal, Divider, Row, PageShell, Empty, Avatar, StatBox, Pill } from '../components/UI';

// ─── CLIENTS ──────────────────────────────────────────────────────
export function ClientsPage({ clients, team, invoices, onAdd, onEdit, onDelete, onNav }) {
  const [modal, setModal] = useState(null);
  const [form, setForm]   = useState({});
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const save = () => {
    if (!form.name?.trim()) return;
    const entry = { ...form, name: form.name.trim().toUpperCase() };
    modal === 'edit' ? onEdit(entry) : onAdd({ ...entry, id: uid() });
    setModal(null);
  };

  return (
    <PageShell title="Clients" onBack={() => onNav('dashboard')} action={<Btn onClick={() => { setForm({ terms: 'Net 30' }); setModal('add'); }}>+ Add Client</Btn>}>
      {clients.length === 0 ? <Empty icon="◎" text="No clients yet" /> :
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
          {clients.map(c => {
            const invCount = invoices.filter(i => i.client_id === c.id).length;
            const memberCount = team.filter(m => m.rates?.[c.id]).length;
            return (
              <Card key={c.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: F.con, fontWeight: 800, fontSize: 16, letterSpacing: .5, textTransform: 'uppercase', color: C.cream, marginBottom: 3 }}>{c.name}</div>
                    <div style={{ fontFamily: F.con, fontSize: 10, color: C.label, letterSpacing: 1 }}>{c.email || 'No email'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <Btn variant="ghost" onClick={() => { setForm({ ...c }); setModal('edit'); }}>Edit</Btn>
                    <Btn variant="danger" onClick={() => onDelete(c.id)}>✕</Btn>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {c.terms && <Pill>{c.terms}</Pill>}
                  {c.default_rate && <Pill>₹{c.default_rate}/hr default</Pill>}
                  {c.notes && <Pill>{c.notes}</Pill>}
                </div>
                <Divider style={{ margin: '10px 0' }} />
                <div style={{ display: 'flex', gap: 20 }}>
                  <div><Cap style={{ marginBottom: 2, fontSize: 8 }}>Invoices</Cap><div style={{ fontFamily: F.con, fontWeight: 700, fontSize: 14, color: C.cream }}>{invCount}</div></div>
                  <div><Cap style={{ marginBottom: 2, fontSize: 8 }}>Members</Cap><div style={{ fontFamily: F.con, fontWeight: 700, fontSize: 14, color: C.cream }}>{memberCount}</div></div>
                </div>
              </Card>
            );
          })}
        </div>
      }
      {modal && (
        <Modal title={modal === 'edit' ? 'Edit Client' : 'Add Client'} onClose={() => setModal(null)}>
          <Inp label="Name *" value={form.name || ''} onChange={f('name')} placeholder="CLIENT NAME" />
          <Inp label="Email" type="email" value={form.email || ''} onChange={f('email')} placeholder="client@company.com" />
          <Row>
            <Sel label="Default Terms" value={form.terms || 'Net 30'} onChange={f('terms')}>
              {['Due on receipt','Net 7','Net 15','Net 30','Net 45','Net 60'].map(t => <option key={t}>{t}</option>)}
            </Sel>
            <Inp label="Default Rate (₹/hr)" type="number" value={form.default_rate || ''} onChange={f('default_rate')} placeholder="0" />
          </Row>
          <Inp label="Notes" value={form.notes || ''} onChange={f('notes')} placeholder="e.g. GST exempt" />
          <Row style={{ marginTop: 18 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={save}>Save Client</Btn>
          </Row>
        </Modal>
      )}
    </PageShell>
  );
}

// ─── TEAM ─────────────────────────────────────────────────────────
export function TeamPage({ team, clients, logs, onAdd, onEdit, onDelete, onNav }) {
  const [modal, setModal]  = useState(null);
  const [rateM, setRateM]  = useState(null);
  const [form, setForm]    = useState({});
  const [rateForm, setRF]  = useState({});
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const save = () => {
    if (!form.name?.trim()) return;
    const entry = { ...form, name: form.name.trim(), rates: form.rates || {} };
    modal === 'edit' ? onEdit(entry) : onAdd({ ...entry, id: uid() });
    setModal(null);
  };

  const openRates = m => {
    setRateM(m);
    const rf = {};
    clients.forEach(c => { rf[c.id] = m.rates?.[c.id] || ''; });
    setRF(rf);
  };

  const saveRates = () => {
    const rates = {};
    clients.forEach(c => { if (rateForm[c.id] !== '') rates[c.id] = parseFloat(rateForm[c.id]) || 0; });
    onEdit({ ...rateM, rates });
    setRateM(null);
  };

  return (
    <PageShell title="Team" onBack={() => onNav('dashboard')} action={<Btn onClick={() => { setForm({ role: 'Designer' }); setModal('add'); }}>+ Add Member</Btn>}>
      {team.length === 0 ? <Empty icon="◈" text="No team members yet" /> :
        team.map(m => {
          const mLogs     = logs.filter(l => l.member_id === m.id);
          const totalH    = mLogs.reduce((s, l) => s + (l.hours || 0), 0);
          const unbilledH = mLogs.filter(l => !l.billed).reduce((s, l) => s + (l.hours || 0), 0);
          const rateCount = Object.keys(m.rates || {}).length;
          return (
            <Card key={m.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <Avatar name={m.name} size={44} />
                  <div>
                    <div style={{ fontFamily: F.con, fontWeight: 800, fontSize: 16, color: C.cream, marginBottom: 3 }}>{m.name}</div>
                    <div style={{ fontFamily: F.con, fontSize: 10, color: C.label, letterSpacing: 1 }}>
                      {m.role || '—'}{m.default_rate ? ` · ₹${m.default_rate}/hr default` : ''}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn variant="ghost" onClick={() => openRates(m)}>Client Rates</Btn>
                  <Btn variant="ghost" onClick={() => { setForm({ ...m }); setModal('edit'); }}>Edit</Btn>
                  <Btn variant="danger" onClick={() => onDelete(m.id)}>✕</Btn>
                </div>
              </div>
              <Divider />
              <div style={{ display: 'flex', gap: 28 }}>
                <StatBox label="Total Hours" value={fmtHrs(totalH)} />
                <StatBox label="Unbilled" value={fmtHrs(unbilledH)} color={unbilledH > 0 ? C.orange : C.green} />
                <StatBox label="Client Rates Set" value={rateCount} />
              </div>
            </Card>
          );
        })
      }

      {modal && (
        <Modal title={modal === 'edit' ? 'Edit Member' : 'Add Member'} onClose={() => setModal(null)}>
          <Inp label="Full Name *" value={form.name || ''} onChange={f('name')} placeholder="e.g. Priya Sharma" />
          <Row>
            <Inp label="Role" value={form.role || ''} onChange={f('role')} placeholder="e.g. Designer" />
            <Inp label="Default Rate (₹/hr)" type="number" value={form.default_rate || ''} onChange={f('default_rate')} placeholder="0" />
          </Row>
          <Row style={{ marginTop: 18 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={save}>Save</Btn>
          </Row>
        </Modal>
      )}

      {rateM && (
        <Modal title={`${rateM.name} — Client Rates`} onClose={() => setRateM(null)}>
          <div style={{ fontFamily: F.con, fontSize: 10, color: C.label, letterSpacing: 2, marginBottom: 16 }}>Override this member's rate per client. Leave blank to use their default.</div>
          {clients.length === 0
            ? <div style={{ fontFamily: F.con, fontSize: 11, color: C.muted }}>No clients yet</div>
            : clients.map(c => (
                <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: F.con, fontWeight: 700, fontSize: 12, color: C.cream }}>{c.name}</div>
                    {c.default_rate && <div style={{ fontFamily: F.con, fontSize: 9, color: C.muted }}>Client default: ₹{c.default_rate}/hr</div>}
                  </div>
                  <Inp type="number" style={{ width: 110, marginBottom: 0 }} placeholder="₹/hr"
                    value={rateForm[c.id] || ''} onChange={e => setRF(p => ({ ...p, [c.id]: e.target.value }))}
                    containerStyle={{ marginBottom: 0 }} />
                </div>
              ))
          }
          <Row style={{ marginTop: 20 }}>
            <Btn variant="secondary" onClick={() => setRateM(null)}>Cancel</Btn>
            <Btn onClick={saveRates}>Save Rates</Btn>
          </Row>
        </Modal>
      )}
    </PageShell>
  );
}

// ─── PROJECTS ─────────────────────────────────────────────────────
export function ProjectsPage({ projects, clients, logs, onAdd, onEdit, onDelete, onNav }) {
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState({});
  const [filter, setFilter] = useState('active');
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const save = () => {
    if (!form.name?.trim() || !form.client_id) return;
    const entry = { ...form, name: form.name.trim() };
    modal === 'edit' ? onEdit(entry) : onAdd({ ...entry, id: uid() });
    setModal(null);
  };

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  return (
    <PageShell title="Projects" onBack={() => onNav('dashboard')} action={<Btn onClick={() => { setForm({ type: 'hourly', status: 'active' }); setModal('add'); }}>+ New Project</Btn>}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {['all','active','completed','archived'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ background: filter === f ? C.cream : 'transparent', border: `1px solid ${filter === f ? C.cream : C.border2}`, borderRadius: 3, padding: '3px 10px', fontFamily: F.con, fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: filter === f ? C.bg : C.muted, cursor: 'pointer' }}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? <Empty icon="◇" text="No projects" /> :
        filtered.map(proj => {
          const client     = clients.find(c => c.id === proj.client_id);
          const projLogs   = logs.filter(l => l.project_id === proj.id);
          const totalH     = projLogs.reduce((s, l) => s + (l.hours || 0), 0);
          const unbilledH  = projLogs.filter(l => !l.billed).reduce((s, l) => s + (l.hours || 0), 0);
          return (
            <Card key={proj.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: F.con, fontWeight: 800, fontSize: 16, color: C.cream, marginBottom: 5 }}>{proj.name}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontFamily: F.con, fontSize: 10, color: C.label, letterSpacing: 1 }}>{client?.name || 'Unknown client'}</div>
                    <Badge status={proj.type} />
                    <Badge status={proj.status} />
                    {proj.type === 'fixed' && proj.amount && <div style={{ fontFamily: F.con, fontSize: 10, color: C.purple }}>Budget: {fmtINR(proj.amount)}</div>}
                  </div>
                  {proj.description && <div style={{ fontFamily: F.body, fontSize: 11, color: C.muted, marginTop: 6 }}>{proj.description}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                  <Btn variant="ghost" onClick={() => onNav('invoice', { projectId: proj.id })}>Invoice →</Btn>
                  <Btn variant="ghost" onClick={() => onNav('timelog', { projectId: proj.id })}>Log Time</Btn>
                  <Btn variant="ghost" onClick={() => { setForm({ ...proj }); setModal('edit'); }}>Edit</Btn>
                  <Btn variant="danger" onClick={() => onDelete(proj.id)}>✕</Btn>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 28 }}>
                <StatBox label="Total Hours" value={fmtHrs(totalH)} />
                <StatBox label="Unbilled" value={fmtHrs(unbilledH)} color={unbilledH > 0 ? C.orange : C.green} />
                <StatBox label="Entries" value={projLogs.length} />
              </div>
            </Card>
          );
        })
      }

      {modal && (
        <Modal title={modal === 'edit' ? 'Edit Project' : 'New Project'} onClose={() => setModal(null)}>
          <Inp label="Project Name *" value={form.name || ''} onChange={f('name')} placeholder="e.g. Udarta Brand Collaterals" />
          <Sel label="Client *" value={form.client_id || ''} onChange={f('client_id')}>
            <option value="">Select client…</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Sel>
          <Row>
            <Sel label="Billing Type" value={form.type || 'hourly'} onChange={f('type')}>
              <option value="hourly">Hourly</option>
              <option value="fixed">Fixed Amount</option>
            </Sel>
            <Sel label="Status" value={form.status || 'active'} onChange={f('status')}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </Sel>
          </Row>
          {form.type === 'fixed' && <Inp label="Fixed Amount (₹)" type="number" value={form.amount || ''} onChange={f('amount')} placeholder="0" />}
          <Inp label="Description (optional)" value={form.description || ''} onChange={f('description')} placeholder="Brief project description" />
          <Row style={{ marginTop: 18 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={save}>Save Project</Btn>
          </Row>
        </Modal>
      )}
    </PageShell>
  );
}
