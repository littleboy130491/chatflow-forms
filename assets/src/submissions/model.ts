import type { FormDTO } from '../builder/api';
export type Status = 'completed' | 'partial' | 'abandoned' | 'spam' | 'trash';
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
