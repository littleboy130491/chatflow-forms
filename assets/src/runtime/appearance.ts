const properties = new Set(['color', 'background-color', 'border-color', 'border-radius', 'border-width', 'border-style', 'padding', 'padding-inline', 'padding-block', 'margin', 'margin-inline', 'margin-block', 'gap', 'font-size', 'font-weight', 'font-family', 'line-height', 'text-align', 'text-decoration', 'letter-spacing', 'max-width', 'min-height', 'width', 'height', 'opacity']);
const unsafe = /[\\@<>]|url\s*\(|expression\s*\(|image-set\s*\(|attr\s*\(|paint\s*\(|element\s*\(/i;

export function safeColor(value: string | undefined): string | undefined {
  if (!value || unsafe.test(value) || /var\s*\(/i.test(value)) return undefined;
  const probe = document.createElement('span').style; probe.color = value;
  return probe.color || undefined;
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
