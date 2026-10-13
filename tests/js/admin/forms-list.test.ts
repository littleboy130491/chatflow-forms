// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminApi, type AdminConfig } from '../../../assets/src/builder/api';
import { formsListAction, mountFormsList } from '../../../assets/src/builder/forms-list';
import { downloadForm } from '../../../assets/src/builder/formIO';
vi.mock('../../../assets/src/builder/formIO', () => ({ downloadForm: vi.fn() }));
const config: AdminConfig = { restUrl: 'https://example.test/wp-json/cff/v1/', nonce: 'fixture-nonce', pluginUrl: 'https://example.test/plugin/', locale: 'en', screen: 'forms', features: { fieldTypes: [], uploads: false, xlsx: false }, capabilities: { manage_forms: true }, adminUrl: 'https://example.test/wp-admin/admin.php' };
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.replaceChildren(); });
describe('native Forms table REST-backed actions', () => {
  it('duplicates through capability/nonce REST POST and navigates to the dedicated builder', async () => {
    const transport = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 21 }), { status: 201 }));
    const url = await formsListAction(new AdminApi(config, transport), 'duplicate', 12);
    expect(url).toBe('https://example.test/wp-admin/admin.php?page=cff-builder&formId=21');
    expect(transport.mock.calls[0]?.[0]).toBe(config.restUrl + 'admin/forms/12/duplicate');
    expect(transport.mock.calls[0]?.[1]).toMatchObject({ method: 'POST', headers: expect.objectContaining({ 'X-WP-Nonce': 'fixture-nonce' }) });
  });
  it('requires confirmation and uses DELETE, never GET, to trash', async () => {
    const transport = vi.fn().mockResolvedValue(new Response('{}')); vi.spyOn(window, 'confirm').mockReturnValue(false);
    const api = new AdminApi(config, transport); await formsListAction(api, 'trash', 12); expect(transport).not.toHaveBeenCalled();
    vi.spyOn(window, 'confirm').mockReturnValue(true); expect(await formsListAction(api, 'trash', 12)).toBe('reload'); expect(transport.mock.calls[0]?.[1]).toMatchObject({ method: 'DELETE' });
  });
  it('exports authorized JSON and copies only the literal shortcode', async () => {
    const transport = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 12 }))); const copy = vi.fn().mockResolvedValue(undefined); Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: copy } });
    await formsListAction(new AdminApi(config, transport), 'export', 12); expect(downloadForm).toHaveBeenCalledWith({ id: 12 });
    await formsListAction(new AdminApi(config, transport), 'copy', 12); expect(copy).toHaveBeenCalledWith('[chatflow id="12"]');
  });
  it('bounds capabilities/actions/identifiers and presents errors as text', async () => {
    const api = new AdminApi(config, vi.fn()); await expect(formsListAction(api, 'invalid', 1)).rejects.toThrow(); await expect(formsListAction(api, 'copy', NaN)).rejects.toThrow();
    await expect(formsListAction(new AdminApi({ ...config, capabilities: {} }), 'copy', 1)).rejects.toThrow();
    const root = document.createElement('div'); root.innerHTML = '<div data-cff-status></div><button data-cff-action="invalid" data-form-id="1"><span>Click</span></button>'; document.body.append(root); mountFormsList(root, config); root.querySelector<HTMLSpanElement>('span')!.click(); await new Promise(resolve => setTimeout(resolve, 0));
    expect(root.querySelector('[data-cff-status]')?.textContent).toBe('Invalid form action.'); expect(root.querySelector('button')?.disabled).toBe(false);
  });
});
