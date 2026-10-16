/** Calendar date (YYYY-MM-DD) of an instant in a time zone; falls back to UTC for unknown zones. */
export function calendarDate(now: Date, timeZone = 'UTC'): string {
  // WordPress reports manual UTC offsets as "+05:30"; apply them directly.
  const offset = /^([+-])(\d{2}):(\d{2})$/.exec(timeZone);
  if (offset) {
    const minutes = (offset[1] === '-' ? -1 : 1) * (Number(offset[2]) * 60 + Number(offset[3]));
    return new Date(now.getTime() + minutes * 60000).toISOString().slice(0, 10);
  }
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
    return `${part('year')}-${part('month')}-${part('day')}`;
  } catch {
    return now.toISOString().slice(0, 10);
  }
}
/**
 * The default analytics period shared by both panels: the last 30 calendar days,
 * today inclusive, in the time zone the report interprets dates in.
 */
export function defaultRange(timeZone = 'UTC', now = new Date()): { from: string; to: string } {
  const to = calendarDate(now, timeZone);
  const [year, month, day] = to.split('-').map(Number) as [number, number, number];
  const from = new Date(Date.UTC(year, month - 1, day - 29)).toISOString().slice(0, 10);
  return { from, to };
}
