import type { FormSchema, ValidationIssue, Condition } from '../contracts';
import { calculationReferences, CALCULATION_LIMIT } from './calculation';
import { issue } from './value';

export function applyVariant(schema: FormSchema, variant: NonNullable<FormSchema['experiments']>[number]['variants'][number]): FormSchema {
  const result: FormSchema = JSON.parse(JSON.stringify(schema));
  delete result.experiments;
  for (const copy of variant.copy ?? []) {
    const step = result.steps.find(s => s.id === copy.stepId);
    if (!step) throw new Error('Invalid variant.');
    step.messages = [...copy.messages];
  }
  if (variant.stepOrder) {
    if (variant.stepOrder.length !== result.steps.length || new Set(variant.stepOrder).size !== result.steps.length) throw new Error('Invalid variant.');
    result.steps = variant.stepOrder.map(id => {
      const step = result.steps.find(s => s.id === id);
      if (!step) throw new Error('Invalid variant.');
      return step;
    }) as FormSchema['steps'];
  }
  return result;
}

export function powerDiagnostics(schema: FormSchema): ValidationIssue[] {
  const errors: ValidationIssue[] = [], steps = new Map(schema.steps.map((s, i) => [s.key, { step: s, index: i }]));
  const positions = new Set<string>(), nodeIds = new Set([...schema.steps.map(s => s.id), ...schema.endings.map(e => e.id)]);
  const variables = new Map((schema.variables ?? []).map(v => [v.key, v.type]));
  const add = (path: string, message: string) => errors.push(issue(path, 'invalid_power', message));
  for (const [i, pos] of (schema.flowPositions ?? []).entries()) {
    if (!nodeIds.has(pos.id) || positions.has(pos.id)) add(`/flowPositions/${i}`, 'Graph positions must reference unique existing nodes.');
    positions.add(pos.id);
  }
  for (const [i, v] of (schema.variables ?? []).entries()) if (typeof v.default === 'number' && Math.abs(v.default) > CALCULATION_LIMIT) add(`/variables/${i}`, 'Numeric variables are limited to +/- 1e12.');
  schema.steps.forEach((s, i) => {
    for (const rule of [...s.logic ?? [], ...(s.options ?? []).flatMap(o => o.logic ?? [])]) if (rule.then.action === 'set_variable' && typeof rule.then.value === 'number' && Math.abs(rule.then.value) > CALCULATION_LIMIT) add(`/steps/${i}/logic`, 'Numeric variables are limited to +/- 1e12.');
    if (s.type !== 'calculated') return;
    try {
      for (const ref of calculationReferences(s.settings?.expression ?? '')) {
        if (ref.source === 'variable') { if (variables.get(ref.key) !== 'number') add(`/steps/${i}/settings/expression`, 'Calculations reference numeric variables only.'); }
        else {
          const field = steps.get(ref.key);
          if (!field || field.index >= i || !['number', 'rating', 'scale', 'nps', 'slider', 'calculated'].includes(field.step.type)) add(`/steps/${i}/settings/expression`, 'Calculations reference earlier numeric answers only.');
        }
      }
    } catch { add(`/steps/${i}/settings/expression`, 'Use bounded arithmetic with answer.key or variable.key.'); }
  });
  const check = (c: Condition, path: string, depth = 0): void => {
    if (depth > 16) { add(path, 'Outcome conditions may nest at most 16 levels.'); return; }
    if ('all' in c || 'any' in c) { for (const child of 'all' in c ? c.all : c.any) check(child, path, depth + 1); }
    else if ((c.source ?? 'answer') === 'answer' ? !steps.has(c.field) : c.source === 'variable' && !variables.has(c.field)) add(path, 'Outcome references a missing answer or variable.');
  };
  (schema.outcomes ?? []).forEach((o, i) => {
    if (!schema.endings.some(e => e.id === o.endingId)) add(`/outcomes/${i}`, 'Outcome references a missing ending.');
    check(o.if, `/outcomes/${i}/if`);
  });
  const experimentIds = new Set<string>();
  (schema.experiments ?? []).forEach((e, i) => {
    if (experimentIds.has(e.id)) add(`/experiments/${i}`, 'Experiment IDs must be unique.');
    experimentIds.add(e.id);
    const ids = new Set<string>();
    e.variants.forEach((v, j) => {
      const path = `/experiments/${i}/variants/${j}`;
      if (ids.has(v.id)) add(path, 'Variant IDs must be unique.'); ids.add(v.id);
      const copies = new Set<string>();
      for (const c of v.copy ?? []) { if (!schema.steps.some(s => s.id === c.stepId) || copies.has(c.stepId)) add(path, 'Copy references must be unique existing steps.'); copies.add(c.stepId); }
      if (v.stepOrder) {
        const blocks = new Set(['hidden', 'summary', 'calculated']);
        const jumpTargets = new Set(schema.steps.flatMap(s => [...s.logic ?? [], ...(s.options ?? []).flatMap(o => o.logic ?? [])].filter(r => r.then.action === 'jump').map(r => 'to' in r.then ? r.then.to : '')));
        // Keep dependency-bearing steps fixed; permute independent questions within segments.
        schema.steps.forEach((s, index) => {
          if (s.logic?.length || s.options?.some(o => o.logic?.length) || s.hiddenByDefault || blocks.has(s.type) || jumpTargets.has(s.id)) {
            if (v.stepOrder![index] !== s.id) add(path, 'Order variants must keep branching, hidden, summary and calculated steps fixed.');
            const before = new Set(schema.steps.slice(0, index).map(x => x.id));
            if (v.stepOrder!.slice(0, index).some(id => !before.has(id))) add(path, 'Order variants cannot cross a dependency boundary.');
          }
        });
        try { applyVariant(schema, v); } catch { add(path, 'Step order must be an exact permutation of all steps.'); }
      }
    });
  });
  return errors;
}
