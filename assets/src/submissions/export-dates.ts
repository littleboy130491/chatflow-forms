export type DatePreset = 'active' | '7' | '30' | '90' | 'month';
/** Today's calendar date in the site timezone (IANA name or WordPress "+07:00" offset). */
export function siteToday(timeZone = 'UTC', now = new Date()): string {
  const offset = /^([+-])(\d{2}):(\d{2})$/.exec(timeZone);
  if (offset) {
    const minutes = (offset[1] === '-' ? -1 : 1) * (Number(offset[2]) * 60 + Number(offset[3]));
    return new Date(now.getTime() + minutes * 60000).toISOString().slice(0, 10);
  }
  try {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}
/** Preset ranges are site calendar days; the server reads date-only bounds in the site timezone. */
export function exportDates(preset: DatePreset, now = new Date(), timeZone = 'UTC'): {from:string;to:string} | Record<string, never> {
  if (preset === 'active') return {};
  const end = new Date(`${siteToday(timeZone, now)}T00:00:00Z`);
  const start = new Date(end);
  if (preset === 'month') start.setUTCDate(1); else start.setUTCDate(start.getUTCDate() - Number(preset) + 1);
  return {from:start.toISOString().slice(0,10),to:end.toISOString().slice(0,10)};
}
