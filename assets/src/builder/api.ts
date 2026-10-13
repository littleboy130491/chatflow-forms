import { __ } from '@wordpress/i18n';
export type { FormSchema, FormSettings, FormDTO, Page, Step, Condition, Ending } from '../shared/contracts';
export type { Rule, Option, Group } from '../shared/schema.generated';
import type { AdminConfig as SharedAdminConfig } from '../shared/contracts';
import type { FormSettings } from '../shared/contracts';
export type Capability =
  | 'manage_forms'
  | 'view_submissions'
  | 'edit_submissions'
  | 'delete_submissions'
  | 'export_submissions'
  | 'purge_submissions'
  | 'manage_settings';
export interface AdminConfig extends SharedAdminConfig {
  defaults?: FormSettings;
  capabilities?: Partial<Record<Capability, boolean>>;
  adminUrl?: string;
  siteUrl?: string;
  fullpageBase?: string;
  tools?: boolean;
  preview?: boolean;
  exportId?: number;
}
export function can(config: AdminConfig, cap: Capability): boolean {
  return config.capabilities?.[cap] === true;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly data: Record<string, unknown> = {},
  ) {
    super(message);
  }
}
export class AdminApi {
  constructor(
    public readonly config: AdminConfig,
    private readonly transport: typeof fetch = fetch,
  ) {}
  async request<T>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
    if (
      !path.startsWith('admin/') ||
      path.includes('..') ||
      path.includes('://') ||
      /\\|%2e|%2f|%5c/i.test(path.split('?')[0] ?? '')
    )
      throw new Error('Invalid admin API path');
    const response = await this.transport(this.config.restUrl + path, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'error',
      headers: { 'X-WP-Nonce': this.config.nonce, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      ...(signal ? { signal } : {}),
    });
    const json: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const error = json && typeof json === 'object' ? (json as Record<string, unknown>) : {};
      throw new ApiError(
        String(error.code ?? 'cff_http_error'),
        String(error.message ?? __('The request failed. Please try again.', 'chatflow-forms')),
        response.status,
        (error.data ?? {}) as Record<string, unknown>,
      );
    }
    return json as T;
  }
}
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : __('An unexpected error occurred.', 'chatflow-forms');
}
export function queryString(values: Record<string, unknown>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined && value !== '' && value !== null) query.set(key, String(value));
  return query.toString();
}
export function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value, window.location.href);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

declare global {
  interface Window {
    cffAdmin: AdminConfig;
    cffBlock: AdminConfig;
  }
}
