import type { AnswerMap, ReplayContext, ReplayResult, Step, PublicSchemaEnvelope, SessionEnvelope, SubmitResponse } from '../shared/contracts';
import type { TrackingOptions } from '../tracking';
export type { AnswerMap, ReplayContext, ReplayResult, Step };

export type PublicForm = PublicSchemaEnvelope;
export type Session = SessionEnvelope;
export type Completion = SubmitResponse;
export interface RuntimeOptions {
  form?: PublicForm; preview?: boolean; restUrl?: string; formId?: number; locale?: string;
  mode?: 'inline' | 'fullpage' | 'launcher'; prefill?: AnswerMap; context?: ReplayContext;
  tracking?: TrackingOptions;
}
export interface FieldProps {
  step: Step; value: unknown; disabled: boolean; error?: string;
  phrase: (key: string) => string; onAnswer: (value: unknown) => void;
}
