export type DatePreset = 'active' | '7' | '30' | '90' | 'month';
export function exportDates(preset: DatePreset, now = new Date()): {from:string;to:string} | Record<string, never> {
  if (preset === 'active') return {};
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end);
  if (preset === 'month') start.setUTCDate(1); else start.setUTCDate(start.getUTCDate() - Number(preset) + 1);
  return {from:start.toISOString().slice(0,10),to:end.toISOString().slice(0,10)};
}
