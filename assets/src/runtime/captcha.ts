import type { EngagementConfig } from './engagement';

interface Widget { render(element: HTMLElement, options: Record<string, unknown>): string | number; remove(id: string | number): void }
interface Recaptcha { ready(callback: () => void): void; execute(key: string, options: { action: string }): Promise<string> }
declare global { interface Window { turnstile?: Widget; hcaptcha?: Widget; grecaptcha?: Recaptcha } }
const loads = new Map<string, Promise<void>>();
function load(url: string): Promise<void> {
  const previous = loads.get(url); if (previous) return previous;
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script'); const timer = setTimeout(() => { script.remove(); reject(new Error('captchaUnavailable')); }, 15000);
    script.src = url; script.async = true; script.onload = () => { clearTimeout(timer); resolve(); }; script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('captchaUnavailable')); }; document.head.append(script);
  }); loads.set(url, promise); void promise.catch(() => loads.delete(url)); return promise;
}
export async function captchaToken(config: EngagementConfig['captcha'], container: HTMLElement): Promise<string> {
  if (config.provider === 'none') return '';
  if (!config.siteKey) throw new Error('captchaUnavailable');
  if (config.provider === 'recaptcha') {
    await load(`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(config.siteKey)}`);
    return new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('captchaUnavailable')), 120000); window.grecaptcha?.ready(() => { void window.grecaptcha!.execute(config.siteKey, { action: 'cff_submit' }).then(token => { clearTimeout(timer); resolve(token); }, error => { clearTimeout(timer); reject(error); }); }); });
  }
  const provider = config.provider;
  await load(provider === 'turnstile' ? 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit' : 'https://js.hcaptcha.com/1/api.js?render=explicit');
  const widget = provider === 'turnstile' ? window.turnstile : window.hcaptcha;
  if (!widget) throw new Error('captchaUnavailable');
  return new Promise((resolve, reject) => {
    let id: string | number | undefined;
    let finished = false;
    const done = (token?: string) => { if (finished) return; finished = true; clearTimeout(timer); if (id !== undefined) widget.remove(id); if (token) resolve(token); else reject(new Error('captchaUnavailable')); };
    const timer = setTimeout(() => done(), 120000);
    try { id = widget.render(container, { sitekey: config.siteKey, action: 'cff_submit', callback: (token: string) => done(token), 'error-callback': () => done(), 'expired-callback': () => done() }); }
    catch { done(); }
  });
}
