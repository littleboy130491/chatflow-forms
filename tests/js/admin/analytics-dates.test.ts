import { describe, expect, it } from 'vitest';
import { calendarDate, defaultRange } from '../../../assets/src/submissions/analytics-dates';

describe('analytics default period', () => {
  const now = new Date('2026-03-01T20:30:00Z');
  it('uses the last 30 calendar days, today inclusive, in UTC', () => {
    expect(defaultRange('UTC', now)).toEqual({ from: '2026-01-31', to: '2026-03-01' });
  });
  it('uses the site time zone for the per-form report', () => {
    expect(calendarDate(now, 'Asia/Jakarta')).toBe('2026-03-02');
    expect(defaultRange('Asia/Jakarta', now)).toEqual({ from: '2026-02-01', to: '2026-03-02' });
    expect(calendarDate(now, '-05:00')).toBe('2026-03-01');
    expect(calendarDate(now, '+05:30')).toBe('2026-03-02');
  });
  it('falls back to UTC for an unknown zone', () => {
    expect(calendarDate(now, 'Not/AZone')).toBe('2026-03-01');
  });
});
