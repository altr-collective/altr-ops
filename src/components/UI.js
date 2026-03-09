import { useState } from 'react';
import { C, F } from '../lib/utils';

export const Cap = ({ size = 9, weight = 600, tracking = 4, color = C.label, children, style }) => (
  <div style={{ fontFamily: F.con, fontSize: size, fontWeight: weight, letterSpacing: tracking, textTransform: 'uppercase', color, marginBottom: 8, ...style }}>
    {children}
  </div>
);

export const Inp = ({ label, style, containerStyle, ...p }) => (
  <div style={{ marginBottom: 12, ...containerStyle }}>
    {label && <Cap style={{ marginBottom: 5 }}>{label}</Cap>}
    <input {...p} style={{ width: '100%', background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 4, padding: '9px 11px', fontFamily: F.con, fontSize: 13, letterSpacing: 1, color: C.cream, outline: 'none', ...style }} />
  </div>
);

export const Sel = ({ label, children, containerStyle, style, ...p }) => (
  <div style={{ marginBottom: 12, ...containerStyle }}>
    {label && <Cap style={{ marginBottom: 5 }}>{label}</Cap>}
    <select {...p} style={{ width: '100%', background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 4, padding: '9px 11px', fontFamily: F.con, fontSize: 13, letterSpacing: 1, color: C.cream, outline: 'none', WebkitAppearance: 'none', ...style }}>
      {children}
    </select>
  </div>
);

export const Btn = ({ children, variant = 'primary', size = 'md', style, ...p }) => {
  const base = { border: 'none', borderRadius: 4, fontFamily: F.con, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', transition: 'all .15s', letterSpacing: 3 };
  const sizes = { sm: { padding: '5px 12px', fontSize: 9 }, md: { padding: '10px 20px', fontSize: 11 }, lg: { padding: '13px 24px', fontSize: 12 } };
  const variants = {
    primary:   { background: C.cream, color: C.bg },
    secondary: { background: 'transparent', border: `1px solid ${C.border2}`, color: C.text },
    ghost:     { background: 'transparent', border: `1px solid ${C.border2}`, color: C.label, padding: '5px 11px', fontSize: 9, letterSpacing: 2 },
    danger:    { background: 'transparent', border: `1px solid rgba(201,79,79,.3)`, color: C.red, padding: '5px 11px', fontSize: 9 },
    green:     { background: C.green, color: '#fff' },
  };
  return <button {...p} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>{children}</button>;
};

export const Badge = ({ status }) => {
  const m = {
    unpaid:    { bg: 'rgba(217,140,69,.1)',   c: C.orange, b: 'rgba(217,140,69,.2)' },
    paid:      { bg: 'rgba(82,184,122,.1)',   c: C.green,  b: 'rgba(82,184,122,.2)' },
    overdue:   { bg: 'rgba(201,79,79,.1)',    c: C.red,    b: 'rgba(201,79,79,.2)' },
    active:    { bg: 'rgba(82,184,122,.08)',  c: C.green,  b: 'rgba(82,184,122,.2)' },
    completed: { bg: 'rgba(78,143,199,.08)',  c: C.blue,   b: 'rgba(78,143,199,.2)' },
    archived:  { bg: 'rgba(80,80,80,.08)',    c: C.label,  b: 'rgba(80,80,80,.2)' },
    hourly:    { bg: 'rgba(78,143,199,.08)',  c: C.blue,   b: 'rgba(78,143,199,.2)' },
    fixed:     { bg: 'rgba(139,111,190,.08)', c: C.purple, b: 'rgba(139,111,190,.2)' },
    billed:    { bg: 'rgba(82,184,122,.08)',  c: C.green,  b: 'rgba(82,184,122,.2)' },
  };
  const s = m[status] || m.unpaid;
  return (
    <span style={{ fontFamily: F.con, fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 3, background: s.bg, color: s.c, border: `1px solid ${s.b}`, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
};

export const Divider = ({ style }) => (
  <div style={{ borderTop: `1px solid ${C.border}`, margin: '14px 0', ...style }} />
);

export const Row = ({ cols, gap = 10, children, style }) => (
  <div style={{ display: 'grid', gridTemplateColumns: cols || `repeat(${Array.isArray(children) ? children.filter(Boolean).length : 1}, 1fr)`, gap, ...style }}>
    {children}
  </div>
);

export const Card = ({ children, style, onClick, hover = false }) => {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => hover && setHov(false)}
      style={{ background: hov ? C.card2 : C.card, border: `1px solid ${hov ? C.border2 : C.border}`, borderRadius: 8, padding: 18, transition: 'all .15s', cursor: onClick ? 'pointer' : 'default', ...style }}>
      {children}
    </div>
  );
};

export const Modal = ({ title, onClose, children, width = 420 }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
    onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 10, padding: 28, width, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,.6)' }}>
      <div style={{ fontFamily: F.con, fontWeight: 800, fontSize: 17, letterSpacing: 1, textTransform: 'uppercase', color: C.cream, marginBottom: 22 }}>{title}</div>
      {children}
    </div>
  </div>
);

export const Toast = ({ msg, type }) => (
  <div style={{ position: 'fixed', bottom: 22, right: 22, background: C.surface, border: `1px solid ${type === 'ok' ? C.green : C.border2}`, borderRadius: 6, padding: '10px 18px', fontFamily: F.con, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: type === 'ok' ? C.green : C.text, zIndex: 9999, boxShadow: '0 8px 28px rgba(0,0,0,.5)' }}>
    {msg}
  </div>
);

export const StatBox = ({ label, value, color, sub }) => (
  <div>
    <Cap style={{ marginBottom: 4 }}>{label}</Cap>
    <div style={{ fontFamily: F.con, fontWeight: 800, fontSize: 22, color: color || C.cream, letterSpacing: 0 }}>{value}</div>
    {sub && <div style={{ fontFamily: F.con, fontSize: 9, color: C.muted, marginTop: 3, letterSpacing: 1 }}>{sub}</div>}
  </div>
);

export const Avatar = ({ name, size = 36 }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: C.border2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.con, fontWeight: 800, fontSize: size * 0.38, color: C.cream, flexShrink: 0 }}>
    {(name || '?')[0].toUpperCase()}
  </div>
);

