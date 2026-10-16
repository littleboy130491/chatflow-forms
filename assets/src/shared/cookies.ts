export const hiddenCookieSources = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'campaign', 'tracking', 'cff_locale', 'cff_theme'] as const;
export const cookieSourceMessage = 'Cookie sources are restricted to supported attribution/preference cookies.';
export function allowedCookieSource(name: string): boolean {
  return hiddenCookieSources.some(source => source === name);
}
