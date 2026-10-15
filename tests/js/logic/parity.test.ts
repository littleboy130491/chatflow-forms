import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { diagnoseSchema, evaluateCondition, interpolate, interpolateUrl, replay, V1_FIELD_TYPES } from '../../../assets/src/shared/logic';
import type { AnswerMap, Condition, FormSchema, ReplayContext, ReplayResult } from '../../../assets/src/shared/contracts';

const fixtureDir = resolve('tests/fixtures/logic');
const fixtures = readdirSync(fixtureDir).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(resolve(fixtureDir, f), 'utf8')) as {
  name: string; schema: FormSchema; answers: AnswerMap; context: ReplayContext; mode: 'partial' | 'complete'; expected: ReplayResult;
});

describe('shared PHP/TS authoritative replay fixtures', () => {
  for (const fixture of fixtures) it(fixture.name, () => {
    expect(replay(fixture.schema, fixture.answers, fixture.context, fixture.mode)).toEqual(fixture.expected);
    expect(replay(fixture.schema, fixture.answers, fixture.context, fixture.mode)).toEqual(fixture.expected);
  });
});

const checks = JSON.parse(readFileSync(resolve('tests/fixtures/logic-checks.json'), 'utf8')) as {
  operators: { name: string; condition: Condition; answers: AnswerMap; context: ReplayContext; variables: AnswerMap; expected: boolean }[];
  interpolation: { name: string; text: string; answers: AnswerMap; meta: AnswerMap; url: boolean; expected: string }[];
  diagnostics: { name: string; schema: FormSchema; expected: { path: string; code: string; message: string }[] }[];
};
describe('shared strict operators', () => {
  for (const c of checks.operators) it(c.name, () => expect(evaluateCondition(c.condition, c.answers, c.variables, c.context)).toBe(c.expected));
});
describe('shared plain-text and URL interpolation', () => {
  for (const c of checks.interpolation) it(c.name, () => expect((c.url ? interpolateUrl : interpolate)(c.text, c.answers, c.meta)).toBe(c.expected));
});
describe('shared diagnostics', () => {
  for (const c of checks.diagnostics) it(c.name, () => expect(diagnoseSchema(c.schema)).toEqual(c.expected));
});
it('covers every enabled v1 field and freezes variables independently', () => {
  expect(V1_FIELD_TYPES).toHaveLength(17);
  for (const type of V1_FIELD_TYPES) expect(fixtures.some(f => f.schema.steps.some(s => s.type === type))).toBe(true);
  const f = fixtures.find(f => f.name === 'rule-order-variables')!;
  const first = replay(f.schema, f.answers); first.variables.total = 99;
  expect(replay(f.schema, f.answers).variables.total).toBe(4);
  expect(f.schema.variables![0]!.default).toBe(2);
});
