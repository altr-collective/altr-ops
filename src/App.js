import { useState, useEffect, useCallback } from 'react';
import { db } from './lib/supabase';
import { C, F } from './lib/utils';
import { Cap, Toast } from './components/UI';
import Dashboard from './pages/Dashboard';
import { ClientsPage, TeamPage, ProjectsPage } from './pages/ClientsTeamProjects';
import { TimeLogPage, InvoicePage } from './pages/TimeLogInvoice';

export default function App() {
  const [screen,   setScreen]   = useState('dashboard');
  const [navData,  setNavData]  = useState({});
  const [clients,  setClients]  = useState([]);
  const [team,     setTeam]     = useState([]);
  const [projects, setProjects] = useState([]);
  const [logs,     setLogs]     = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);

  // ── Load all data on mount ──────────────────────────────────────
  useEffect(() => {
    Promise.all([
      db.getAll('clients'),
      db.getAll('team'),
      db.getAll('projects'),
      db.getAll('logs'),
      db.getAll('invoices'),
    ]).then(([c, t, p, l, i]) => {
      setClients(c); setTeam(t); setProjects(p); setLogs(l); setInvoices(i);
      setLoading(false);
    });
  }, []);

  const notify = useCallback((msg, type = '') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const onNav = useCallback((s, data = {}) => {
    setScreen(s);
    setNavData(data);
  }, []);

  // ── CRUD handlers ───────────────────────────────────────────────
  const addClient = async row => {
    const r = await db.insert('clients', row);
    if (r) { setClients(p => [r, ...p]); notify('Client added', 'ok'); }
  };
  const editClient = async row => {
    const r = await db.update('clients', row.id, row);
    if (r) { setClients(p => p.map(x => x.id === r.id ? r : x)); notify('Client updated', 'ok'); }
  };
  const deleteClient = async id => {
    await db.remove('clients', id);
    setClients(p => p.filter(x => x.id !== id)); notify('Client removed');
  };

  const addTeam = async row => {
    const r = await db.insert('team', row);
    if (r) { setTeam(p => [r, ...p]); notify('Member added', 'ok'); }
  };
  const editTeam = async row => {
    const r = await db.update('team', row.id, row);
    if (r) { setTeam(p => p.map(x => x.id === r.id ? r : x)); notify('Member updated', 'ok'); }
  };
  const deleteTeam = async id => {
    await db.remove('team', id);
    setTeam(p => p.filter(x => x.id !== id)); notify('Member removed');
  };

  const addProject = async row => {
    const r = await db.insert('projects', row);
    if (r) { setProjects(p => [r, ...p]); notify('Project saved', 'ok'); }
  };
  const editProject = async row => {
    const r = await db.update('projects', row.id, row);
    if (r) { setProjects(p => p.map(x => x.id === r.id ? r : x)); notify('Project updated', 'ok'); }
  };
  const deleteProject = async id => {
    await db.remove('projects', id);
    setProjects(p => p.filter(x => x.id !== id)); notify('Project removed');
  };

  const addLog = async row => {
    const r = await db.insert('logs', row);
    if (r) { setLogs(p => [r, ...p]); notify('Time logged', 'ok'); }
  };
  const deleteLog = async id => {
    await db.remove('logs', id);
    setLogs(p => p.filter(x => x.id !== id)); notify('Entry removed');
  };

  const saveInvoice = async (invoiceRow, billedLogIds) => {
    const r = await db.insert('invoices', invoiceRow);
    if (r) {
      setInvoices(p => [r, ...p]);
      if (billedLogIds?.length) {
        await db.updateMany('logs', billedLogIds, { billed: true });
        setLogs(p => p.map(l => billedLogIds.includes(l.id) ? { ...l, billed: true } : l));
      }
      notify('Invoice saved', 'ok');
    }
  };

  const markInvoice = async (id, status) => {
    const r = await db.update('invoices', id, { status });
    if (r) { setInvoices(p => p.map(x => x.id === r.id ? r : x)); notify(`Marked as ${status}`, 'ok'); }
  };

  // ── Shared props ────────────────────────────────────────────────
  const shared = { clients, team, projects, logs, invoices, onNav, navData };

  if (loading) return (
    <div style={{ background: C.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&display=swap');`}</style>
      <Cap style={{ fontSize: 11, letterSpacing: 5, color: C.label, marginBottom: 0 }}>Loading workspace…</Cap>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: F.body, color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;600;700;800;900&family=Barlow:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-thumb { background: #2e2e2e; border-radius: 2px; }
        input::placeholder, textarea::placeholder { color: #333; }
        select option { background: #161616; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(.3); }
        button { cursor: pointer; }
      `}</style>

      {screen === 'dashboard' && (
        <Dashboard {...shared} onMarkInvoice={markInvoice} />
      )}
      {screen === 'clients' && (
        <ClientsPage {...shared} onAdd={addClient} onEdit={editClient} onDelete={deleteClient} />
      )}
      {screen === 'team' && (
        <TeamPage {...shared} onAdd={addTeam} onEdit={editTeam} onDelete={deleteTeam} />
      )}
      {screen === 'projects' && (
        <ProjectsPage {...shared} onAdd={addProject} onEdit={editProject} onDelete={deleteProject} />
      )}
      {screen === 'timelog' && (
        <TimeLogPage {...shared} onAdd={addLog} onDelete={deleteLog} />
      )}
      {screen === 'invoice' && (
        <InvoicePage {...shared} onSave={saveInvoice} />
      )}

      {toast && <Toast {...toast} />}
    </div>
  );
}
