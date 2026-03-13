import { useState } from 'react';
import { C, F, today } from '../lib/utils';
import { WORK_TYPES } from '../lib/workTypes';

// ─── CLAUDE API PARSER ────────────────────────────────────────────
async function parseLogEntry(text, team, projects) {
  const teamList    = team.map(m => `"${m.name}" (id: ${m.id})`).join(', ');
  const projectList = projects.filter(p => p.status === 'active')
    .map(p => `"${p.name}" (id: ${p.id})`).join(', ');
  const workTypeList = WORK_TYPES.map(w => `"${w.id}" = ${w.label}`).join(', ');
  const todayStr = today();

  const prompt = `You are a time log parser for ALTR Collective, a design studio. 
Parse this natural language time entry into structured data.

Team members: ${teamList}
Active projects: ${projectList}
Work types: ${workTypeList}
Today's date: ${todayStr}

User input: "${text}"

Rules:
- hours: extract number (e.g. "2h" = 2, "half hour" = 0.5, "90 mins" = 1.5)
- member_id: match team member by name or first name (fuzzy match)
- project_id: match project by name (fuzzy/partial match)
- work_type: infer from context ("wireframes"→client_design, "call"→client_strategy, "interview"→client_research, "deck"→client_strategy, "revisions"→client_revisions, "admin"→ops_admin, "pitch"→biz_dev, default→client_design)
- date: parse relative dates ("yesterday"→yesterday's date, "monday"→last monday, default→today)
- notes: extract any description of the work

Return ONLY valid JSON, no markdown:
{
  "hours": number or null,
  "member_id": "id string" or null,
  "member_name": "matched name" or null,
  "project_id": "id string" or null,
  "project_name": "matched name" or null,
  "work_type": "work_type_id",
  "date": "YYYY-MM-DD",
  "notes": "extracted description" or "",
  "confidence": "high" | "medium" | "low",
  "issues": ["list of things that couldn't be parsed"]
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();
  const text2 = data.content?.[0]?.text || '{}';
  try {
    return JSON.parse(text2.replace(/```json|```/g, '').trim());
  } catch {
    return null;
  }
}

// ─── NATURAL LOG COMPONENT ────────────────────────────────────────
export function NaturalLog({ team, projects, onSave, onClose }) {
  const [input,   setInput]   = useState('');
  const [parsed,  setParsed]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Editable fields after parse
  const [hours,    setHours]    = useState('');
  const [memberId, setMemberId] = useState('');
  const [projId,   setProjId]   = useState('');
  const [workType, setWorkType] = useState('client_design');
  const [date,     setDate]     = useState(today());
  const [notes,    setNotes]    = useState('');

  const examples = [
    '2h wireframes for Isha Life',
    '30 mins client call for Giving Together',
    '1.5h research yesterday',
    '3h Bhoomi design revisions Isha Life',
  ];

  const parse = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setParsed(null);

    const result = await parseLogEntry(input, team, projects);

    if (!result) {
      setError("Couldn't parse that. Try something like: \"2h wireframes for Isha Life\"");
      setLoading(false);
      return;
    }

    setParsed(result);
    setHours(result.hours?.toString() || '');
    setMemberId(result.member_id || '');
    setProjId(result.project_id || '');
    setWorkType(result.work_type || 'client_design');
    setDate(result.date || today());
    setNotes(result.notes || '');
    setLoading(false);
  };

  const save = async () => {
    if (!memberId || !projId || !hours) {
      setError('Please fill in member, project and hours.');
      return;
    }
    await onSave({
      member_id: memberId,
      project_id: projId,
      hours: parseFloat(hours),
      work_type: workType,
      date,
      notes,
      billed: false,
    });
    onClose();
  };

  const wt = WORK_TYPES.find(w => w.id === workType) || WORK_TYPES[1];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, padding: '28px 26px', width: '100%', maxWidth: 460, boxShadow: '0 32px 80px rgba(0,0,0,.6)' }}>

        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: F.con, fontWeight: 800, fontSize: 18, letterSpacing: 1, textTransform: 'uppercase', color: C.cream, marginBottom: 4 }}>Quick Log</div>
          <div style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: C.label }}>Describe what you worked on in plain English</div>
        </div>

        {/* Input */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <input
            autoFocus
            value={input}
            onChange={e => { setInput(e.target.value); setParsed(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && !loading && parse()}
            placeholder="e.g. 2h wireframes for Isha Life yesterday"
            style={{
              width: '100%', background: C.bg, border: `1px solid ${parsed ? C.green : error ? C.red : C.border2}`,
              borderRadius: 6, padding: '13px 110px 13px 14px',
              fontFamily: F.body, fontSize: 14, color: C.cream, outline: 'none',
              transition: 'border-color .2s',
            }}
          />
          <button onClick={parse} disabled={loading || !input.trim()}
            style={{
              position: 'absolute', right: 6, top: 6,
              background: loading ? C.border2 : C.cream, border: 'none',
              borderRadius: 4, padding: '7px 14px',
              fontFamily: F.con, fontWeight: 700, fontSize: 9, letterSpacing: 2,
              textTransform: 'uppercase', color: C.bg,
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            }}>
            {loading ? '...' : 'Parse →'}
          </button>
        </div>

        {/* Example chips */}
        {!parsed && !error && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: F.con, fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>Try an example</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {examples.map(ex => (
                <button key={ex} onClick={() => setInput(ex)}
                  style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 4, padding: '4px 10px', fontFamily: F.body, fontSize: 11, color: C.muted, cursor: 'pointer' }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: C.red, padding: '9px 12px', background: 'rgba(201,79,79,.08)', border: `1px solid rgba(201,79,79,.2)`, borderRadius: 4, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Parsed result — editable */}
        {parsed && (
          <>
            <div style={{ padding: '14px 16px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 16 }}>

              {/* Confidence banner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: parsed.confidence === 'high' ? C.green : parsed.confidence === 'medium' ? C.orange : C.red }} />
                <div style={{ fontFamily: F.con, fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', color: C.label }}>
                  {parsed.confidence === 'high' ? 'Parsed successfully' : parsed.confidence === 'medium' ? 'Check fields below' : 'Low confidence — please review'}
                </div>
              </div>

              {/* Editable fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: F.con, fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', color: C.label, marginBottom: 5 }}>Hours</div>
                  <input type="number" step="0.25" value={hours} onChange={e => setHours(e.target.value)}
                    style={{ width: '100%', background: C.bg, border: `1px solid ${!hours ? C.red : C.border2}`, borderRadius: 4, padding: '8px 10px', fontFamily: F.con, fontSize: 14, fontWeight: 700, color: C.cream, outline: 'none' }} />
                </div>
                <div>
                  <div style={{ fontFamily: F.con, fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', color: C.label, marginBottom: 5 }}>Date</div>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    style={{ width: '100%', background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 4, padding: '8px 10px', fontFamily: F.con, fontSize: 12, color: C.cream, outline: 'none' }} />
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: F.con, fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', color: C.label, marginBottom: 5 }}>Team Member</div>
                <select value={memberId} onChange={e => setMemberId(e.target.value)}
                  style={{ width: '100%', background: C.bg, border: `1px solid ${!memberId ? C.red : C.border2}`, borderRadius: 4, padding: '8px 10px', fontFamily: F.con, fontSize: 12, color: C.cream, outline: 'none', WebkitAppearance: 'none' }}>
                  <option value="">Select member…</option>
                  {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: F.con, fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', color: C.label, marginBottom: 5 }}>Project</div>
                <select value={projId} onChange={e => setProjId(e.target.value)}
                  style={{ width: '100%', background: C.bg, border: `1px solid ${!projId ? C.red : C.border2}`, borderRadius: 4, padding: '8px 10px', fontFamily: F.con, fontSize: 12, color: C.cream, outline: 'none', WebkitAppearance: 'none' }}>
                  <option value="">Select project…</option>
                  {projects.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: F.con, fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', color: C.label, marginBottom: 5 }}>Work Type</div>
                <select value={workType} onChange={e => setWorkType(e.target.value)}
                  style={{ width: '100%', background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 4, padding: '8px 10px', fontFamily: F.con, fontSize: 12, color: C.cream, outline: 'none', WebkitAppearance: 'none' }}>
                  {WORK_TYPES.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
                </select>
              </div>

              <div>
                <div style={{ fontFamily: F.con, fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', color: C.label, marginBottom: 5 }}>Notes</div>
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes"
                  style={{ width: '100%', background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 4, padding: '8px 10px', fontFamily: F.body, fontSize: 12, color: C.cream, outline: 'none' }} />
              </div>

              {/* Issues */}
              {parsed.issues?.length > 0 && (
                <div style={{ marginTop: 10, fontFamily: F.con, fontSize: 8, color: C.orange, letterSpacing: 1 }}>
                  ⚠ {parsed.issues.join(' · ')}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setParsed(null); setInput(''); }}
                style={{ background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 6, padding: '10px 16px', fontFamily: F.con, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: C.muted, cursor: 'pointer' }}>
                Redo
              </button>
              <button onClick={save} style={{ flex: 1, background: C.green, border: 'none', borderRadius: 6, padding: '12px', fontFamily: F.con, fontWeight: 800, fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#fff', cursor: 'pointer' }}>
                Save Entry ✓
              </button>
            </div>
          </>
        )}

        {!parsed && (
          <button onClick={onClose} style={{ marginTop: 12, width: '100%', background: 'transparent', border: 'none', fontFamily: F.con, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: C.muted, cursor: 'pointer' }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
