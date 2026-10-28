/**
 * Custom frontends: a theme can replace the chat UI while the plugin keeps
 * sessions, validation, branching, spam protection and the REST protocol.
 *
 *   window.ChatFlow.registerFrontend(({ api, root }) => {
 *     const draw = () => { root.textContent = api.getState().activeStep?.label ?? ''; };
 *     draw(); return api.subscribe(draw);   // the returned function runs on unmount
 *   });
 *
 * Only this module's types are a public contract; everything else is internal.
 */
import { interpolate } from '../shared/logic';
import { isOpen } from '../shared/hours';
import { isWhatsapp } from '../shared/whatsapp';
import { answerLabel, interpolateLink, interpolateMarkdown, markdownText, safeLink } from './content';
import { formLocale, phrases } from './i18n';
import type { RuntimeController } from './controller';
import type { AnswerMap, PublicForm, Step } from './types';

export const FRONTEND_API_VERSION = 1;

export interface FrontendState {
  /** loading → (resume) → ready → submitting → done; "error" when the form cannot load. */
  phase: 'loading' | 'resume' | 'ready' | 'submitting' | 'done' | 'error';
  form: { id: number; title: string; bot: PublicForm['form']['schema']['bot']; appearance: PublicForm['form']['appearance'] } | null;
  /** Steps shown so far, in order, ending with the active one. */
  steps: Step[];
  /** The step waiting for an answer; null on the final review and after submitting. */
  activeStep: Step | null;
  answers: AnswerMap;
  progress: number;
  busy: boolean;
  offline: boolean;
  /** A phrase key (see api.phrase) describing the last failure, e.g. "error", "expired", "captchaFailed". */
  error: string | null;
  /** A phrase key for the active step's validation problem, e.g. "invalid" or "required". */
  fieldError: string | null;
  conflict: boolean;
  newerVersion: boolean;
  canSkip: boolean;
  /** Ending messages (Markdown) and buttons once submitted. */
  completion: { messages: string[]; buttons: { id: string; label: string; action: string; url?: string }[]; redirectUrl?: string } | null;
  /** The direct contact button, already filtered by its working hours. */
  contact: { url: string; label: string; whatsapp: boolean } | null;
  contactClosedMessage: string | null;
}

