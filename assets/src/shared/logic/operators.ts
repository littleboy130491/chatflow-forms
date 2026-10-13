import type { AnswerMap, Condition, ReplayContext } from '../contracts';
import { age, dateParts, empty, equal, matches, numeric, own } from './value';

export function evaluateCondition(condition: Condition, answers: AnswerMap = {}, variables: AnswerMap = {}, context: ReplayContext = {}, depth = 0): boolean {
  if (depth > 64) return false;
  if ('all' in condition) return condition.all.every(c => evaluateCondition(c, answers, variables, context, depth + 1));
  if ('any' in condition) return condition.any.some(c => evaluateCondition(c, answers, variables, context, depth + 1));
  const source = { answer: answers, variable: variables, hidden: context.hidden ?? {}, url: context.url ?? {} }[condition.source ?? 'answer'];
  const left = own(source, condition.field) ? source[condition.field] : null;
  const right = condition.value ?? null;
  const contains = (): boolean => typeof left === 'string' && typeof right === 'string' ? left.includes(right) :
    Array.isArray(left) && left.some(v => equal(v, right));
  const inside = (): boolean => Array.isArray(right) && right.some(v => equal(left, v));
  switch (condition.op) {
    case 'eq': return equal(left, right);
    case 'neq': return !equal(left, right);
    case 'contains': return contains();
    case 'not_contains': return !contains();
    case 'in': return inside();
    case 'not_in': return !inside();
    case 'gt': return numeric(left) && numeric(right) && left > right;
    case 'gte': return numeric(left) && numeric(right) && left >= right;
    case 'lt': return numeric(left) && numeric(right) && left < right;
    case 'lte': return numeric(left) && numeric(right) && left <= right;
    case 'between': return numeric(left) && Array.isArray(right) && right.length === 2 && numeric(right[0]) && numeric(right[1]) && left >= right[0] && left <= right[1];
    case 'is_empty': return empty(left);
    case 'is_not_empty': return !empty(left);
    case 'starts_with': return typeof left === 'string' && typeof right === 'string' && left.startsWith(right);
    case 'matches': return matches(left, right);
    case 'date_before': return dateParts(left) !== null && dateParts(right) !== null && (left as string) < (right as string);
    case 'date_after': return dateParts(left) !== null && dateParts(right) !== null && (left as string) > (right as string);
    case 'age_gte': { const years = age(left, context.now); return years !== null && numeric(right) && right >= 0 && years >= right; }
    default: return false;
  }
}
