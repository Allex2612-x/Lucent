// Shared date formatting that honours the user's "Format dată european"
// (dd/MM/yyyy) preference from Settings. Reads the persisted preference at
// call time so toggling it takes effect on the next render/navigation. The
// 'faro-preferences-changed' event (dispatched by Settings) lets open views
// reformat immediately — see the listener in App.tsx.

function euEnabled(): boolean {
  try {
    const raw = localStorage.getItem('faro-preferences');
    if (raw) return JSON.parse(raw).euDateFormat !== false;
  } catch {
    // ignore malformed storage
  }
  return true; // default matches the Settings.tsx fallback
}

/** Short day/month display used in lists (Dashboard / Transactions). */
export function formatShortDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return euEnabled()
    ? date.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' }) // dd/MM/yyyy
    : date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
}

/** Full date display (search results, detail rows). */
export function formatFullDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return euEnabled()
    ? date.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : date.toLocaleDateString('ro-RO');
}
