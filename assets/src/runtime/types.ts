import type { AnswerMap, ReplayContext, ReplayResult, Step, PublicSchemaEnvelope, SessionEnvelope, SubmitResponse } from '../shared/contracts';
export type { AnswerMap, ReplayContext, ReplayResult, Step };

export type PublicForm = PublicSchemaEnvelope & { form: { media?: Record<string, { url: string; alt?: string }> } };
export type Session = SessionEnvelope;
export type Completion = SubmitResponse;
export interface RuntimeOptions {
  form?: PublicForm; preview?: boolean; restUrl?: string; formId?: number; locale?: string;
  mode?: 'inline' | 'fullpage'; prefill?: AnswerMap; context?: ReplayContext;
  tracking?: { enabled?: boolean; consentRequired?: boolean; consentGranted?: boolean; days?: number };
}
export interface FieldProps {
  step: Step; value: unknown; disabled: boolean; error?: string;
  phrase: (key: string) => string; onAnswer: (value: unknown) => void;
}
