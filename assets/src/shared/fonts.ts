export const googleFonts = ['Inter', 'Roboto', 'Open Sans'] as const;
export type GoogleFont = typeof googleFonts[number];
export const systemFont = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
export function googleFont(value: unknown): GoogleFont | undefined {
  return googleFonts.find(font => font === value);
}
export function googleFontUrl(font: GoogleFont): string {
  if (!googleFont(font)) throw new TypeError('Unsupported Google font.');
  const url = new URL('https://fonts.googleapis.com/css2');
  url.searchParams.set('family', `${font}:wght@400;600`);
  url.searchParams.set('display', 'swap');
  return url.href;
}
