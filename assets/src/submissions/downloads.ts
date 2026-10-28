import { __ } from '@wordpress/i18n';
import { can, type AdminApi } from '../builder/api';
export const uploadUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function storedIp(meta: Record<string, unknown>): string | undefined {
  const ip = meta.ip; if (typeof ip !== 'string' || ip.length > 45 || !/^[0-9a-f:.]+$/i.test(ip)) return;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip) && ip.split('.').every(part => Number(part) <= 255)) return ip;
  if (ip.includes(':')) { try { new URL(`http://[${ip}]/`); return ip; } catch { return; } }
}
export function uploadIds(value: unknown): string[] {
  return [...new Set((Array.isArray(value) ? value : [value]).filter((id): id is string => typeof id === 'string' && uploadUuid.test(id)))].slice(0, 10);
}
export async function downloadUpload(api: AdminApi, uuid: string): Promise<void> {
  if (!can(api.config, 'view_submissions') || !uploadUuid.test(uuid)) throw new Error(__('File download denied or unavailable.', 'chatflow-forms'));
  const target = new URL(api.urlFor(`admin/uploads/${uuid}`));
  if (target.origin !== location.origin || target.username || target.password || target.hash || [...target.searchParams.keys()].some(key => key !== 'rest_route')) throw new Error(__('Invalid file download destination.', 'chatflow-forms'));
  const response = await fetch(target.href, { credentials: 'same-origin', cache: 'no-store', redirect: 'error', headers: { 'X-WP-Nonce': api.config.nonce } });
  if (!response.ok) throw new Error(__('File download denied or unavailable.', 'chatflow-forms'));
  const blob = await response.blob(), url = URL.createObjectURL(blob), link = document.createElement('a');
  const name = response.headers.get('content-disposition')?.match(/filename="?([^";]+)"?/)?.[1]?.replace(/[^\w. -]/g, '').slice(0, 150);
  link.href = url; link.download = name || `chatflow-upload-${uuid}`; document.body.append(link);
  try { link.click(); } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
