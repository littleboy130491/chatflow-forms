import { getCountryCallingCode, isSupportedCountry, type CountryCode } from 'libphonenumber-js';
import type { JSONValue, Step, ReplayContext, ValidationIssue } from '../contracts';
import { age, choiceValue, dateParts, empty, isOtherAnswer, issue, matches, numeric, pointer, regex } from './value';

export const V1_FIELD_TYPES = ['short_text', 'long_text', 'email', 'phone', 'number', 'date', 'single_choice', 'multi_choice', 'yes_no', 'consent', 'hidden', 'statement', 'summary'] as const;
export const isDisplay = (type: string): boolean => ['statement', 'summary', 'media'].includes(type);
export function plainText(value: string, multiline = false): string {
  let text = value.replace(/\r\n?/g, '\n').replace(/<[^>]*>/g, '');
  text = [...text].filter(c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) !== 127 || ['\n', '\t'].includes(c)).join('');
  if (!multiline) text = text.replace(/[\t\n ]+/g, ' ');
  return text.replace(/^[ \t\n]+|[ \t\n]+$/g, '');
}
function phone(value: string, country: string): string {
  const text = value.replace(/^[ \t\n\r]+|[ \t\n\r]+$/g, '');
  if (!/^(?:\+|00)?[0-9 ()\-.]+$/.test(text)) return text;
  let digits = text.replace(/[ ()\-.]/g, '');
  if (digits.startsWith('00')) digits = '+' + digits.slice(2);
  if (digits.startsWith('+')) return digits;
  if (!isSupportedCountry(country as CountryCode)) return text;
  const code = getCountryCallingCode(country as CountryCode);
  if (digits.startsWith('0') && country !== 'IT') digits = digits.slice(1);
  else if (digits.startsWith(code)) return '+' + digits;
  return '+' + code + digits;
}
export function sanitizeAnswer(step: Step, value: JSONValue, context: ReplayContext = {}): JSONValue {
  void context;
  switch (step.type) {
    case 'single_choice': return isOtherAnswer(value) ? { value: value.value, other: plainText(value.other) } : value;
    case 'short_text': case 'long_text': case 'email': case 'date':
      return typeof value === 'string' ? plainText(value, step.type === 'long_text') : value;
    case 'phone': return typeof value === 'string' ? phone(value, step.settings?.country ?? 'ID') : value;
    case 'number':
      if (typeof value === 'string' && /^[ \t\n\r]*[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?[ \t\n\r]*$/.test(value) && Number.isFinite(Number(value))) return Number(value);
      return value;
    case 'statement': case 'summary': return null;
    default: return value;
  }
}

const email = (v: string): boolean => v.length <= 254 && /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}$/.test(v) &&
  v.split('@')[0]!.length <= 64 && !v.includes('..') && !v.startsWith('.') && !v.split('@')[0]!.endsWith('.') &&
  v.split('@')[1]!.split('.').every(p => p.length <= 63 && !p.startsWith('-') && !p.endsWith('-'));
