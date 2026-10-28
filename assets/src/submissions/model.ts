import { __ } from '@wordpress/i18n';
import type { FormDTO } from '../builder/api';
export type Status = 'completed' | 'partial' | 'abandoned' | 'spam' | 'trash';
export const statuses: Status[] = ['completed', 'partial', 'abandoned', 'spam', 'trash'];
/** Translated label for a stored submission status. */
export function statusLabel(status: string): string {
  const labels: Record<Status, string> = {
    completed: __('Completed', 'chatflow-forms'),
    partial: __('Partial', 'chatflow-forms'),
    abandoned: __('Abandoned', 'chatflow-forms'),
    spam: __('Spam', 'chatflow-forms'),
    trash: __('Trash', 'chatflow-forms'),
  };
  return labels[status as Status] ?? status;
}
export interface SubmissionDTO {
  id: number;
  uuid: string;
  formId: number;
  formVersion: number;
  status: Status;
  answers: Record<string, unknown>;
  meta: Record<string, unknown>;
  endingId: string;
  createdAt: string;
  updatedAt: string;
  durationMs: number;
  isRead: boolean;
  isStarred: boolean;
  visited: string[];
  currentStepId: string | null;
  progress: number;
  consent: Record<string, unknown>;
}
export interface SubmissionDetail extends SubmissionDTO {
  form: FormDTO | null;
  notes: { id: number; kind: string; message: string; userId: number; createdAt: string }[];
}
export interface Filters extends Record<string, string | number | boolean | undefined> {
  formId?: number;
  status?: Status;
  from?: string;
  to?: string;
  search?: string;
  isRead?: boolean;
  isStarred?: boolean;
  utmSource?: string;
  utmCampaign?: string;
  device?: string;
  fieldKey?: string;
  operator?: string;
  value?: string;
}
export const answerOperators = [
  'eq',
  'neq',
  'contains',
  'gt',
  'gte',
  'lt',
  'lte',
  'is_empty',
  'is_not_empty',
];
export function displayValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(displayValue).join(', ');
  if (typeof value === 'object')
    return Object.entries(value)
      .map(([key, entry]) => `${key}: ${displayValue(entry)}`)
      .join(', ');
  return String(value);
}
export function freezeFilters(filters: Filters): Filters {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''),
  ) as Filters;
}
export interface ExportOptions {
  formId?: number;
  filters: Filters;
  ids?: number[];
  columns: string[];
  headerStyle: 'labels' | 'keys';
  delimiter: ',' | ';';
  format: 'csv' | 'xlsx';
}
export interface ExportJob {
  exportId: number;
  status: 'queued' | 'running' | 'ready' | 'failed' | 'expired';
  rowCount?: number;
  downloadUrl?: string;
  expiresAt?: string;
  message?: string;
}
export type PurgeCriteria = Pick<Filters, 'formId' | 'status' | 'from' | 'to'> & { olderThanDays?: number };
export interface PurgePreview {
  count: number;
  fileCount: number;
  confirmationToken: string;
}
export interface PurgeJob {
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  deleted?: number;
  total?: number;
  message?: string;
}
export function exportOptions(
  filters: Filters,
  ids: number[],
  columns: string[],
  headerStyle: 'labels' | 'keys',
  delimiter: ',' | ';',
  format: 'csv' | 'xlsx' = 'csv',
): ExportOptions {
  return {
    ...(filters.formId ? { formId: filters.formId } : {}),
    filters: freezeFilters(filters),
    ...(ids.length ? { ids: [...ids] } : {}),
    columns: [...columns],
    headerStyle,
    delimiter,
    format,
  };
}

/** Short response identity; UUID remains available in detail metadata. */
export function responseLabel(id: number): string {
  return `${__('Response', 'chatflow-forms')} #${id}`;
}
export function readableDate(value: string, timeZone = 'UTC'): string {
  // Database timestamps without an offset are UTC, not the viewer's local time.
  const date = new Date(/^\d{4}-\d{2}-\d{2} \d{2}:/.test(value) ? value.replace(' ', 'T') + 'Z' : value);
  if (Number.isNaN(date.getTime())) return value;
  // WordPress reports a manual offset as "+07:00"; Intl expects an IANA zone.
  const offset = /^([+-])(\d{2}):(\d{2})$/.exec(timeZone);
  if (offset) {
    const minutes = (offset[1] === '-' ? -1 : 1) * (Number(offset[2]) * 60 + Number(offset[3]));
    const shifted = new Date(date.getTime() + minutes * 60000);
    return `${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(shifted)} (UTC${timeZone})`;
  }
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(date);
  } catch {
    return `${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(date)} UTC`;
  }
}
export function operatorLabel(operator: string): string {
  const labels: Record<string, string> = {
    eq: __('Equals', 'chatflow-forms'), neq: __('Does not equal', 'chatflow-forms'),
    contains: __('Contains', 'chatflow-forms'), gt: __('Greater than', 'chatflow-forms'),
    gte: __('Greater than or equal to', 'chatflow-forms'), lt: __('Less than', 'chatflow-forms'),
    lte: __('Less than or equal to', 'chatflow-forms'), is_empty: __('Is empty', 'chatflow-forms'),
    is_not_empty: __('Is not empty', 'chatflow-forms'),
  };
  return labels[operator] ?? operator;
}
