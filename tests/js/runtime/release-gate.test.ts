// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RuntimeController } from '../../../assets/src/runtime/controller';
import { ApiClient, ApiError } from '../../../assets/src/runtime/api';
import { phrases } from '../../../assets/src/runtime/i18n';
import { readPrefill, prefillUrl } from '../../../assets/src/shared/prefill';
import { contrastRatio } from '../../../assets/src/builder/contrast';
import { form, session } from './helpers';

beforeEach(() => { localStorage.clear(); document.cookie = 'cff_s_42=; Path=/; Max-Age=0'; });
describe('release integration regressions', () => {
  async function started() {
    const envelope = form(); envelope.features.uploads = true; envelope.form.session.magicLinks = {enabled: true, whatsapp: true};
    const api = new ApiClient('/cff/v1/'), expired = {...session(), requestExpiresAt: '2000-01-01T00:00:00Z'}, fresh = {...session(), requestToken: 'fresh-request'};
    vi.spyOn(api, 'startToken').mockResolvedValue({startToken: 'start', version: 1, expiresAt: '2099-01-01T00:00:00Z'});
    vi.spyOn(api, 'start').mockResolvedValue(expired); const renew = vi.spyOn(api, 'resume').mockResolvedValue(fresh);
    vi.spyOn(api, 'mutate').mockResolvedValue(fresh);
    const controller = new RuntimeController({form: envelope}, api); await controller.initialize(); await controller.start();
    return {controller, api, renew};
  }
  it('renews expired request credentials before an upload', async () => {
    const {controller, api, renew} = await started();
    const upload = vi.spyOn(api, 'upload').mockResolvedValue({uploadId: 'file', name: 'test.txt', bytes: 1, mime: 'text/plain'});
    await controller.upload(controller.state.form!.form.schema.steps[1]!, new File(['a'], 'test.txt'));
    expect(renew).toHaveBeenCalledOnce(); expect(upload.mock.calls[0]![0].requestToken).toBe('fresh-request');
  });
  it('renews expired request credentials before generic magic email issuance', async () => {
    const {controller, api, renew} = await started();
    const issue = vi.spyOn(api, 'magicLink').mockResolvedValue({accepted: true});
    await controller.magicLink('email'); expect(renew).toHaveBeenCalledOnce(); expect(issue.mock.calls[0]![0].requestToken).toBe('fresh-request');
  });
  it('does not mask failed renewal with a generic accepted response', async () => {
    const {controller, api, renew} = await started(); renew.mockRejectedValue(new ApiError('cff_session_expired', 401));
    const issue = vi.spyOn(api, 'magicLink'); await expect(controller.magicLink('email')).rejects.toThrow(); expect(issue).not.toHaveBeenCalled();
  });
  it('only permits preview step jumping without sessions or network', async () => {
    const preview = new RuntimeController({form: form(), preview: true}, null); await preview.initialize();
    expect(preview.jumpToStep('review')).toBe(true); expect(preview.state.activeId).toBe('review'); expect(preview.jumpToStep('absent')).toBe(false);
    const {controller} = await started(); expect(controller.jumpToStep('review')).toBe(false);
  });
  it('provides editable URL hints but never pre-fills consent or hidden answers', () => {
    const schema = form().form.schema;
    const url = prefillUrl('https://example.test/chat/survey/', {name: 'A & B', unknown: 'secret'}, schema);
    expect(readPrefill(new URL(url).search, schema)).toEqual({name: 'A & B'});
    expect(readPrefill('?cff_prefill[intro]=unsafe&cff_prefill[name]=' + 'x'.repeat(2001), schema)).toEqual({});
    expect(() => prefillUrl('javascript:alert(1)', {}, schema)).toThrow();
  });
  it('calculates standard contrast ratios without falsely passing unsupported colors', () => {
    expect(contrastRatio('#000', '#fff')).toBe(21); expect(contrastRatio('#fff', '#fff')).toBe(1); expect(contrastRatio('transparent', '#fff')).toBeNull();
  });
  it('localizes all magic-link consent/buttons/statuses in English and Indonesian', () => {
    for (const key of ['magicEmailConfirm', 'magicEmailAccepted', 'magicEmailError', 'magicEmail', 'magicShareConfirm', 'magicShareError', 'magicCopied', 'magicCancelled', 'magicShare']) {
      expect(phrases('en')(key)).not.toBe(key); expect(phrases('id_ID')(key)).not.toBe(phrases('en')(key));
    }
  });
});