const url = (v: string): boolean => /^(?:https?:\/\/)?[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}(?::[0-9]{1,5})?(?:[/?#][^\s<>]*)?$/.test(v) && !v.includes('..');

export function validateAnswer(step: Step, rawValue: JSONValue, context: ReplayContext = {}): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  const add = (code: string, message: string): void => { errors.push(issue('/answers/' + pointer(step.key), code, message, step.key)); };
  if (!(V1_FIELD_TYPES as readonly string[]).includes(step.type)) { add('unsupported_type', 'This field type is not supported.'); return errors; }
  if (isDisplay(step.type)) return errors;
  const value = sanitizeAnswer(step, rawValue, context);
  const required = step.required === true || step.type === 'consent';
  if (value === null) { if (required) add('required', 'An answer is required.'); return errors; }
  let typed = false;
  switch (step.type) {
    case 'number': typed = numeric(value); break;
    case 'yes_no': case 'consent': typed = typeof value === 'boolean'; break;
    case 'multi_choice': typed = Array.isArray(value) && value.every(v => typeof v === 'string'); break;
    case 'single_choice': typed = typeof value === 'string' || isOtherAnswer(value); break;
    case 'hidden': typed = typeof value === 'string' || typeof value === 'boolean' || numeric(value); break;
    default: typed = typeof value === 'string';
  }
  if (!typed) { add('type_mismatch', 'The answer has an invalid type.'); return errors; }
  if (required && (empty(value) || (step.type === 'consent' && value !== true))) { add('required', 'An answer is required.'); return errors; }
  if (empty(value)) return errors;
  const v = step.validation ?? {};
  if (typeof value === 'string') {
    const length = [...value].length;
    const max = v.maxLength ?? (step.type === 'long_text' ? 100000 : 10000);
    if (v.minLength !== undefined && length < v.minLength) add('min_length', 'The answer is too short.');
    if (length > max) add('max_length', 'The answer is too long.');
    if (v.pattern !== undefined) {
      if (!regex(v.pattern)) add('invalid_pattern', 'The validation pattern is not supported.');
      else if (!matches(value, v.pattern)) add('pattern', 'The answer does not match the pattern.');
    }
    if ((step.type === 'email' || v.format === 'email') && !email(value)) add('invalid_email', 'Enter a valid email address.');
    if (v.format === 'url' && !url(value)) add('invalid_url', 'Enter a valid website address.');
    if (step.type === 'phone' && !/^\+[1-9][0-9]{6,14}$/.test(value)) add('invalid_phone', 'Enter a valid international phone number.');
    if (step.type === 'date') {
      if (!dateParts(value)) add('invalid_date', 'Enter a valid date in YYYY-MM-DD format.');
      else {
        if (dateParts(v.min) && value < String(v.min)) add('min', 'The answer is below the minimum.');
        if (dateParts(v.max) && value > String(v.max)) add('max', 'The answer exceeds the maximum.');
        if (v.minAge !== undefined) {
          const years = age(value, context.now);
          if (years === null) add('invalid_context', 'A valid frozen UTC date is required.');
          else if (years < v.minAge) add('min_age', 'The minimum age is not met.');
        }
      }
    }
  }
  if (step.type === 'number' && numeric(value)) {
    if (numeric(v.min) && value < v.min) add('min', 'The answer is below the minimum.');
    if (numeric(v.max) && value > v.max) add('max', 'The answer exceeds the maximum.');
    if (v.step !== undefined) {
      const units = (value - (numeric(v.min) ? v.min : 0)) / v.step;
      if (Math.abs(units - Math.round(units)) > 1e-8) add('step', 'The answer does not match the allowed increment.');
    }
  }
  if (step.type === 'single_choice' || step.type === 'multi_choice') {
    const selected = (Array.isArray(value) ? value : [choiceValue(value)]) as string[];
    const options = step.options ?? [];
    if (selected.some(item => !options.some(o => o.value === item))) add('invalid_choice', 'Choose a configured option value.');
    if (step.type === 'single_choice') {
      const option = options.find(o => o.value === selected[0]);
      if (isOtherAnswer(value)) {
        if (!option?.isOther) add('invalid_other', 'Free text is only accepted for an Other option.');
        if (!value.other) add('required_other', 'Enter text for the Other option.');
        if ([...value.other].length > 1000) add('max_length', 'The answer is too long.');
      } else if (option?.isOther) add('required_other', 'Enter text for the Other option.');
    }
    if (new Set(selected).size !== selected.length) add('duplicate_choice', 'Choose each option only once.');
    if (selected.length > 1 && options.some(o => o.isExclusive && selected.includes(o.value))) add('exclusive_choice', 'An exclusive option cannot be combined.');
    if (step.type === 'multi_choice') {
      if (v.minSelections !== undefined && selected.length < v.minSelections) add('min_selections', 'Choose more options.');
      if (v.maxSelections !== undefined && selected.length > v.maxSelections) add('max_selections', 'Choose fewer options.');
    }
  }
  return errors;
}
