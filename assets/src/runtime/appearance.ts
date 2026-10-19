const properties = new Set(['color', 'background-color', 'border-color', 'border-radius', 'border-width', 'border-style', 'padding', 'padding-inline', 'padding-block', 'margin', 'margin-inline', 'margin-block', 'gap', 'font-size', 'font-weight', 'font-family', 'line-height', 'text-align', 'text-decoration', 'letter-spacing', 'max-width', 'min-height', 'width', 'height', 'opacity']);
const unsafe = /[\\@<>]|url\s*\(|expression\s*\(|image-set\s*\(|attr\s*\(|paint\s*\(|element\s*\(/i;

export function safeColor(value: string | undefined): string | undefined {
  if (!value || unsafe.test(value) || /var\s*\(/i.test(value)) return undefined;
  const probe = document.createElement('span').style; probe.color = value;
  return probe.color || undefined;
}

/** Pick the higher-contrast neutral for opaque accent buttons; theme colours themselves stay untouched. */
export function buttonTextColor(background: string): '#171717' | '#ffffff' {
  const probe = document.createElement('span');
  probe.style.color = safeColor(background) ?? '#171717';
  probe.style.display = 'none';
  document.documentElement.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  // Only legacy RGB serializations contain 0–255 channels. CSS Color 4 may
  // preserve its colour space (e.g. color(srgb 1 1 1) or oklch(1 0 0)).
  const rgb = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*[\d.]+)?\)$/.exec(color);
  let channels = rgb?.slice(1, 4).map(Number);
  if (!channels) {
    try {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        // Default canvas readback converts supported colour spaces to sRGB.
        channels = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
      }
    } catch { /* Canvas can be unavailable in non-rendering environments. */ }
  }
  if (!channels) return '#ffffff';
  const linear = channels.map(value => { const v = value / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
  const luminance = linear[0]! * .2126 + linear[1]! * .7152 + linear[2]! * .0722;
  const darkLuminance = ((23 / 255 + .055) / 1.055) ** 2.4;
  return (luminance + .05) / (darkLuminance + .05) >= 1.05 / (luminance + .05) ? '#171717' : '#ffffff';
}

export function safeFont(value: string | undefined): string | undefined {
  return value && /^[\w\s,"'-]{1,255}$/.test(value) ? value : undefined;
}

export function scopedAppearanceCss(css: string | undefined): string {
  if (!css || css.length > 20000 || unsafe.test(css)) return '';
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [...cleaned.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  if (cleaned.replace(/([^{}]+)\{([^{}]*)\}/g, '').trim()) return '';
  return rules.map(([, selector, body]) => {
    if (!selector || !body || !/^[\w\s.#,:>-]+$/.test(selector) || /:(?!(?:hover|focus-visible|focus|disabled|active|checked)(?:\b|$))/i.test(selector)) return '';
    const declarations = body.split(';').flatMap(declaration => {
      const colon = declaration.indexOf(':'); if (colon < 1) return [];
      const property = declaration.slice(0, colon).trim().toLowerCase(), value = declaration.slice(colon + 1).trim();
      if (!properties.has(property) || !value || unsafe.test(value) || /var\s*\(/i.test(value)) return [];
      const probe = document.createElement('span').style; probe.setProperty(property, value);
      return probe.getPropertyValue(property) ? [`${property}:${probe.getPropertyValue(property)}`] : [];
    });
    return declarations.length ? `${selector.trim()}{${declarations.join(';')}}` : '';
  }).join('\n');
}
