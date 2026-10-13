import { describe, it, expect } from 'vitest';
import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import definition from '../../../schema/form.schema.json';
import settingsDefinition from '../../../schema/settings.schema.json';
import fixtures from '../../fixtures/schema.json';

describe('shared schema contract', () => {
  const ajv = new Ajv({ allErrors: true, strict: true, allowUnionTypes: true });
  addFormats(ajv);
  const validate = ajv.compile(definition);
  for (const fixture of fixtures) {
    it(fixture.name, () => { expect(validate(fixture.schema)).toBe(fixture.valid); });
  }
  it('rejects secret config extensions and invalid resume TTL', () => {
    const validateSettings = ajv.compile(settingsDefinition);
    expect(validateSettings({})).toBe(true);
    expect(validateSettings({ githubToken: 'not-a-secret' })).toBe(false);
    expect(validateSettings({ sessions: { resumeDays: 365 } })).toBe(false);
  });
});
