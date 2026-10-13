import { ApiClient } from './api';
import type { Session } from './types';

export interface EngagementConfig { captcha: { provider: 'none' | 'turnstile' | 'hcaptcha' | 'recaptcha'; siteKey: string }; analytics: { enabled: boolean; consentRequired: boolean; respectDnt: boolean } }
export type AnalyticsEvent = { event: 'view' | 'answer' | 'back' | 'abandon'; stepId?: string };
export function analyticsPermitted(config: EngagementConfig['analytics'], consent: boolean, optOut: boolean): boolean {
  const navigator = globalThis.navigator as Navigator & { globalPrivacyControl?: boolean };
  return config.enabled && !optOut && !navigator?.globalPrivacyControl && !(config.respectDnt && navigator?.doNotTrack === '1') && (!config.consentRequired || consent);
}
export class RuntimeAnalytics {
  private events: AnalyticsEvent[] = []; private sent = 0; private busy = false;
  constructor(private api: ApiClient, private config: EngagementConfig['analytics'], private consent: () => boolean, private optOut: () => boolean) {}
  add(event: AnalyticsEvent): void { if (analyticsPermitted(this.config, this.consent(), this.optOut()) && this.events.length + this.sent < 200) this.events.push(event); }
  async flush(session: Session): Promise<void> {
    if (this.busy) return;
    if (!analyticsPermitted(this.config, this.consent(), this.optOut())) { this.events = []; return; }
    this.busy = true;
    try {
      while (this.events.length) {
        const events = this.events.splice(0, 10); this.sent += events.length;
        await this.api.request(`sessions/${session.sessionId}/events`, 'POST', { events, consentGranted: this.consent(), optOut: this.optOut() }, { 'X-CFF-Request-Token': session.requestToken });
      }
    } catch { this.events = []; /* Analytics never blocks form completion and carries no answers. */ }
    finally { this.busy = false; }
  }
}
