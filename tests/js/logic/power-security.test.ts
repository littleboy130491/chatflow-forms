import { describe, expect, it } from 'vitest';
import { calculate } from '../../../assets/src/shared/logic/calculation';
import { diagnoseSchema, replay } from '../../../assets/src/shared/logic';
import fixture from '../../fixtures/logic/power-variant-order.json';
import invalidExpressions from '../../fixtures/power-invalid-expressions.json';
import type { FormSchema } from '../../../assets/src/shared/contracts';

const base = fixture.schema as unknown as FormSchema;
const changed = (change: (schema: FormSchema) => void): FormSchema => { const schema = structuredClone(base); change(schema); return schema; };
describe('power security and parity', () => {
  it('rejects unsafe and unbounded calculations using the same PHP fixture', () => {
    for (const expression of invalidExpressions) expect(() => calculate(expression, { amount: 4 })).toThrow('Invalid calculation.');
    expect(calculate('answer.amount * 2 + variable.score', { amount: 4 }, { score: 5 })).toBe(13);
  });
  it('recomputes rather than trusting forged calculated answers', () => {
    const result = replay(base, { amount: 4, age: 20, bonus: 999 }, {}, 'complete');
    expect(result.errors.map(e => e.code)).toContain('computed_answer_tampered');
    expect(result.answers.bonus).toBe(13);
  });
  it('rejects invalid dependencies, endings and order variants', () => {
    expect(diagnoseSchema(base)).toEqual([]);
    for (const invalid of [
      changed(s => { s.steps[3]!.settings = { expression: 'answer.unknown + 2' }; }),
      changed(s => { s.steps[3]!.settings = { expression: 'answer.review + 2' }; }),
      changed(s => { s.outcomes![0]!.endingId = 'missing'; }),
      changed(s => { s.experiments![0]!.variants[1]!.stepOrder = ['age', 'amount', 'bonus', 'score_step', 'review']; }),
      changed(s => { s.experiments![0]!.variants[1]!.copy![0]!.stepId = 'missing'; }),
    ]) expect(diagnoseSchema(invalid)).not.toEqual([]);
  });
});
