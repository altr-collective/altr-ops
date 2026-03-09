// ─── DESIGN TOKENS ────────────────────────────────────────────────
export const C = {
  bg:      '#0F0F0F',
  surface: '#161616',
  card:    '#1A1A1A',
  card2:   '#1E1E1E',
  border:  '#242424',
  border2: '#2E2E2E',
  border3: '#383838',
  muted:   '#444444',
  label:   '#606060',
  text:    '#B8B2A8',
  cream:   '#EDE8DE',
  green:   '#52B87A',
  orange:  '#D98C45',
  red:     '#C94F4F',
  blue:    '#4E8FC7',
  purple:  '#8B6FBE',
};

export const F = {
  con:  "'Barlow Condensed', sans-serif",
  body: "'Barlow', sans-serif",
};

// ─── UTILS ────────────────────────────────────────────────────────
export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const today = () => new Date().toISOString().split('T')[0];

export const fmtINR = n =>
  '₹' + Number(n || 0).toLocaleString('en-IN');

export const fmtHrs = h =>
  `${Math.round((h || 0) * 10) / 10}h`;

export const fmtDate = s => {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00');
  return d
    .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    .toUpperCase();
};

export const fmtDateLong = s => {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00');
  const day = d.getDate();
  const M = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
             'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  const sfx = [1,21,31].includes(day) ? 'ST'
             : [2,22].includes(day)   ? 'ND'
             : [3,23].includes(day)   ? 'RD' : 'TH';
  return `${day}${sfx} ${M[d.getMonth()]} ${d.getFullYear()}`;
};

export const calcDueDate = (invDate, terms) => {
  if (!invDate || terms === 'Due on receipt') return 'DUE ON RECEIPT';
  const days = parseInt(terms.replace('Net ', ''));
  const d = new Date(invDate + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return 'DUE: ' + fmtDateLong(d.toISOString().split('T')[0]);
};
