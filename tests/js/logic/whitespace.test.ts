import { describe, expect, it } from 'vitest';
import cases from '../../fixtures/power-whitespace.json';
import { calculate } from '../../../assets/src/shared/logic/calculation';
import identifiers from '../../fixtures/power-identifier-boundaries.json';
import fixture from '../../fixtures/logic/power-variant-order.json';
import { diagnoseSchema } from '../../../assets/src/shared/logic/diagnostics';
import type { FormSchema } from '../../../assets/src/shared/contracts';

it('mirrors combined variant identifier boundaries', () => {
  for (const boundary of identifiers) {
    const schema: FormSchema = JSON.parse(JSON.stringify(fixture.schema));
    schema.experiments![0]!.id = 'e'.repeat(boundary.experimentLength);
    schema.experiments![0]!.variants[0]!.id = 'v'.repeat(boundary.variantLength);
    expect(diagnoseSchema(schema).length === 0).toBe(boundary.valid);
  }
});

describe('ASCII expression whitespace and length parity', () => {
  for (const fixture of [...cases, {expression: ' '.repeat(511) + '1', value: 1}, {expression: ' '.repeat(512) + '1', invalid: true}]) {
    it(JSON.stringify(fixture.expression), () => {
      if (fixture.invalid) expect(() => calculate(fixture.expression)).toThrow('Invalid calculation.');
      else expect(calculate(fixture.expression)).toBe(fixture.value);
    });
  }
});
