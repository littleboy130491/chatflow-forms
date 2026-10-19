import { expect, it } from 'vitest';
import { blankForm } from '../../../assets/src/builder/model';

it('starts new generic forms with the plugin brand rather than a template-specific bot name', () => {
  expect(blankForm().schema.bot.name).toBe('ChatFlow');
});
