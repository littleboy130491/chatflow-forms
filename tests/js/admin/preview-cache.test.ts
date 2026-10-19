// @vitest-environment jsdom
import { expect, it } from 'vitest';
import * as Preview from '../../../assets/src/builder/Preview';

it('loads the server-versioned runtime in builder preview', () => {
  const config = { pluginUrl: 'https://example.test/wp-content/plugins/chatflow-forms/', runtimeUrl: 'https://example.test/wp-content/plugins/chatflow-forms/build/runtime/runtime.js?ver=abc123' };
  expect(Preview.previewRuntimeUrl?.(config)).toBe(config.runtimeUrl);
});

it('preserves preview compatibility when an older config has no runtime URL', () => {
  const config = { pluginUrl: 'https://example.test/wp-content/plugins/chatflow-forms/' };
  expect(Preview.previewRuntimeUrl?.(config)).toBe(`${config.pluginUrl}build/runtime/runtime.js`);
});