export interface FrontendApi {
  version: number;
  getState(): FrontendState;
  /** Called after every state change; returns an unsubscribe function. */
  subscribe(listener: (state: FrontendState) => void): () => void;
  /** Answer the active step. Values follow the field type (string, number, boolean, string[] …). */
  answer(value: unknown): Promise<void>;
  /** Acknowledge a statement or confirm the review step. */
  next(): Promise<void>;
  skip(): Promise<void>;
  back(): void;
  edit(stepId: string): void;
  restart(): Promise<void>;
  /** Submit from the final review. */
  submit(): Promise<void>;
  retry(): Promise<void>;
  continueSaved(): Promise<void>;
  resolveConflict(keepThisTab: boolean): Promise<void>;
  upload(file: File): Promise<{ uploadId: string; name: string; mime: string; bytes: number }>;
  /** Report a click on the contact button (dispatches the cff:contact event). */
  contactClicked(): void;
  /** The current value to pre-fill an input with (saved answer, prefill or default). */
  inputValue(step: Step): unknown;
  /** Human-readable answer, e.g. option labels instead of values. */
  answerLabel(step: Step, value: unknown): string;
  /** Translated UI text for a phrase key (honours the form's phrase overrides). */
  phrase(key: string): string;
  /** Merge tags replaced with answers, as plain text. */
  text(template: string): string;
  /** Merge tags replaced with escaped answers, as Markdown for api.html(). */
  markdown(template: string): string;
  /** Safe HTML for bot copy: **bold**, *italic* and [links](https://…) only; everything else is escaped. */
  html(markdownText: string): string;
  /** A link with merge tags URL-encoded, or null when the URL is not http(s), mailto: or tel:. */
  link(template: string): string | null;
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

/** Same Markdown subset as the built-in chat, produced as an escaped HTML string. */
export function markdownHtml(text: string): string {
  const pattern = /\\([\\[\]()*])|\[((?:\\.|[^\]\\\n])+)\]\(([^\s)]+)\)|\*\*((?:\\.|[^*\\\n])+)\*\*|\*((?:\\.|[^*\\\n])+)\*/g;
  let out = '', last = 0;
  for (const match of text.matchAll(pattern)) {
    out += escapeHtml(text.slice(last, match.index));
    if (match[1]) out += escapeHtml(match[1]);
    else if (match[2] && match[3]) { const href = safeLink(match[3]); const label = escapeHtml(markdownText(match[2])); out += href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>` : label; }
    else if (match[4]) out += `<strong>${escapeHtml(markdownText(match[4]))}</strong>`;
    else if (match[5]) out += `<em>${escapeHtml(markdownText(match[5]))}</em>`;
    last = match.index + match[0].length;
  }
  return out + escapeHtml(text.slice(last));
}

export function frontendApi(controller: RuntimeController, honeypot: () => string = () => ''): FrontendApi {
  const phrase = (key: string) => phrases(formLocale(controller.state.form?.form.language, controller.options.locale ?? 'en'), controller.state.form?.form.phrases)(key);
  const text = (template: string) => interpolate(template, controller.state.answers, controller.meta);
  const getState = (): FrontendState => {
    const state = controller.state, form = state.form?.form;
    const contact = form?.schema.bot.contact;
    const url = contact?.url ? safeLink(interpolateLink(contact.url, state.answers, controller.meta)) : null;
    const open = isOpen(contact?.hours, new Date());
    return {
      phase: state.phase,
      form: form ? { id: form.id, title: form.title, bot: form.schema.bot, appearance: form.appearance } : null,
      steps: controller.visibleSteps,
      activeStep: state.phase === 'ready' ? controller.activeStep ?? null : null,
      answers: { ...state.answers },
      progress: state.phase === 'done' ? 100 : state.path?.progress ?? 0,
      busy: state.busy, offline: state.offline, error: state.error, fieldError: state.fieldError,
      conflict: state.conflict, newerVersion: state.newerVersion,
      canSkip: state.phase === 'ready' && controller.canSkip,
      completion: state.completion ? { messages: state.completion.ending.messages, buttons: state.completion.ending.buttons, ...(state.completion.redirectUrl ? { redirectUrl: state.completion.redirectUrl } : {}) } : null,
      contact: url && open ? { url, label: contact?.label || phrase(isWhatsapp(url) ? 'whatsapp' : 'contactUs'), whatsapp: isWhatsapp(url) } : null,
      contactClosedMessage: url && !open && contact?.hours?.outside === 'message' && contact.hours.message ? text(contact.hours.message) : null,
    };
  };
  return {
    version: FRONTEND_API_VERSION,
    getState,
    subscribe: listener => controller.subscribe(() => listener(getState())),
    answer: value => controller.answer(value),
    next: async () => { await controller.answer(null); },
    skip: async () => { if (controller.canSkip) await controller.answer(null); },
    back: () => controller.back(),
    edit: id => controller.edit(id),
    restart: () => controller.restart(),
    submit: () => controller.submit(honeypot()),
    retry: () => controller.retry(),
    continueSaved: () => controller.continueSaved(),
    resolveConflict: keep => controller.resolveConflict(keep),
    upload: file => { const step = controller.activeStep; if (!step) return Promise.reject(new Error('No active step')); return controller.upload(step, file); },
    contactClicked: () => controller.contactClicked(),
    inputValue: step => controller.inputValue(step),
    answerLabel: (step, value) => answerLabel(step, value, phrase, controller.options.locale),
    phrase,
    text,
    markdown: template => interpolateMarkdown(template, controller.state.answers, controller.meta),
    html: markdownHtml,
    link: template => safeLink(interpolateLink(template, controller.state.answers, controller.meta)),
  };
}

export interface FrontendContext {
  api: FrontendApi;
  /** Your container, inside the form's shadow root (page CSS does not reach it). */
  root: HTMLElement;
  shadowRoot: ShadowRoot;
  /** The <cff-chat> element on the page. */
  host: HTMLElement;
  mode: 'inline' | 'fullpage' | 'launcher' | 'popup';
  preview: boolean;
  /** Closes the launcher/popup panel (no-op inline). */
  close(): void;
}
/** Render the UI; return a cleanup function, or nothing. */
export type Frontend = (context: FrontendContext) => void | (() => void);
