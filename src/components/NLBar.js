import { useState, useRef } from 'react';
import { C, F, today } from '../lib/utils';
import { WORK_TYPES } from '../lib/workTypes';

// Parse natural language via Claude API
async function parseEntry(text, team, projects) {
  const teamList    = team.map(m => `"${m.name}" (id:${m.id})`).join(', ');
  const projectList = projects.filter(p => p.status === 'active')
    .map(p => `"${p.name}" (id:${p.id})`).join(', ');
  const wtList = WORK_TYPES.map(w => `${w.id}=${w.label}`).join(', ');
  const todayStr = today();

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Parse this time log entry for ALTR Collective design studio.
Team: ${teamList}
Projects: ${projectList}
Work types: ${wtList}
Today: ${todayStr}

Entry: "${text}"

Return ONLY valid JSON (no markdown):
{
  "hours": number or null,
  "member_id": "id" or null,
  "member_name": "name" or null,
  "project_id": "id" or null,
  "project_name": "name" or null,
  "work_type": "work_type_id",
  "date": "YYYY-MM-DD",
  "notes": "description" or "",
  "confidence": "high"|"medium"|"low",
  "missing": ["fields that could not be determined"]
}`
      }],
    }),
  });
  const data = await res.json();
  const raw = data.content?.[0]?.text || '{}';
  try { return JSON.parse(raw.replace(/```json|```/g, '').trim()); }
  catch { return null; }
}

export function NLBar({ team, projects, currentUser, onSave, onOpenManual }) {
  const [input,    setInput]    = useState('');
  const [state,    setState]    = useState('idle'); // idle | parsing | confirm | error
  const [parsed,   setParsed]   = useState(null);
  const [errMsg,   setErrMsg]   = useState('');

  // Editable confirm fields
  const [cHours,   setCHours]   = useState('');
  const [cMember,  setCMember]  = useState('');
  const [cProject, setCProject] = useState('');
  const [cType,    setCType]    = useState('client_design');
  const [cDate,    setCDate]    = useState(today());
  const [cNotes,   setCNotes]   = useState('');

  const inputRef = useRef(null);

  const parse = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setState('parsing');
    setErrMsg('');

    const result = await parseEntry(trimmed, team, projects);
    if (!result) {
      setState('error');
      setErrMsg("Couldn't understand that. Try: \"2h design for Isha Life\"");
      return;
    }

    setParsed(result);
    setCHours(result.hours?.toString() || '');
    // Default member to current logged-in user's team record if not specified
    const myRecord = team.find(m => m.name?.toLowerCase().includes(currentUser?.name?.split(' ')[0]?.toLowerCase() || ''));
    setCMember(result.member_id || myRecord?.id || '');
    setCProject(result.project_id || '');
    setCType(result.work_type || 'client_design');
    setCDate(result.date || today());
    setCNotes(result.notes || '');
    setState('confirm');
  };

  const save = async () => {
    if (!cMember || !cProject || !cHours) {
      setErrMsg('Fill in member, project and hours to save.');
      return;
    }
    await onSave({
      member_id: cMember,
      project_id: cProject,
      hours: parseFloat(cHours),
      work_type: cType,
      date: cDate,
      notes: cNotes,
      billed: false,
    });
    setInput('');
    setState('idle');
    setParsed(null);
    inputRef.current?.focus();
  };

  const reset = () => {
    setState('idle');
    setParsed(null);
    setErrMsg('');
    setInput('');
    inputRef.current?.focus();
  };

  const placeholders = [
    'Log time… e.g. "2h wireframes for Isha Life"',
    'Try "30 mins strategy call for GTF yesterday"',
    'e.g. "Bhoomi 3h research Isha Life"',
  ];
  const placeholder = placeholders[Math.floor(Date.now() / 10000) % placeholders.length];

  return (
    <div style={{
      position: 'sticky', bottom: 0, zIndex: 50,
      background: C.bg,
      borderTop: `1px solid ${C.border}`,
      padding: '12px 16px',
    }}>

      {/* Confirm card — slides up above the bar */}
      {state === 'confirm' && parsed && (
        <div style={{
          background: C.surface, border: `1px solid ${C.border2}`,
          borderRadius: 10, padding: '16px', marginBottom: 12,
          boxShadow: '0 -8px 32px rgba(0,0,0,.4)',
        }}>
          {/* Confidence */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: parsed.confidence === 'high' ? C.green : parsed.confidence === 'medium' ? C.orange : C.red }} />
              <span style={{ fontFamily: F.con, fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', color: C.label }}>
                {parsed.confidence === 'high' ? 'Looks good' : parsed.confidence === 'medium' ? 'Please check' : 'Needs review'}
              </span>
            </div>
            <button onClick={reset} style={{ background: 'none', border: 'none', fontFamily: F.con, fontSize: 9, color: C.muted, cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase' }}>✕ Redo</button>
          </div>

          {/* Inline edit fields — compact two-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: F.con, fontSize: 7, letterSpacing: 2, textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Hours</div>
              <input type="number" step="0.25" value={cHours} onChange={e => setCHours(e.target.value)}
                style={{ width: '100%', background: C.bg, border: `1px solid ${!cHours ? C.red : C.border2}`, borderRadius: 4, padding: '7px 8px', fontFamily: F.con, fontWeight: 700, fontSize: 14, color: C.cream, outline: 'none' }} />
            </div>
            <div>
              <div style={{ fontFamily: F.con, fontSize: 7, letterSpacing: 2, textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Member</div>
              <select value={cMember} onChange={e => setCMember(e.target.value)}
                style={{ width: '100%', background: C.bg, border: `1px solid ${!cMember ? C.red : C.border2}`, borderRadius: 4, padding: '7px 8px', fontFamily: F.con, fontSize: 11, color: C.cream, outline: 'none', WebkitAppearance: 'none' }}>
                <option value="">Select…</option>
                {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontFamily: F.con, fontSize: 7, letterSpacing: 2, textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Project</div>
              <select value={cProject} onChange={e => setCProject(e.target.value)}
                style={{ width: '100%', background: C.bg, border: `1px solid ${!cProject ? C.red : C.border2}`, borderRadius: 4, padding: '7px 8px', fontFamily: F.con, fontSize: 11, color: C.cream, outline: 'none', WebkitAppearance: 'none' }}>
                <option value="">Select…</option>
                {projects.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: F.con, fontSize: 7, letterSpacing: 2, textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Work Type</div>
              <select value={cType} onChange={e => setCType(e.target.value)}
                style={{ width: '100%', background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 4, padding: '7px 8px', fontFamily: F.con, fontSize: 11, color: C.cream, outline: 'none', WebkitAppearance: 'none' }}>
                {WORK_TYPES.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontFamily: F.con, fontSize: 7, letterSpacing: 2, textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Date</div>
              <input type="date" value={cDate} onChange={e => setCDate(e.target.value)}
                style={{ width: '100%', background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 4, padding: '7px 8px', fontFamily: F.con, fontSize: 11, color: C.cream, outline: 'none' }} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <input value={cNotes} onChange={e => setCNotes(e.target.value)} placeholder="Notes (optional)"
              style={{ width: '100%', background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 4, padding: '7px 10px', fontFamily: F.body, fontSize: 12, color: C.cream, outline: 'none' }} />
          </div>

          {errMsg && <div style={{ fontFamily: F.con, fontSize: 8, color: C.red, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>{errMsg}</div>}

          <button onClick={save} style={{
            width: '100%', background: C.green, border: 'none', borderRadius: 6,
            padding: '11px', fontFamily: F.con, fontWeight: 800, fontSize: 11,
            letterSpacing: 4, textTransform: 'uppercase', color: '#fff', cursor: 'pointer',
          }}>
            Save Entry ✓
          </button>
        </div>
      )}

      {/* Main input bar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => { setInput(e.target.value); if (state === 'error') setState('idle'); }}
            onKeyDown={e => e.key === 'Enter' && state === 'idle' && parse()}
            placeholder={placeholder}
            disabled={state === 'parsing' || state === 'confirm'}
            style={{
              width: '100%',
              background: state === 'confirm' ? C.border : C.surface,
              border: `1px solid ${state === 'error' ? C.red : C.border2}`,
              borderRadius: 8, padding: '11px 52px 11px 14px',
              fontFamily: F.body, fontSize: 14, color: C.cream, outline: 'none',
              opacity: state === 'confirm' ? 0.4 : 1,
              transition: 'all .2s',
            }}
          />
          {state === 'idle' && input && (
            <button onClick={parse}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: C.cream, border: 'none', borderRadius: 5, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: C.bg, cursor: 'pointer', fontWeight: 700 }}>
              →
            </button>
          )}
          {state === 'parsing' && (
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: F.con, fontSize: 9, color: C.muted, letterSpacing: 3 }}>
              PARSING…
            </div>
          )}
        </div>

        {/* Manual entry + timer shortcuts */}
        <button onClick={onOpenManual} title="Manual entry"
          style={{ flexShrink: 0, background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 8, width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.con, fontSize: 12, color: C.label, cursor: 'pointer' }}>
          ✎
        </button>
      </div>

      {state === 'error' && (
        <div style={{ fontFamily: F.con, fontSize: 8, color: C.red, letterSpacing: 2, textTransform: 'uppercase', marginTop: 6 }}>
          {errMsg}
        </div>
      )}
    </div>
  );
}
