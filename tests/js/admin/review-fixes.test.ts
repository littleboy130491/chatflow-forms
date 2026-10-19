import { expect, it } from 'vitest';
import { paletteGroups } from '../../../assets/src/builder/index';
import { deliveryOutcome } from '../../../assets/src/submissions/Detail';

it('keeps field types registered through cff_field_types addable from the palette', () => {
  const groups = paletteGroups(['short_text', 'signature']);
  expect(groups.at(-1)).toEqual({ label: 'Other', types: ['signature'] });
  expect(groups.slice(0, -1).flatMap(group => group.types)).not.toContain('signature');
});

it('shows the delivery outcome code instead of the generic note type', () => {
  expect(deliveryOutcome('{"code":"email_failed","deliveryId":3,"attempt":2}')).toBe('email_failed');
  expect(deliveryOutcome('legacy plain text')).toBe('legacy plain text');
});
