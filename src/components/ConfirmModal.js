import { C, F } from '../lib/utils';

export function ConfirmModal({ title, message, confirmLabel = 'Delete', onConfirm, onCancel, danger = true }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ background: C.surface, border: `1px solid ${danger ? 'rgba(201,79,79,.3)' : C.border2}`, borderRadius: 10, padding: 28, width: '100%', maxWidth: 380, boxShadow: '0 32px 80px rgba(0,0,0,.6)' }}>
        <div style={{ fontFamily: F.con, fontWeight: 800, fontSize: 15, letterSpacing: 1, textTransform: 'uppercase', color: C.cream, marginBottom: 10 }}>{title}</div>
        <div style={{ fontFamily: F.body, fontSize: 13, color: C.text, marginBottom: 24, lineHeight: 1.6 }}>{message}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 4, padding: '10px', fontFamily: F.con, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: C.label, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ flex: 1, background: danger ? C.red : C.cream, border: 'none', borderRadius: 4, padding: '10px', fontFamily: F.con, fontWeight: 700, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#fff', cursor: 'pointer' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
