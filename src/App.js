import { useState, useEffect, useCallback } from 'react';
import { db } from './lib/supabase';
import { useAuth } from './auth/useAuth';
import { C, F } from './lib/utils';
import { Cap, Toast } from './components/UI';
import LoginPage from './auth/LoginPage';
import Dashboard from './pages/Dashboard';
import { ClientsPage, TeamPage, ProjectsPage } from './pages/ClientsTeamProjects';
import { TimeLogPage, InvoicePage, FloatingTimer } from './pages/TimeLogInvoice';

export default function App() {
  const { user, profile, loading: authLoading, signOut, isAdmin } = useAuth();

  const [screen,   setScreen]   = useState('dashboard');
  const [navData,  setNavData]  = useState({});
  const [clients,  setClients]  = useState([]);
  const [team,     setTeam]     = useState([]);
  const [projects, setProjects] = useState([]);
  const [logs,     setLogs]     = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [toast,    setToast]    = useState(null);
  const [userMenu, setUserMenu] = useState(false);

  // Load data when user is authenticated
  useEffect(() => {
    if (!user) { setDataLoading(false); return; }
    setDataLoading(true);
    Promise.all([
      db.getAll('clients'),
      db.getAll('team'),
      db.getAll('projects'),
      db.getAll('logs'),
      db.getAll('invoices'),
    ]).then(([c, t, p, l, i]) => {
      setClients(c); setTeam(t); setProjects(p); setLogs(l); setInvoices(i);
      setDataLoading(false);
    });
  }, [user]);

  const notify = useCallback((msg, type = '') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const onNav = useCallback((s, data = {}) => {
    setScreen(s);
    setNavData(data);
    setUserMenu(false);
  }, []);

  // ── CRUD handlers ───────────────────────────────────────────────
  const addClient    = async r => { const d = await db.insert('clients', r);  if (d) { setClients(p=>[d,...p]);  notify('Client added','ok'); } };
  const editClient   = async r => { const d = await db.update('clients',  r.id, r); if (d) { setClients(p=>p.map(x=>x.id===d.id?d:x));  notify('Client updated','ok'); } };
  const deleteClient = async id => { await db.remove('clients',  id); setClients(p=>p.filter(x=>x.id!==id)); notify('Client removed'); };

  const addTeam    = async r => { const d = await db.insert('team', r);  if (d) { setTeam(p=>[d,...p]);  notify('Member added','ok'); } };
  const editTeam   = async r => { const d = await db.update('team',  r.id, r); if (d) { setTeam(p=>p.map(x=>x.id===d.id?d:x));  notify('Member updated','ok'); } };
  const deleteTeam = async id => { await db.remove('team',  id); setTeam(p=>p.filter(x=>x.id!==id)); notify('Member removed'); };

  const addProject    = async r => { const d = await db.insert('projects', r);  if (d) { setProjects(p=>[d,...p]);  notify('Project saved','ok'); } };
  const editProject   = async r => { const d = await db.update('projects',  r.id, r); if (d) { setProjects(p=>p.map(x=>x.id===d.id?d:x));  notify('Project updated','ok'); } };
  const deleteProject = async id => { await db.remove('projects', id); setProjects(p=>p.filter(x=>x.id!==id)); notify('Project removed'); };

  const addLog    = async r => { const d = await db.insert('logs', r); if (d) { setLogs(p=>[d,...p]); notify('Time logged','ok'); } };
  const deleteLog = async id => { await db.remove('logs', id); setLogs(p=>p.filter(x=>x.id!==id)); notify('Entry removed'); };

  const saveInvoice = async (invoiceRow, billedLogIds) => {
    const d = await db.insert('invoices', invoiceRow);
    if (d) {
      setInvoices(p=>[d,...p]);
      if (billedLogIds?.length) {
        await db.updateMany('logs', billedLogIds, { billed: true });
        setLogs(p=>p.map(l=>billedLogIds.includes(l.id)?{...l,billed:true}:l));
      }
      notify('Invoice saved','ok');
    }
  };

  const markInvoice = async (id, status) => {
    const d = await db.update('invoices', id, { status });
    if (d) { setInvoices(p=>p.map(x=>x.id===d.id?d:x)); notify(`Marked as ${status}`,'ok'); }
  };

  // ── Loading states ──────────────────────────────────────────────
  const globalLoading = authLoading || (user && dataLoading);

  if (globalLoading) return (
    <div style={{ background: C.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&display=swap');`}</style>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 18, letterSpacing: 4, textTransform: 'uppercase', color: '#EDE8DE' }}>ALTR COLLECTIVE</div>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#444' }}>Loading workspace…</div>
    </div>
  );

  // ── Not authenticated — show login ──────────────────────────────
  if (!user) return <LoginPage />;

  // ── Authenticated ───────────────────────────────────────────────
  const shared = { clients, team, projects, logs, invoices, onNav, navData, isAdmin };

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
        html { font-size: 16px; }
        @media (max-width: 600px) { input, select { font-size: 16px !important; } }
      `}</style>

      {/* Top Nav Bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 24px', height: 48,
      }}>
        <div
          onClick={() => onNav('dashboard')}
          style={{ fontFamily: F.con, fontWeight: 900, fontSize: 13, letterSpacing: 4, textTransform: 'uppercase', color: C.cream, cursor: 'pointer' }}
        >
          ALTR COLLECTIVE
        </div>

        {/* Nav links — admin only sees full menu */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {isAdmin && (
            <>
              {['clients','team','projects'].map(s => (
                <button key={s} onClick={() => onNav(s)}
                  style={{ background: screen===s?C.border:'transparent', border:'none', borderRadius:3, padding:'5px 12px', fontFamily:F.con, fontSize:9, letterSpacing:3, textTransform:'uppercase', color:screen===s?C.cream:C.label, cursor:'pointer' }}>
                  {s}
                </button>
              ))}
            </>
          )}
          <button onClick={() => onNav('timelog')}
            style={{ background: screen==='timelog'?C.border:'transparent', border:'none', borderRadius:3, padding:'5px 12px', fontFamily:F.con, fontSize:9, letterSpacing:3, textTransform:'uppercase', color:screen==='timelog'?C.cream:C.label, cursor:'pointer' }}>
            Time Log
          </button>
          {isAdmin && (
            <button onClick={() => onNav('invoice')}
              style={{ background: screen==='invoice'?C.border:'transparent', border:'none', borderRadius:3, padding:'5px 12px', fontFamily:F.con, fontSize:9, letterSpacing:3, textTransform:'uppercase', color:screen==='invoice'?C.cream:C.label, cursor:'pointer' }}>
              Invoice
            </button>
          )}
        </div>

        {/* User menu */}
        <div style={{ position: 'relative' }}>
          <div onClick={() => setUserMenu(!userMenu)} style={{
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            padding: '5px 10px', borderRadius: 4,
            background: userMenu ? C.border : 'transparent',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', background: C.border2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: F.con, fontWeight: 800, fontSize: 11, color: C.cream,
            }}>
              {(profile?.name || profile?.email || 'U')[0].toUpperCase()}
            </div>
            <div style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: C.label }}>
              {profile?.role || 'member'}
            </div>
          </div>

          {userMenu && (
            <div style={{
              position: 'absolute', right: 0, top: '110%',
              background: C.surface, border: `1px solid ${C.border2}`,
              borderRadius: 6, padding: 8, minWidth: 180,
              boxShadow: '0 8px 24px rgba(0,0,0,.4)', zIndex: 200,
            }}>
              <div style={{ padding: '6px 12px', borderBottom: `1px solid ${C.border}`, marginBottom: 4 }}>
                <div style={{ fontFamily: F.con, fontSize: 11, color: C.cream, letterSpacing: 1 }}>{profile?.name || 'Team Member'}</div>
                <div style={{ fontFamily: F.con, fontSize: 9, color: C.label, marginTop: 2 }}>{profile?.email || user?.email}</div>
              </div>
              <button onClick={signOut} style={{
                width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                padding: '8px 12px', fontFamily: F.con, fontSize: 10, letterSpacing: 3,
                textTransform: 'uppercase', color: C.red, cursor: 'pointer', borderRadius: 3,
              }}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close user menu */}
      {userMenu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setUserMenu(false)} />
      )}

      {/* Screen routing */}
      {screen === 'dashboard' && <Dashboard {...shared} onMarkInvoice={markInvoice} />}

      {screen === 'clients' && isAdmin && (
        <ClientsPage {...shared} onAdd={addClient} onEdit={editClient} onDelete={deleteClient} />
      )}
      {screen === 'team' && isAdmin && (
        <TeamPage {...shared} onAdd={addTeam} onEdit={editTeam} onDelete={deleteTeam} />
      )}
      {screen === 'projects' && isAdmin && (
        <ProjectsPage {...shared} onAdd={addProject} onEdit={editProject} onDelete={deleteProject} />
      )}
      {screen === 'timelog' && (
        <TimeLogPage {...shared} onAdd={addLog} onDelete={deleteLog} />
      )}
      {screen === 'invoice' && isAdmin && (
        <InvoicePage {...shared} onSave={saveInvoice} />
      )}

      {/* Access denied for non-admins on restricted screens */}
      {!isAdmin && ['clients','team','projects','invoice'].includes(screen) && (
        <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 32px', textAlign: 'center' }}>
          <div style={{ fontFamily: F.con, fontWeight: 900, fontSize: 48, color: C.border2, marginBottom: 16 }}>◎</div>
          <div style={{ fontFamily: F.con, fontWeight: 800, fontSize: 20, letterSpacing: 1, textTransform: 'uppercase', color: C.cream, marginBottom: 8 }}>Access Restricted</div>
          <div style={{ fontFamily: F.con, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: C.label, marginBottom: 24 }}>This section is for admins only.</div>
          <button onClick={() => onNav('dashboard')} style={{ background: C.cream, border: 'none', borderRadius: 4, padding: '10px 24px', fontFamily: F.con, fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: C.bg, cursor: 'pointer' }}>← Back to Dashboard</button>
        </div>
      )}

      {/* Floating timer — always visible */}
      <FloatingTimer team={team} projects={projects} clients={clients} onAdd={addLog} />

      {toast && <Toast {...toast} />}
    </div>
  );
}
