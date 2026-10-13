import type { Action, AnswerMap, Condition, FormSchema, JSONValue, ReplayContext, ReplayResult, Step } from '../contracts';
import { diagnoseSchema } from './diagnostics';
import { bounded, calculate } from './calculation';
import { isDisplay, sanitizeAnswer, validateAnswer } from './fields';
import { interpolate } from './interpolate';
import { evaluateCondition } from './operators';
import { choiceValue, equal, issue, map, numeric, own, pointer } from './value';

export function hiddenValue(step: Step, answers: AnswerMap, context: ReplayContext): JSONValue {
  if (own(context.hidden ?? {}, step.key)) return context.hidden![step.key] ?? null;
  const source = step.settings?.source ?? 'default', key = step.settings?.sourceKey ?? step.key;
  if (source === 'url') return own(context.url ?? {}, key) ? context.url![key] ?? null : step.defaultValue ?? null;
  if (source === 'meta') return own(context.meta ?? {}, key) ? context.meta![key] ?? null : step.defaultValue ?? null;
  if (source === 'merge') return interpolate(String(step.defaultValue ?? ''), answers, context.meta);
  return source === 'cookie' ? null : step.defaultValue ?? null;
}

export function replay(schema: FormSchema, supplied: AnswerMap, context: ReplayContext = {}, mode: 'partial' | 'complete' = 'partial'): ReplayResult {
  const result: ReplayResult = { visited: [], answers: map(), variables: map(), currentStepId: null, endingId: null, progress: 0, errors: [], discardedKeys: [] };
  const errors = diagnoseSchema(schema).filter(e => !['potential_loop', 'unreachable_step', 'later_reference'].includes(e.code));
  result.errors.push(...errors);
  if (errors.some(e => e.code === 'invalid_schema')) { result.discardedKeys = Object.keys(supplied).sort(); return result; }
  if (mode !== 'partial' && mode !== 'complete') result.errors.push(issue('/mode', 'invalid_mode', 'Replay mode must be partial or complete.'));
  for (const v of schema.variables ?? []) result.variables[v.key] = v.default;
  const steps = schema.steps ?? [], byId = new Map(steps.map((s, i) => [s.id, i]));
  const byKey = new Map(steps.map(s => [s.key, s]));
  const visible = new Map(steps.map(s => [s.id, !s.hiddenByDefault]));
  const required = new Map(steps.map(s => [s.id, s.required === true || s.type === 'consent']));
  const seen = new Set<string>(), processed = new Set<string>(), discard = new Set<string>();
  const defaultEnding = schema.endings.some(e => e.id === context.defaultEndingId) ? context.defaultEndingId! : schema.endings[0]?.id ?? null;
  let index = 0, answeredInputs = 0;
  const apply = (action: Action, vars: AnswerMap, visibility: Map<string, boolean>, requirements: Map<string, boolean>, actionErrors = result.errors): void => {
    switch (action.action) {
      case 'show': case 'hide': visibility.set(action.to, action.action === 'show'); break;
      case 'require': case 'unrequire': requirements.set(action.to, action.action === 'require'); break;
      case 'set_variable': {
        const current = vars[action.key];
        if (action.operation === 'set') vars[action.key] = action.value;
        else if (numeric(current) && numeric(action.value)) {
          const next = current + (action.operation === 'add' ? action.value : -action.value);
          try { vars[action.key] = bounded(next); }
          catch { actionErrors.push(issue('/variables/' + pointer(action.key), 'invalid_variable', 'The variable value exceeds the finite calculation limit.')); }
        } else actionErrors.push(issue('/variables/' + pointer(action.key), 'invalid_variable', 'The variable action has an invalid type.'));
        break;
      }
    }
  };
  const rulesFor = (s: Step) => [...(s.logic ?? []), ...(s.options ?? []).filter(o => {
    const answer = choiceValue(result.answers[s.key]); return Array.isArray(answer) ? answer.includes(o.value) : answer === o.value;
  }).flatMap(o => o.logic ?? [])];
  if (!result.errors.length) {
    while (index < steps.length) {
      const step = steps[index]!;
      if (seen.has(step.id) || seen.size >= 1000) { result.currentStepId = step.id; result.errors.push(issue('/steps/' + index, 'cff_logic_loop', 'The logic path revisits a step.')); break; }
      seen.add(step.id);
      if (!visible.get(step.id)) { index++; continue; }
      result.visited.push(step.id);
      const display = isDisplay(step.type), hidden = step.type === 'hidden', computed = step.type === 'calculated';
      if (!display) {
        const exists = own(supplied, step.key);
        if (!hidden && !computed && !exists && (mode === 'partial' || required.get(step.id))) {
          result.currentStepId = step.id;
          if (mode === 'complete') result.errors.push(issue('/answers/' + pointer(step.key), 'required', 'An answer is required.', step.key));
          break;
        }
        let rawValue: JSONValue;
        try { rawValue = computed ? calculate(step.settings?.expression ?? '', result.answers, result.variables) : hidden ? hiddenValue(step, result.answers, context) : exists ? supplied[step.key] ?? null : null; }
        catch { result.currentStepId = step.id; result.errors.push(issue('/answers/' + pointer(step.key), 'calculation_error', 'The calculation is invalid or outside its limits.', step.key)); break; }
        const value = sanitizeAnswer(step, rawValue, context);
        processed.add(step.key);
        if (computed && exists) { discard.add(step.key); result.errors.push(issue('/answers/' + pointer(step.key), 'computed_answer_tampered', 'Calculated answers cannot be supplied by visitors.', step.key)); }
        if (hidden && exists && !equal(supplied[step.key], value)) {
          discard.add(step.key); result.errors.push(issue('/answers/' + pointer(step.key), 'hidden_answer_tampered', 'Hidden answers are server-derived.', step.key));
        }
        const validation = computed ? [] : validateAnswer({ ...step, required: required.get(step.id) === true }, rawValue, context);
        if (validation.length) { result.errors.push(...validation); result.currentStepId = step.id; if (exists) discard.add(step.key); break; }
        result.answers[step.key] = value;
        if (!hidden && !computed) answeredInputs++;
      }
      let next = index + 1;
      for (const rule of rulesFor(step)) {
        if (!evaluateCondition(rule.if, result.answers, result.variables, context)) continue;
        const action = rule.then;
        if (action.action === 'jump') { next = byId.get(action.to)!; break; }
        if (action.action === 'end') { result.endingId = action.to; break; }
        apply(action, result.variables, visible, required);
      }
      if (result.endingId) break;
      index = next;
    }
    if (!result.currentStepId && !result.endingId) result.endingId = defaultEnding;
    if (result.endingId && !result.errors.length) {
      const outcome = schema.outcomes?.find(o => evaluateCondition(o.if, result.answers, result.variables, context));
      if (outcome) result.endingId = outcome.endingId;
    }
  }
  for (const key of Object.keys(supplied).sort()) {
    const step = byKey.get(key);
    if (!step) { discard.add(key); result.errors.push(issue('/answers/' + pointer(key), 'unknown_answer', 'The answer key does not exist.', key)); }
    else if (isDisplay(step.type)) { discard.add(key); result.errors.push(issue('/answers/' + pointer(key), 'display_answer', 'Display steps do not store answers.', key)); }
    else if (!processed.has(key)) { discard.add(key); result.errors.push(issue('/answers/' + pointer(key), 'unvisited_answer', 'Answers to unvisited steps are not accepted.', key)); }
  }
  result.discardedKeys = [...discard].sort();
  if (result.endingId) result.progress = 100;
  else if (result.currentStepId && !result.errors.some(e => e.code === 'cff_logic_loop')) {
    const visibility = new Map(visible), vars = { ...result.variables }, estimates = new Set<string>();
    let remaining = 0, cursor = byId.get(result.currentStepId)!;
    const known = (c: Condition): boolean => 'all' in c ? c.all.every(known) : 'any' in c ? c.any.every(known) : c.source !== undefined && c.source !== 'answer' || own(result.answers, c.field);
    while (cursor < steps.length) {
      const s = steps[cursor]!;
      if (estimates.has(s.id)) break;
      estimates.add(s.id);
      if (!visibility.get(s.id)) { cursor++; continue; }
      if (!isDisplay(s.type) && s.type !== 'hidden' && s.type !== 'calculated') remaining++;
      let next = cursor + 1, end = false;
      for (const r of rulesFor(s)) {
        if (!known(r.if) || !evaluateCondition(r.if, result.answers, vars, context)) continue;
        if (r.then.action === 'jump') { next = byId.get(r.then.to)!; break; }
        if (r.then.action === 'end') { end = true; break; }
        apply(r.then, vars, visibility, new Map(required), []);
      }
      if (end) break;
      cursor = next;
    }
    result.progress = Math.min(99, Math.floor(100 * answeredInputs / Math.max(1, answeredInputs + remaining)));
  }
  return result;
}
