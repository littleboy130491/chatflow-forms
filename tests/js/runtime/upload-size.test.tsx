// @vitest-environment jsdom
/** @jsxImportSource preact */
import { createElement, render } from 'preact';
import { act } from 'preact/test-utils';
import { expect, it, vi } from 'vitest';
import { UploadInput } from '../../../assets/src/runtime/phase2-inputs';
import { phrases } from '../../../assets/src/runtime/i18n';
import type { Step } from '../../../assets/src/runtime/types';

it.each([
  [1, '1 B'], [1023, '1023 B'], [1024, '1 KB'], [1536, '1.5 KB'],
  [1048575, '1024 KB'], [1048576, '1 MB'], [1572864, '1.5 MB'],
  [10485760, '10 MB'], [undefined, '10 MB'], [104857600, '50 MB'],
] as const)('keeps byte/unit boundaries, default and hard cap readable for %s', async (maxBytes, label) => {
  const host = document.createElement('div');
  const step: Step = { id: 'file', key: 'file', type: 'file_upload', label: 'File', messages: [], validation: maxBytes === undefined ? {} : { maxBytes } };
  try {
    await act(() => render(createElement(UploadInput, { step, value: null, phrase: phrases('en'), upload: vi.fn(), onAnswer: vi.fn(), disabled: false }), host));
    expect(host.querySelector('small')?.textContent).toBe(`Maximum file size: ${label}`);
  } finally { render(null, host); }
});

it.each([[2048, '2 KB'], [10240, '10 KB']] as const)('renders a readable small upload limit for %i bytes', async (maxBytes, label) => {
  const host = document.createElement('div');
  const step: Step = { id: 'file', key: 'file', type: 'file_upload', label: 'File', messages: [], validation: { maxBytes } };
  try {
    await act(() => render(createElement(UploadInput, { step, value: null, phrase: phrases('en'), upload: vi.fn(), onAnswer: vi.fn(), disabled: false }), host));
    expect(host.querySelector('small')?.textContent).toBe(`Maximum file size: ${label}`);
    expect(host.querySelector('small')?.textContent).not.toContain('0 MB');
  } finally { render(null, host); }
});
