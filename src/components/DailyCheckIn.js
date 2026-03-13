import { useState } from 'react';
import { C, F } from '../lib/utils';
import { saveCheckIn, getGreeting } from '../lib/checkin';

export function DailyCheckIn({ user, projects, onDismiss, onStartTimer }) {
  const [intention, setIntention] = useState('');
  const [projectId, setProjectId] = useState('');
  const [step,      setStep]      = useState('ask'); // 'ask' | 'confirm'

  const greeting = getGreeting(user?.name || user?.username);
  const activeProjects = projects.filter(p => p.status === 'active');

  const handleSubmit = () => {
    if (!intention.trim()) { onDismiss(); return; }
    saveCheckIn(user.username, intention, projectId);
    setStep('confirm');
  };

  const handleStartTimer = () => {
    onDismiss();
    onStartTimer(projectId || null);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border2}`,
        borderRadius: 12, padding: '36px 32px', width: '100%', maxWidth: 420,
        boxShadow: '0 40px 100px rgba(0,0,0,.6)',
      }}>

        {step === 'ask' ? (
          <>
            {/* Greeting */}
            <div style={{ fontFamily: F.con, fontWeight: 900, fontSize: 28, letterSpacing: -1, textTransform: 'uppercase', color: C.cream, lineHeight: 1, marginBottom: 6 }}>
              {greeting}
            </div>
            <div style={{ fontFamily: F.con, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: C.label, marginBottom: 32 }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
            </div>

            {/* Intention input */}
            <div style={{ fontFamily: F.con, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>
              What's on today?
            </div>
            <input
              autoFocus
              value={intention}
              onChange={e => setIntention(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g. Finishing wireframes for Isha Life..."
              style={{
                width: '100%', background: C.bg, border: `1px solid ${C.border2}`,
                borderRadius: 6, padding: '12px 14px', fontFamily: F.body,
                fontSize: 14, color: C.cream, outline: 'none', marginBottom: 16,
              }}
            />

            {/* Project picker */}
            <div style={{ fontFamily: F.con, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>
              Which project? (optional)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 28 }}>
              {activeProjects.map(p => (
                <button key={p.id} onClick={() => setProjectId(projectId === p.id ? '' : p.id)}
                  style={{
                    background: projectId === p.id ? C.cream : 'transparent',
                    border: `1px solid ${projectId === p.id ? C.cream : C.border2}`,
                    borderRadius: 4, padding: '5px 12px',
                    fontFamily: F.con, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
                    color: projectId === p.id ? C.bg : C.muted, cursor: 'pointer',
                    transition: 'all .15s',
                  }}>
                  {p.name}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onDismiss} style={{
                background: 'transparent', border: `1px solid ${C.border2}`,
                borderRadius: 6, padding: '10px 18px', fontFamily: F.con,
                fontSize: 9, letterSpacing: 3, textTransform: 'uppercase',
                color: C.muted, cursor: 'pointer', flexShrink: 0,
              }}>
                Skip
              </button>
              <button onClick={handleSubmit} style={{
                flex: 1, background: C.cream, border: 'none', borderRadius: 6,
                padding: '10px', fontFamily: F.con, fontWeight: 800, fontSize: 10,
                letterSpacing: 4, textTransform: 'uppercase', color: C.bg, cursor: 'pointer',
              }}>
                Let's go →
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
              <div style={{ fontFamily: F.con, fontWeight: 800, fontSize: 18, letterSpacing: 1, textTransform: 'uppercase', color: C.cream, marginBottom: 8 }}>
                Intention set
              </div>
              <div style={{ fontFamily: F.body, fontSize: 13, color: C.text, lineHeight: 1.6, padding: '0 16px' }}>
                "{intention}"
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onDismiss} style={{
                background: 'transparent', border: `1px solid ${C.border2}`,
                borderRadius: 6, padding: '10px 18px', fontFamily: F.con,
                fontSize: 9, letterSpacing: 3, textTransform: 'uppercase',
                color: C.muted, cursor: 'pointer',
              }}>
                Dashboard
              </button>
              <button onClick={handleStartTimer} style={{
                flex: 1, background: C.red, border: 'none', borderRadius: 6,
                padding: '10px', fontFamily: F.con, fontWeight: 800, fontSize: 10,
                letterSpacing: 4, textTransform: 'uppercase', color: '#fff', cursor: 'pointer',
              }}>
                ▶ Start Timer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
