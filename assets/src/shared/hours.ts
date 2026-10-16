/** Weekly opening hours for the direct contact button (e.g. WhatsApp). */
export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Weekday = typeof WEEKDAYS[number];
export interface OpeningHours {
  enabled?: boolean;
  /** IANA name such as "Asia/Jakarta", or a fixed offset such as "+07:00". */
  timezone?: string;
  days?: Partial<Record<Weekday, { from: string; to: string }>>;
  outside?: 'hide' | 'message';
  message?: string;
}

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
const minutes = (value: string): number | null => { const match = TIME.exec(value); return match ? Number(match[1]) * 60 + Number(match[2]) : null; };

/** Weekday and minute of the day at `now` in the given time zone; null for an unknown zone. */
export function localTime(now: Date, timezone: string): { day: Weekday; minute: number } | null {
  const offset = /^([+-])(\d{2}):(\d{2})$/.exec(timezone);
  if (offset) {
    const shift = (offset[1] === '-' ? -1 : 1) * (Number(offset[2]) * 60 + Number(offset[3]));
    const local = new Date(now.getTime() + shift * 60000);
    return { day: WEEKDAYS[(local.getUTCDay() + 6) % 7]!, minute: local.getUTCHours() * 60 + local.getUTCMinutes() };
  }
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
    const get = (type: string) => parts.find(part => part.type === type)?.value ?? '';
    const day = get('weekday').toLowerCase().slice(0, 3) as Weekday;
    if (!WEEKDAYS.includes(day)) return null;
    return { day, minute: Number(get('hour')) * 60 + Number(get('minute')) };
  } catch { return null; }
}

/**
 * Whether the contact button is "open" at `now`. Without a schedule (or with an
 * unknown time zone) it is always open, so a misconfiguration never hides it.
 * A range that ends before it starts (22:00–02:00) runs past midnight; equal
 * times (00:00–00:00) mean open all day.
 */
export function isOpen(hours: OpeningHours | undefined, now: Date): boolean {
  if (!hours?.enabled) return true;
  const local = localTime(now, hours.timezone || 'UTC');
  if (!local) return true;
  const index = WEEKDAYS.indexOf(local.day);
  const inRange = (day: Weekday, after: boolean) => {
    const range = hours.days?.[day];
    const from = range ? minutes(range.from) : null, to = range ? minutes(range.to) : null;
    if (from === null || to === null) return false;
    if (from === to) return !after; // e.g. 00:00–00:00: open all day
    if (from < to) return !after && local.minute >= from && local.minute < to;
    // Overnight range: today from `from` until midnight, or yesterday's range until `to`.
    return after ? local.minute < to : local.minute >= from;
  };
  return inRange(local.day, false) || inRange(WEEKDAYS[(index + 6) % 7]!, true);
}
