import { __ } from '@wordpress/i18n';
import type { AdminApi, FormDTO, FormSchema, FormSettings } from './api';
export interface FormFile {
  format: 'chatflow/form';
  version: 1;
  title: string;
  schema: FormSchema;
  settings: FormSettings;
}
export function exportForm(form: FormDTO): FormFile {
  const settings = structuredClone(form.settings);
  if (settings.integrations?.webhooks)
    settings.integrations.webhooks = settings.integrations.webhooks.map((hook) => ({
      ...hook,
      secret: '',
      enabled: false,
    })) as NonNullable<NonNullable<FormSettings['integrations']>['webhooks']>;
  return {
    format: 'chatflow/form',
    version: 1,
    title: form.title,
    schema: structuredClone(form.schema),
    settings,
  };
}
export function parseFormFile(json: string): FormFile {
  if (new TextEncoder().encode(json).length > 1048576)
    throw new Error(__('Form file exceeds 1 MiB.', 'chatflow-forms'));
  const data: unknown = JSON.parse(json);
  if (
    !data ||
    typeof data !== 'object' ||
    !('format' in data) ||
    data.format !== 'chatflow/form' ||
    !('version' in data) ||
    data.version !== 1 ||
    !('title' in data) ||
    typeof data.title !== 'string' ||
    !('schema' in data) ||
    !data.schema ||
    typeof data.schema !== 'object' ||
    !('schemaVersion' in data.schema) ||
    data.schema.schemaVersion !== 1 ||
    !('steps' in data.schema) ||
    !Array.isArray(data.schema.steps) ||
    !('endings' in data.schema) ||
    !Array.isArray(data.schema.endings) ||
    !('settings' in data) ||
    !data.settings ||
    typeof data.settings !== 'object' ||
    Array.isArray(data.settings)
  )
    throw new Error(__('Invalid ChatFlow form file.', 'chatflow-forms'));
  const form = data as FormFile;
  // Imported JSON is untrusted: never activate or preserve outbound webhook credentials.
  const settings = structuredClone(form.settings);
  if (Array.isArray(settings.integrations?.webhooks))
    settings.integrations.webhooks = settings.integrations.webhooks.map((hook) => ({
      ...hook,
      secret: '',
      enabled: false,
    })) as NonNullable<NonNullable<FormSettings['integrations']>['webhooks']>;
  return { ...form, settings };
}
/** Import as a new unpublished draft, using server-side schema and settings validation. */
export async function importForm(json: string, api: Pick<AdminApi, 'request'>): Promise<FormDTO> {
  const file = parseFormFile(json);
  return api.request<FormDTO>('admin/forms', 'POST', {
    title: file.title,
    schema: file.schema,
    settings: file.settings,
  });
}
export function downloadForm(form: FormDTO): void {
  const url = URL.createObjectURL(
      new Blob([JSON.stringify(exportForm(form), null, 2)], { type: 'application/json' }),
    ),
    link = document.createElement('a');
  link.href = url;
  link.download = `chatflow-form-${form.id}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
