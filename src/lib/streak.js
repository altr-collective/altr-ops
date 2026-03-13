// ─── STREAK SYSTEM ────────────────────────────────────────────────
// Streak = consecutive calendar days with at least one time log entry
// Stored in localStorage per username so it persists across sessions

const KEY = u => `altr_streak_${u}`;

export function getStreak(username) {
  try {
    const raw = localStorage.getItem(KEY(username));
    return raw ? JSON.parse(raw) : { count: 0, lastDate: null };
  } catch { return { count: 0, lastDate: null }; }
}

export function computeStreak(username, logs) {
  // Build set of unique dates this user has logs
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Count consecutive days going backwards from today
  const logDates = new Set(logs.map(l => l.date?.split('T')[0]).filter(Boolean));
  
  let streak = 0;
  let checkDate = new Date();
  
  // If nothing logged today, check if yesterday keeps streak alive
  if (!logDates.has(today)) {
    if (!logDates.has(yesterday)) {
      // Streak broken
      const saved = getStreak(username);
      // If last date was yesterday or today, keep count but mark broken
      return { count: 0, lastDate: saved.lastDate, hasLoggedToday: false };
    }
  }

  // Count back from today
  while (true) {
    const d = checkDate.toISOString().split('T')[0];
    if (logDates.has(d)) {
      streak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    } else {
      break;
    }
  }

  const result = { count: streak, lastDate: today, hasLoggedToday: logDates.has(today) };
  try { localStorage.setItem(KEY(username), JSON.stringify(result)); } catch {}
  return result;
}

export function getStreakEmoji(count) {
  if (count === 0) return '○';
  if (count < 3)  return '🔥';
  if (count < 7)  return '🔥🔥';
  if (count < 14) return '🔥🔥🔥';
  return '⚡';
}
