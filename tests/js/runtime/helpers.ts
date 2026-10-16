import type { AnswerMap, PublicForm, Session, Step } from '../../../assets/src/runtime/types';

export function form(steps?: [Step, ...Step[]]): PublicForm {
  return { form: { id: 42, title: 'Survey', slug: 'survey', version: 1, appearance: {}, phrases: {}, session: { resumeEnabled: true, resumePrompt: true, resumeDays: 30, savePartial: true }, schema: { schemaVersion: 1, bot: { name: 'Ima', typingSpeed: 'off' }, steps: steps ?? [
    { id: 'intro', key: 'intro', type: 'statement', label: 'Intro', messages: ['Hello {{name}}'] },
    { id: 'name', key: 'name', type: 'short_text', label: 'Name', required: true, messages: ['What is your name?'] },
    { id: 'review', key: 'review', type: 'summary', label: 'Review', messages: ['Check your answers'] },
  ], endings: [{ id: 'thanks', type: 'message', messages: ['Thanks {{name}}'], buttons: [] }] } }, features: { fieldTypes: ['statement', 'short_text', 'summary'], uploads: false, engagement: false } };
}
export const clock = '2026-10-13T00:00:00.000Z';
export function session(answers: AnswerMap = {}, revision = 1, version = 1): Session {
  return { sessionId: '12345678-1234-4234-8234-123456789abc', formId: 42, version, revision, status: 'active', answers, visited: [], currentStepId: 'name', progress: 0, requestToken: 'test-request', requestExpiresAt: '2099-01-01T00:00:00Z', resumeToken: 'r1.random.4070908800.signature', resumeExpiresAt: '2099-01-01T00:00:00Z', context: { now: clock, hidden: { server: 'trusted' }, url: {}, meta: {} } };
}
