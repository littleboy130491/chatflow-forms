/** WhatsApp click-to-chat links (https://wa.me/<number>?text=<message>). */
const hosts = new Set(['wa.me', 'api.whatsapp.com', 'web.whatsapp.com', 'whatsapp.com', 'www.whatsapp.com']);

export function isWhatsapp(url: string): boolean {
  try { return hosts.has(new URL(url).hostname.toLowerCase()); } catch { return false; }
}

/** Digits only, as wa.me expects: country code first, no "+", spaces or leading zeros. */
export function whatsappNumber(phone: string): string {
  return phone.replace(/\D+/g, '').replace(/^0+/, '');
}

/**
 * Build a wa.me link. The message is URL-encoded except for {{merge tags}}, which
 * stay literal so the visitor's answers are substituted (and encoded) at click time.
 */
export function whatsappUrl(phone: string, message = ''): string {
  const number = whatsappNumber(phone);
  const text = message.split(/(\{\{[^{}]+\}\})/).map(part => /^\{\{[^{}]+\}\}$/.test(part) ? part : encodeURIComponent(part)).join('');
  return `https://wa.me/${number}${text ? `?text=${text}` : ''}`;
}

/** Read a wa.me / api.whatsapp.com link back into its number and message (merge tags kept). */
export function parseWhatsapp(url: string): { phone: string; message: string } | null {
  if (!isWhatsapp(url)) return null;
  const tags: string[] = [];
  const masked = url.replace(/\{\{[^{}]+\}\}/g, tag => `__cfftag${tags.push(tag) - 1}__`);
  try {
    const parsed = new URL(masked);
    const phone = parsed.hostname === 'wa.me' ? parsed.pathname.replace(/\D+/g, '') : (parsed.searchParams.get('phone') ?? '').replace(/\D+/g, '');
    const message = (parsed.searchParams.get('text') ?? '').replace(/__cfftag(\d+)__/g, (_all, index: string) => tags[Number(index)] ?? '');
    return { phone, message };
  } catch { return null; }
}
