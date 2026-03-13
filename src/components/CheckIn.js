import { useState } from 'react';
import { C, F, today } from '../lib/utils';
import { saveCheckIn, getGreeting } from '../lib/checkin';

// Google Calendar color map → ALTR accent
const CAL_COLORS = {
  '1':'#7986CB','2':'#33B679','3':'#8E24AA','4':'#E67C73',
  '5':'#F6BF26','6':'#F4511E','7':'#039BE5','8':'#616161',
  '9':'#3F51B5','10':'#0B8043','11':'#D50000',
};

function fmtEventTime(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function CheckIn({ user, calendarEvents = [], onDismiss }) {
  const [intention, setIntention] = useState('');
  const greeting = getGreeting(user?.name || user?.username);

  // Filter out OOO / reminder events for display
  const relevantEvents = calendarEvents.filter(e =>
    e.eventType !== 'outOfOffice' && !e.summary?.toLowerCase().includes('reminder')
  );

  const submit = () => {
    saveCheckIn(user.username, intention || 'General work', null);
    onDismiss();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Greeting */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 5, textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>
            ALTR COLLECTIVE · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
          </div>
          <div style={{ fontFamily: F.con, fontWeight: 900, fontSize: 'clamp(32px,7vw,52px)', letterSpacing: -2, textTransform: 'uppercase', color: C.cream, lineHeight: 0.95 }}>
            {greeting}
          </div>
        </div>

        {/* Calendar events */}
        {relevantEvents.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: F.con, fontSize: 8, letterSpacing: 4, textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>
              On your calendar today
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {relevantEvents.map(ev => {
                const color = CAL_COLORS[ev.colorId] || C.label;
                const time = fmtEventTime(ev.start?.dateTime);
                return (
                  <div key={ev.id}
                    onClick={() => setIntention(intention ? intention : ev.summary)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px',
                      background: C.card, border: `1px solid ${C.border}`,
                      borderLeft: `3px solid ${color}`,
                      borderRadius: 6, cursor: 'pointer',
                      transition: 'border-color .15s',
                    }}>
                    <div style={{ fontFamily: F.con, fontSize: 9, color: C.muted, minWidth: 52 }}>{time}</div>
                    <div style={{ fontFamily: F.con, fontSize: 11, color: C.cream, fontWeight: 600 }}>{ev.summary}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Intention input */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: F.con, fontSize: 8, letterSpacing: 4, textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>
            What's your focus today?
          </div>
          <div style={{ position: 'relative' }}>
            <input
              autoFocus
              value={intention}
              onChange={e => setIntention(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="e.g. Finishing wireframes for Isha Life..."
              style={{
                width: '100%',
                background: C.surface,
                border: `1px solid ${C.border2}`,
                borderRadius: 8,
                padding: '14px 56px 14px 16px',
                fontFamily: F.body, fontSize: 14,
                color: C.cream, outline: 'none',
              }}
            />
            <button onClick={submit} style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: C.cream, border: 'none', borderRadius: 5,
              width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: F.con, fontSize: 14, color: C.bg, cursor: 'pointer', fontWeight: 800,
            }}>→</button>
          </div>
        </div>

        <button onClick={onDismiss} style={{
          background: 'none', border: 'none',
          fontFamily: F.con, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase',
          color: C.muted, cursor: 'pointer', padding: '8px 0',
        }}>
          Skip for now
        </button>
      </div>
    </div>
  );
}
