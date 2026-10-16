import { describe, expect, it } from 'vitest';
import { isOpen, localTime, type OpeningHours } from '../../../assets/src/shared/hours';

// 2026-10-16 is a Friday. 02:30 UTC is 09:30 in Jakarta (UTC+7).
const at = (iso: string) => new Date(iso);
const weekdays: OpeningHours = { enabled: true, timezone: 'Asia/Jakarta', days: { mon: { from: '09:00', to: '17:00' }, fri: { from: '09:00', to: '17:00' } } };

describe('contact opening hours', () => {
  it('reads local weekday and time from IANA zones and fixed offsets', () => {
    expect(localTime(at('2026-10-16T02:30:00Z'), 'Asia/Jakarta')).toEqual({ day: 'fri', minute: 9 * 60 + 30 });
    expect(localTime(at('2026-10-16T02:30:00Z'), '+07:00')).toEqual({ day: 'fri', minute: 9 * 60 + 30 });
    expect(localTime(at('2026-10-16T02:30:00Z'), '-05:00')).toEqual({ day: 'thu', minute: 21 * 60 + 30 });
    expect(localTime(at('2026-10-16T02:30:00Z'), 'Not/AZone')).toBeNull();
  });
  it('opens inside a range and closes outside it or on unset days', () => {
    expect(isOpen(weekdays, at('2026-10-16T02:30:00Z'))).toBe(true); // Fri 09:30
    expect(isOpen(weekdays, at('2026-10-16T10:00:00Z'))).toBe(false); // Fri 17:00 (end is exclusive)
    expect(isOpen(weekdays, at('2026-10-17T02:30:00Z'))).toBe(false); // Saturday
  });
  it('handles overnight and all-day ranges', () => {
    const night: OpeningHours = { enabled: true, timezone: '+00:00', days: { fri: { from: '22:00', to: '02:00' }, sun: { from: '00:00', to: '00:00' } } };
    expect(isOpen(night, at('2026-10-16T23:00:00Z'))).toBe(true); // Fri 23:00
    expect(isOpen(night, at('2026-10-17T01:30:00Z'))).toBe(true); // Sat 01:30, from Friday's range
    expect(isOpen(night, at('2026-10-17T03:00:00Z'))).toBe(false); // Sat 03:00
    expect(isOpen(night, at('2026-10-18T15:00:00Z'))).toBe(true); // Sunday all day
  });
  it('never hides the button for a missing schedule or a bad time zone', () => {
    expect(isOpen(undefined, at('2026-10-17T02:30:00Z'))).toBe(true);
    expect(isOpen({ ...weekdays, enabled: false }, at('2026-10-17T02:30:00Z'))).toBe(true);
    expect(isOpen({ ...weekdays, timezone: 'Not/AZone' }, at('2026-10-17T02:30:00Z'))).toBe(true);
  });
});
