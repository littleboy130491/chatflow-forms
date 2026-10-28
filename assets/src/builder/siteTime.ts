/**
 * Convert between stored UTC timestamps and the site's wall-clock time for
 * <input type="datetime-local">. The site zone is an IANA name or a WordPress "+07:00" offset.
 */
function fixedOffset(timeZone: string): number | null {
  const match = /^([+-])(\d{2}):(\d{2})$/.exec(timeZone);
  return match ? (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3])) : null;
}
/** Minutes the zone is ahead of UTC at the given instant. */
function offsetAt(timeZone: string, instant: number): number {
  const fixed = fixedOffset(timeZone);
  if (fixed !== null) return fixed;
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
        .formatToParts(new Date(instant))
        .map((part) => [part.type, part.value]),
    );
    const wall = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
    return Math.round((wall - Math.floor(instant / 1000) * 1000) / 60000);
  } catch {
    return 0;
  }
}
/** Stored ISO timestamp → "YYYY-MM-DDTHH:mm" in site time ('' when empty or invalid). */
export function toSiteInput(iso: string | null | undefined, timeZone = 'UTC'): string {
  const instant = iso ? Date.parse(iso) : NaN;
  if (Number.isNaN(instant)) return '';
  return new Date(instant + offsetAt(timeZone, instant) * 60000).toISOString().slice(0, 16);
}
/** "YYYY-MM-DDTHH:mm" in site time → ISO UTC timestamp (null when empty or invalid). */
export function fromSiteInput(local: string, timeZone = 'UTC'): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const wall = Date.parse(`${local}:00Z`);
  if (Number.isNaN(wall)) return null;
  // Two passes settle the offset across daylight-saving changes.
  let instant = wall - offsetAt(timeZone, wall) * 60000;
  instant = wall - offsetAt(timeZone, instant) * 60000;
  return new Date(instant).toISOString().replace('.000Z', 'Z');
}
