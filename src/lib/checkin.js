// ─── DAILY CHECK-IN ───────────────────────────────────────────────
// Stores today's check-in intention in localStorage
// Resets each calendar day

const KEY = u => `altr_checkin_${u}`;

export function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

export function hasCheckedInToday(username) {
  try {
    const raw = localStorage.getItem(KEY(username));
    if (!raw) return false;
    const { date } = JSON.parse(raw);
    return date === getTodayKey();
  } catch { return false; }
}

export function saveCheckIn(username, intention, projectId) {
  try {
    localStorage.setItem(KEY(username), JSON.stringify({
      date: getTodayKey(),
      intention,
      projectId,
    }));
  } catch {}
}

export function getCheckIn(username) {
  try {
    const raw = localStorage.getItem(KEY(username));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.date !== getTodayKey()) return null;
    return data;
  } catch { return null; }
}

export function getGreeting(name) {
  const h = new Date().getHours();
  const first = (name || '').split(' ')[0];
  if (h < 12) return `Good morning, ${first}.`;
  if (h < 17) return `Good afternoon, ${first}.`;
  return `Good evening, ${first}.`;
}
