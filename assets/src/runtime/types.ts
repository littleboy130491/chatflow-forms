import type { AnswerMap, ReplayContext, ReplayResult, Step, PublicSchemaEnvelope, SessionEnvelope, SubmitResponse } from '../shared/contracts';
import type { TrackingOptions } from '../tracking';
export type { AnswerMap, ReplayContext, ReplayResult, Step };

export type PublicForm = PublicSchemaEnvelope & { features: PublicSchemaEnvelope['features'] & { engagement?: boolean } };
export type Session = SessionEnvelope;
export type Completion = SubmitResponse;
export interface RuntimeOptions {
  form?: PublicForm; preview?: boolean; restUrl?: string; formId?: number; locale?: string;
  mode?: 'inline' | 'fullpage' | 'launcher' | 'popup'; prefill?: AnswerMap; context?: ReplayContext;
  tracking?: TrackingOptions;
  analyticsOptOut?: boolean;
  captcha?: (config: import('./engagement').EngagementConfig['captcha']) => Promise<string>;
}
export interface FieldProps {
  step: Step; value: unknown; disabled: boolean; error?: string;
  phrase: (key: string) => string; onAnswer: (value: unknown) => void;
  upload?: (file: File) => Promise<{ uploadId: string; name: string; mime: string; bytes: number }>;
}
