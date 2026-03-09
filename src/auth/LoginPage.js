import { useState } from 'react';
import { C, F } from '../lib/utils';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) { setError('Please enter your username and password.'); return; }
    setLoading(true);
    setError('');
    const ok = onLogin(username, password);
    if (!ok) {
      setError('Incorrect username or password.');
      setLoading(false);
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: F.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;600;700;800;900&family=Barlow:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #333; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #161616 inset !important;
          -webkit-text-fill-color: #EDE8DE !important;
        }
        .login-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          max-width: 1100px;
          margin: 0 auto;
          width: 100%;
          padding: 0 40px;
          gap: 80px;
          align-items: center;
        }
        .login-brand { padding: 60px 0; }
        @media (max-width: 720px) {
          .login-grid { grid-template-columns: 1fr; gap: 0; padding: 20px; }
          .login-brand { display: none; }
        }
        @media (max-width: 600px) { input { font-size: 16px !important; } }
      `}</style>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: F.con, fontWeight: 900, fontSize: 16, letterSpacing: 4, textTransform: 'uppercase', color: C.cream }}>ALTR COLLECTIVE</div>
        <div style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: C.label }}>OPS PORTAL</div>
      </div>

      <div className="login-grid">

        {/* Left — brand */}
        <div className="login-brand">
          <div style={{ fontFamily: F.con, fontWeight: 900, fontSize: 'clamp(52px,7vw,88px)', lineHeight: 0.88, letterSpacing: -2, textTransform: 'uppercase', color: C.cream, marginBottom: 28 }}>
            PURPOSE-<br />FIRST.<br /><span style={{ color: C.muted }}>ALWAYS.</span>
          </div>
          <div style={{ fontFamily: F.con, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: C.label, lineHeight: 1.9, maxWidth: 340 }}>
            Internal workspace for the ALTR Collective team.
            Manage clients, track time, and invoice with clarity.
          </div>
          <div style={{ marginTop: 44, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 1, background: C.border2 }} />
            <div style={{ fontFamily: F.con, fontSize: 8, letterSpacing: 4, textTransform: 'uppercase', color: C.muted }}>Depth over decoration</div>
          </div>
          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Challenge defaults', 'Radical honesty', 'Collaboration over competition'].map(v => (
              <div key={v} style={{ fontFamily: F.con, fontWeight: 700, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: C.border3 }}>{v}</div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div style={{ padding: '40px 0' }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '40px 36px' }}>

            <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, background: C.cream, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.con, fontWeight: 900, fontSize: 14, color: C.bg }}>AC</div>
              <div>
                <div style={{ fontFamily: F.con, fontWeight: 800, fontSize: 16, letterSpacing: 1, textTransform: 'uppercase', color: C.cream }}>Welcome back</div>
                <div style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: C.label, marginTop: 2 }}>Sign in to your workspace</div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: C.label, marginBottom: 6 }}>Username</div>
                <input
                  type="text" value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  placeholder="e.g. bhoomi" autoComplete="username"
                  style={{ width: '100%', background: C.bg, border: `1px solid ${error ? C.red : C.border2}`, borderRadius: 5, padding: '12px 14px', fontFamily: F.con, fontSize: 14, letterSpacing: 1, color: C.cream, outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: C.label, marginBottom: 6 }}>Password</div>
                <input
                  type="password" value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••" autoComplete="current-password"
                  style={{ width: '100%', background: C.bg, border: `1px solid ${error ? C.red : C.border2}`, borderRadius: 5, padding: '12px 14px', fontFamily: F.con, fontSize: 14, letterSpacing: 1, color: C.cream, outline: 'none' }}
                />
              </div>

              {error && (
                <div style={{ fontFamily: F.con, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: C.red, marginBottom: 18, padding: '10px 12px', background: 'rgba(201,79,79,.08)', border: `1px solid rgba(201,79,79,.2)`, borderRadius: 4 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? C.border2 : C.cream, border: 'none', borderRadius: 5, padding: '14px', fontFamily: F.con, fontWeight: 800, fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: C.bg, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .15s' }}>
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}`, fontFamily: F.con, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: C.label, textAlign: 'center', lineHeight: 1.9 }}>
              Don't have access? Contact your admin<br />
              <a href="mailto:hello@altrcollective.io" style={{ color: C.muted, textDecoration: 'none' }}>hello@altrcollective.io</a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '18px 40px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: C.muted }}>© ALTR COLLECTIVE 2025</div>
        <div style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: C.muted }}>Purpose-first design partners</div>
      </div>
    </div>
  );
}
