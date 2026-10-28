import { describe, expect, it } from 'vitest';
import { fromSiteInput, toSiteInput } from '../../../assets/src/builder/siteTime';
import { exportDates, siteToday } from '../../../assets/src/submissions/export-dates';
import { formLocale, phrases } from '../../../assets/src/runtime/i18n';

describe('site time for admin date inputs', () => {
  it('round-trips a closing date through the site wall clock', () => {
    expect(toSiteInput('2026-11-01T10:00:00Z', 'Asia/Jakarta')).toBe('2026-11-01T17:00');
    expect(fromSiteInput('2026-11-01T17:00', 'Asia/Jakarta')).toBe('2026-11-01T10:00:00Z');
    expect(toSiteInput('2026-11-01T10:00:00Z', '+07:00')).toBe('2026-11-01T17:00');
    expect(fromSiteInput('2026-11-01T17:00', '-03:30')).toBe('2026-11-01T20:30:00Z');
  });
  it('uses the offset in force on that date across daylight saving', () => {
    expect(fromSiteInput('2026-07-01T09:00', 'America/New_York')).toBe('2026-07-01T13:00:00Z');
    expect(fromSiteInput('2026-12-01T09:00', 'America/New_York')).toBe('2026-12-01T14:00:00Z');
  });
  it('treats empty or invalid values as "no date"', () => {
    expect(toSiteInput(null, 'UTC')).toBe('');
    expect(toSiteInput('not a date', 'UTC')).toBe('');
    expect(fromSiteInput('', 'UTC')).toBeNull();
  });
  it('computes export presets from the site calendar day, not the UTC day', () => {
    // 20:00 UTC on 1 March is already 2 March in Jakarta.
    const now = new Date('2026-03-01T20:00:00Z');
    expect(siteToday('Asia/Jakarta', now)).toBe('2026-03-02');
    expect(siteToday('UTC', now)).toBe('2026-03-01');
    expect(exportDates('7', now, 'Asia/Jakarta')).toEqual({ from: '2026-02-24', to: '2026-03-02' });
    expect(exportDates('month', now, '+07:00')).toEqual({ from: '2026-03-01', to: '2026-03-02' });
  });
});

describe('per-form visitor language', () => {
  it('lets the form language override the page language unless it follows the site', () => {
    expect(formLocale('id', 'en-US')).toBe('id');
    expect(formLocale('en', 'id-ID')).toBe('en');
    expect(formLocale('site', 'id-ID')).toBe('id-ID');
    expect(formLocale(undefined, 'en')).toBe('en');
    expect(phrases(formLocale('id', 'en-US'))('startOver')).toBe('Mulai ulang');
  });
});
