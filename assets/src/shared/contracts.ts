import type { ChatFlowFormSchemaV1, Step, Ending, Condition, Action } from './schema.generated';
import type { ChatFlowPrivateFormSettingsV1 } from './settings.generated';

export type { Step, Ending, Condition, Action };
export type FormSchema = ChatFlowFormSchemaV1;
export type FormSettings = ChatFlowPrivateFormSettingsV1;
export type Field = Step;
export type JSONValue = null | boolean | number | string | JSONValue[] | { [key: string]: JSONValue };
export type AnswerMap = Record<string, JSONValue>;
export interface ValidationIssue { path: string; code: string; message: string; fieldKey?: string }
export interface ReplayContext { hidden?: AnswerMap; url?: AnswerMap; meta?: AnswerMap; now?: string; defaultEndingId?: string }
export interface ReplayResult {
  visited: string[]; answers: AnswerMap; variables: AnswerMap; currentStepId: string | null;
  endingId: string | null; progress: number; errors: ValidationIssue[]; discardedKeys: string[];
}
export interface FormDTO {
  id: number; title: string; slug: string; schema: FormSchema; settings: FormSettings;
  version: number; draftRevision: number; status: 'draft' | 'publish';
}
export interface ClientMeta {
  pageUrl?: string; referrer?: string; landingPage?: string; landingReferrer?: string;
  utm?: { source?: string; medium?: string; campaign?: string; term?: string; content?: string };
  clickIds?: { gclid?: string; fbclid?: string; msclkid?: string; ttclid?: string };
  locale?: string; timezone?: string; screen?: string; stepTimings?: Record<string, number>;
}
export interface PublicSchemaEnvelope {
  form: { id: number; title: string; slug: string; version: number; schema: FormSchema;
    appearance: NonNullable<FormSettings['appearance']>; phrases: NonNullable<FormSettings['phrases']>;
    session: { resumeEnabled: boolean; resumePrompt: boolean; resumeDays: number; savePartial: boolean } };
  features: { fieldTypes: string[]; uploads: boolean };
}
export interface SessionEnvelope {
  sessionId: string; formId: number; version: number; revision: number;
  status: 'active' | 'completed' | 'closed' | 'expired'; answers: AnswerMap; visited: string[];
  currentStepId: string | null; progress: number; requestToken: string; requestExpiresAt: string;
  resumeToken?: string; resumeExpiresAt?: string; context: ReplayContext;
}
export interface StartTokenResponse { startToken: string; expiresAt: string; version: number }
export interface SubmitResponse {
  submission: { uuid: string; status: 'completed' };
  ending: { id: string; type: 'message' | 'redirect'; messages: string[]; buttons: NonNullable<Ending['buttons']> };
  redirectUrl?: string;
}
export interface AdminConfig {
  restUrl: string; nonce: string; pluginUrl: string; screen: 'builder' | 'submissions' | 'settings';
  formId?: number; locale: string; features: { fieldTypes: string[]; uploads: boolean };
}
export interface RestError { code: string; message: string; data: { status: number; errors?: ValidationIssue[];
  retryAfter?: number; draftRevision?: number; revision?: number } }
export interface Page<T> { items: T[]; total: number; page: number; perPage: number }