export const Empty = ({ icon, text }) => (
  <div style={{ textAlign: 'center', padding: '48px 20px', opacity: .22 }}>
    <div style={{ fontFamily: F.con, fontWeight: 900, fontSize: 36, color: C.muted, marginBottom: 12 }}>{icon}</div>
    <Cap style={{ marginBottom: 0, color: C.label }}>{text}</Cap>
  </div>
);

export const FilterBar = ({ options, value, onChange }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {options.map(o => (
      <button key={o} onClick={() => onChange(o)}
        style={{ background: value === o ? C.cream : 'transparent', border: `1px solid ${value === o ? C.cream : C.border2}`, borderRadius: 3, padding: '3px 11px', fontFamily: F.con, fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: value === o ? C.bg : C.muted, cursor: 'pointer' }}>
        {o}
      </button>
    ))}
  </div>
);

export const PageShell = ({ title, onBack, action, children }) => (
  <div style={{ maxWidth: 1000, margin: '0 auto', padding: '36px 32px 80px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onBack} style={{ background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 4, padding: '6px 14px', fontFamily: F.con, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: C.muted, cursor: 'pointer' }}>← Back</button>
        <div style={{ fontFamily: F.con, fontWeight: 900, fontSize: 30, letterSpacing: -0.5, textTransform: 'uppercase', color: C.cream }}>{title}</div>
      </div>
      {action}
    </div>
    {children}
  </div>
);

export const Sec = ({ title, children }) => (
  <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}` }}>
    {title && <Cap style={{ marginBottom: 12 }}>{title}</Cap>}
    {children}
  </div>
);

export const Pill = ({ children }) => (
  <span style={{ fontFamily: F.con, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', padding: '2px 8px', background: C.border2, borderRadius: 3, color: C.text }}>
    {children}
  </span>
);
