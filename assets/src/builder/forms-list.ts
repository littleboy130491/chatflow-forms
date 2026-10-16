import { __ } from '@wordpress/i18n';
import { AdminApi, can, errorMessage, type AdminConfig, type FormDTO } from './api';
import { downloadForm } from './formIO';

export async function formsListAction(api: AdminApi, action: string, id: number): Promise<string | void> {
  if (!can(api.config, 'manage_forms') || !Number.isSafeInteger(id) || id <= 0) throw new Error(__('You cannot manage forms.', 'chatflow-forms'));
  if (action === 'copy') return navigator.clipboard.writeText(`[chatflow id="${id}"]`);
  if (action === 'export') return downloadForm(await api.request<FormDTO>(`admin/forms/${id}`));
  if (action === 'duplicate') {
    const form = await api.request<FormDTO>(`admin/forms/${id}/duplicate`, 'POST', {});
    const url = new URL(api.config.adminUrl ?? 'admin.php', window.location.href);
    url.searchParams.set('page', 'cff-builder'); url.searchParams.set('formId', String(form.id));
    return url.href;
  }
  if (action === 'trash') {
    if (!window.confirm(__('Trash this form? New visitors cannot start it afterwards.', 'chatflow-forms'))) return;
    await api.request(`admin/forms/${id}`, 'DELETE'); return 'reload';
  }
  throw new Error(__('Invalid form action.', 'chatflow-forms'));
}

export function mountFormsList(root: HTMLElement, config: AdminConfig = window.cffAdmin): void {
  const api = new AdminApi(config); let busy = false;
  root.addEventListener('click', event => {
    // Destructive links (Delete permanently) carry their own confirmation copy.
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-cff-confirm]');
    if (link && root.contains(link)) {
      if (!window.confirm(link.dataset.cffConfirm ?? '')) event.preventDefault();
      return;
    }
    const button = (event.target as Element).closest<HTMLButtonElement>('button[data-cff-action]');
    if (!button || !root.contains(button)) return;
    event.preventDefault(); if (busy) return;
    busy = true; button.disabled = true;
    const status = root.querySelector<HTMLElement>('[data-cff-status]');
    if (status) status.textContent = __('Working…', 'chatflow-forms');
    void formsListAction(api, button.dataset.cffAction ?? '', Number(button.dataset.formId)).then(result => {
      if (result === 'reload') window.location.reload();
      else if (result) window.location.assign(result);
      else if (status) status.textContent = __('Action complete.', 'chatflow-forms');
    }).catch(error => { if (status) status.textContent = errorMessage(error); }).finally(() => { busy = false; button.disabled = false; });
  });
}
