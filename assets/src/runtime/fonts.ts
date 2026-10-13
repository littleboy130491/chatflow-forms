import { googleFont, googleFontUrl, type GoogleFont } from '../shared/fonts';

const limit = 65536;
const caches = new WeakMap<Document, Map<GoogleFont, { refs: number; style: HTMLStyleElement; abort: AbortController }>>();

export function googleFontCss(css: string, font: GoogleFont): string {
  if (!googleFont(font) || css.length > limit) throw new Error('Invalid font stylesheet.');
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, '');
  if (/[\\<>]/.test(cleaned)) throw new Error('Invalid font stylesheet.');
  const faces = [...cleaned.matchAll(/@font-face\s*\{([^{}]+)\}/g)];
  if (!faces.length || faces.length > 64 || cleaned.replace(/@font-face\s*\{[^{}]+\}/g, '').trim()) throw new Error('Invalid font stylesheet.');
  return faces.map(([, body]) => {
    const values = new Map<string, string>();
    for (const declaration of body!.split(';').filter(value => value.trim())) {
      const colon = declaration.indexOf(':');
      const key = declaration.slice(0, colon).trim(), value = declaration.slice(colon + 1).trim();
      if (colon < 1 || values.has(key)) throw new Error('Invalid font descriptor.');
      values.set(key, value);
    }
    if ([...values.keys()].some(key => !['font-family', 'font-style', 'font-weight', 'font-display', 'font-stretch', 'src', 'unicode-range'].includes(key))) throw new Error('Invalid font descriptor.');
    if (![`'${font}'`, `"${font}"`].includes(values.get('font-family') ?? '') || values.get('font-style') !== 'normal' || !['400', '600'].includes(values.get('font-weight') ?? '') || values.get('font-display') !== 'swap' || (values.has('font-stretch') && !['normal', '100%'].includes(values.get('font-stretch')!))) throw new Error('Invalid font descriptor.');
    const source = values.get('src')?.match(/^url\((?:['"])?(https:\/\/fonts\.gstatic\.com\/s\/[A-Za-z0-9/_-]+\.(woff2|woff|ttf))(?:['"])?\)\s+format\(['"](woff2|woff|truetype)['"]\)$/);
    if (!source || source[3] !== (source[2] === 'ttf' ? 'truetype' : source[2])) throw new Error('Invalid font source.');
    const range = values.get('unicode-range');
    if (range && (range.length > 2048 || !/^U\+[0-9A-F?]{1,6}(?:-[0-9A-F]{1,6})?(?:\s*,\s*U\+[0-9A-F?]{1,6}(?:-[0-9A-F]{1,6})?)*$/i.test(range))) throw new Error('Invalid font range.');
    return `@font-face{font-family:"${font}";font-style:normal;font-weight:${values.get('font-weight')};font-display:swap;src:url("${source[1]}") format("${source[3]}");${range ? `unicode-range:${range};` : ''}}`;
  }).join('\n');
}

async function fontStyles(font: GoogleFont, signal: AbortSignal): Promise<string> {
  const response = await fetch(googleFontUrl(font), { credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error', mode: 'cors', signal });
  if (!response.ok || response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'text/css' || Number(response.headers.get('content-length') ?? 0) > limit || !response.body) throw new Error('Font stylesheet unavailable.');
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let css = '', bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      bytes += value.byteLength; if (bytes > limit) { await reader.cancel(); throw new Error('Font stylesheet too large.'); }
      css += decoder.decode(value, { stream: true });
    }
    return googleFontCss(css + decoder.decode(), font);
  } finally { reader.releaseLock(); }
}

export function acquireGoogleFont(document: Document, font: GoogleFont): () => void {
  if (!googleFont(font)) return () => {};
  let cache = caches.get(document); if (!cache) { cache = new Map(); caches.set(document, cache); }
  let entry = cache.get(font);
  if (!entry) {
    entry = { refs: 0, style: document.createElement('style'), abort: new AbortController() };
    entry.style.dataset.cffGoogleFont = font; cache.set(font, entry);
    const current = entry;
    const timeout = setTimeout(() => current.abort.abort(), 5000);
    void fontStyles(font, current.abort.signal).then(css => {
      if (current.abort.signal.aborted || !current.refs) return;
      current.style.textContent = css; document.head.append(current.style);
    }).catch(() => { /* Keep the local fallback on network/CSP/validation failure. */ }).finally(() => clearTimeout(timeout));
  }
  entry.refs++; const current = entry; let released = false;
  return () => {
    if (released) return; released = true;
    if (--current.refs === 0) { current.abort.abort(); current.style.remove(); cache!.delete(font); }
  };
}
