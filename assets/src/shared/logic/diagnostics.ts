import type { Action, Condition, FormSchema, ValidationIssue } from '../contracts';
import { issue, numeric, regex } from './value';
import { isKnownFieldType } from './fields';
import { powerDiagnostics } from './power';
import { allowedCookieSource, cookieSourceMessage } from '../cookies';

export function diagnoseSchema(schema: FormSchema): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  const add = (path: string, code: string, message: string): void => { errors.push(issue(path, code, message)); };
  if (!Array.isArray(schema.steps) || !schema.steps.length || schema.steps.length > 500 || !Array.isArray(schema.endings) || !schema.endings.length) {
    add('', 'invalid_schema', 'The schema needs 1–500 steps and an ending.'); return errors;
  }
  const ids = new Set<string>(), keys = new Map<string, number>(), stepIds = new Map<string, number>();
  const variables = new Map((schema.variables ?? []).map(v => [v.key, v.type]));
  const variableKeys = new Set<string>();
  (schema.variables ?? []).forEach((v, i) => {
    if (variableKeys.has(v.key)) add(`/variables/${i}/key`, 'duplicate_key', 'Variable keys must be unique.');
    variableKeys.add(v.key);
    if (v.type === 'number' ? !numeric(v.default) : typeof v.default !== v.type) add(`/variables/${i}/default`, 'invalid_variable', 'The variable default has an invalid type.');
  });
  const endings = new Set(schema.endings.map(e => e.id));
  const unique = (id: string, path: string): void => { if (ids.has(id)) add(path, 'duplicate_id', 'IDs must be globally unique.'); ids.add(id); };
  schema.steps.forEach((s, i) => {
    if (s.type === 'hidden' && s.settings?.source === 'cookie' && !allowedCookieSource(s.settings.sourceKey ?? s.key)) add(`/steps/${i}/settings/sourceKey`, 'restricted_cookie', cookieSourceMessage);
    if (keys.has(s.key)) add(`/steps/${i}/key`, 'duplicate_key', 'Field keys must be unique.');
    keys.set(s.key, i); stepIds.set(s.id, i); unique(s.id, `/steps/${i}/id`);
    const values = new Set<string>();
    (s.options ?? []).forEach((o, j) => { unique(o.id, `/steps/${i}/options/${j}/id`);
      if (values.has(o.value)) add(`/steps/${i}/options/${j}/value`, 'duplicate_value', 'Option values must be unique.'); values.add(o.value); });
  });
  schema.endings.forEach((e, i) => { unique(e.id, `/endings/${i}/id`); (e.buttons ?? []).forEach((b, j) => unique(b.id, `/endings/${i}/buttons/${j}/id`)); });
  (schema.groups ?? []).forEach((g, i) => { unique(g.id, `/groups/${i}/id`); g.stepIds.forEach((id, j) => {
    if (!stepIds.has(id)) add(`/groups/${i}/stepIds/${j}`, 'missing_reference', 'The referenced step does not exist.'); }); });
  const checkCondition = (c: Condition, path: string, index: number, depth = 0): void => {
    if (depth > 64) { add(path, 'condition_depth', 'Conditions may nest at most 64 levels.'); return; }
    if ('all' in c || 'any' in c) {
      const group = 'all' in c ? 'all' : 'any';
      const children = 'all' in c ? c.all : c.any;
      children.forEach((child, j) => checkCondition(child, `${path}/${group}/${j}`, index, depth + 1)); return;
    }
    const source = c.source ?? 'answer';
    if (source === 'answer') {
      if (!keys.has(c.field)) add(path + '/field', 'missing_reference', 'The referenced answer does not exist.');
      else if (keys.get(c.field)! > index) add(path + '/field', 'later_reference', 'This condition references a later answer.');
    } else if (source === 'variable' && !variables.has(c.field)) add(path + '/field', 'missing_reference', 'The referenced variable does not exist.');
    if (c.op === 'matches' && !regex(c.value)) add(path + '/value', 'invalid_pattern', 'The validation pattern is not supported.');
  };
  const checkAction = (a: Action, path: string): void => {
    if (a.action === 'set_variable') {
      const type = variables.get(a.key);
      if (!type) add(path + '/key', 'missing_reference', 'The referenced variable does not exist.');
      else if ((a.value !== null && typeof a.value !== type) || (a.operation !== 'set' && (type !== 'number' || typeof a.value !== 'number'))) add(path, 'invalid_variable', 'The variable action has an invalid type.');
    } else if (!(a.action === 'end' ? endings : stepIds).has(a.to)) add(path + '/to', 'missing_reference', 'The navigation or visibility target does not exist.');
  };
  const edges = new Map<string, Set<string>>();
  const allRules = schema.steps.flatMap(s => [...(s.logic ?? []), ...(s.options ?? []).flatMap(o => o.logic ?? [])]);
  const skippable = new Set([...schema.steps.filter(s => s.hiddenByDefault).map(s => s.id), ...allRules.filter(r => r.then.action === 'hide').map(r => (r.then as { to: string }).to)]);
  schema.steps.forEach((s, i) => {
    const path = `/steps/${i}`;
    if (!isKnownFieldType(s.type)) add(path + '/type', 'unsupported_type', 'This field type is not supported.');
    if (s.validation?.pattern !== undefined && !regex(s.validation.pattern)) add(path + '/validation/pattern', 'invalid_pattern', 'The validation pattern is not supported.');
    if (s.validation?.mxCheck) add(path + '/validation/mxCheck', 'unsupported_validation', 'MX checking is not enabled.');
    if (['single_choice', 'multi_choice'].includes(s.type) && !s.options?.length) add(path + '/options', 'missing_options', 'Choice fields need at least one option.');
    const rules = [...(s.logic ?? []), ...(s.options ?? []).flatMap(o => o.logic ?? [])];
    rules.forEach(r => { if (r.then.action === 'jump') { const set = edges.get(s.id) ?? new Set<string>(); set.add(r.then.to); edges.set(s.id, set); } });
    const inspect = (rules: NonNullable<typeof s.logic>, base: string): void => {
      if (rules.length > 100) add(base, 'invalid_schema', 'A field may have at most 100 rules.');
      rules.forEach((r, j) => { checkCondition(r.if, `${base}/${j}/if`, i); checkAction(r.then, `${base}/${j}/then`); });
    };
    inspect(s.logic ?? [], path + '/logic');
    (s.options ?? []).forEach((o, j) => inspect(o.logic ?? [], `${path}/options/${j}/logic`));
    if (s.options && s.options.length > 200) add(path + '/options', 'invalid_schema', 'A field may have at most 200 options.');
    const v = s.validation ?? {};
    if (['rating', 'scale', 'nps'].includes(s.type) && (v.min !== undefined || v.max !== undefined || v.step !== undefined))
      add(path + '/validation', 'unsupported_validation', 'Score fields use a fixed numeric range.');
    if (s.type === 'slider') {
      const min = v.min ?? 0, max = v.max ?? 100, increment = v.step ?? 1;
      if (!numeric(min) || !numeric(max) || !numeric(increment) || Math.abs(Number(min)) > 10000 || Math.abs(Number(max)) > 10000 || Number(min) >= Number(max) || Number(increment) <= 0 || Number(increment) > Number(max) - Number(min))
        add(path + '/validation', 'invalid_range', 'Slider bounds and increment must form a valid finite range.');
    }
    for (const [min, max] of [[v.minLength, v.maxLength], [v.minSelections, v.maxSelections], [v.min, v.max]]) {
      if (min !== undefined && max !== undefined && typeof min === typeof max && min > max) add(path + '/validation', 'invalid_range', 'Minimum must not exceed maximum.');
    }
    if (v.step !== undefined && (!numeric(v.step) || v.step <= 0)) add(path + '/validation/step', 'invalid_range', 'The numeric increment must be positive.');
    if (s.type !== 'single_choice' && s.options?.some(o => o.isOther)) add(path + '/options', 'unsupported_other', 'Other free text is only supported for single-choice fields.');
    if (schema.steps[i + 1] && (skippable.has(s.id) || !s.logic?.some(r => ['jump', 'end'].includes(r.then.action) && 'all' in r.if && !r.if.all.length))) {
      const set = edges.get(s.id) ?? new Set<string>(); set.add(schema.steps[i + 1]!.id); edges.set(s.id, set);
    }
  });
  schema.steps.forEach((s, i) => {
    if (errors.some(e => e.code === 'duplicate_id')) return;
    const queue = [...(edges.get(s.id) ?? [])], seen = new Set<string>();
    while (queue.length) {
      const id = queue.shift()!;
      if (id === s.id) { add(`/steps/${i}/logic`, 'potential_loop', 'Navigation rules may revisit this step.'); break; }
      if (!seen.has(id)) { seen.add(id); queue.push(...(edges.get(id) ?? [])); }
    }
  });
  // Conservative reachability: unknown conditions can match or not match.
  const reachable = new Set<number>();
  const queue = [0];
  while (queue.length) {
    const i = queue.shift()!;
    if (reachable.has(i) || !schema.steps[i]) continue;
    reachable.add(i);
    const s = schema.steps[i]!;
    let fallsThrough = true;
    for (const rule of s.logic ?? []) {
      if (rule.then.action === 'jump') { const target = stepIds.get(rule.then.to); if (target !== undefined) queue.push(target); }
      if ((rule.then.action === 'jump' || rule.then.action === 'end') && 'all' in rule.if && !rule.if.all.length) { fallsThrough = false; break; }
    }
    for (const o of s.options ?? []) for (const r of o.logic ?? []) if (r.then.action === 'jump') { const target = stepIds.get(r.then.to); if (target !== undefined) queue.push(target); }
    if (fallsThrough || skippable.has(s.id)) queue.push(i + 1);
  }
  schema.steps.forEach((_s, i) => { if (!reachable.has(i)) add(`/steps/${i}`, 'unreachable_step', 'No possible navigation path reaches this step.'); });
  return [...errors, ...powerDiagnostics(schema)];
}
