// @vitest-environment jsdom
/** @jsxImportSource preact */
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { readFileSync } from 'node:fs';
const css = readFileSync('assets/src/runtime/styles.css', 'utf8');
const stylesheet = document.createElement('style'); stylesheet.textContent = css; document.head.append(stylesheet);
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RuntimeController } from '../../../assets/src/runtime/controller';
import { Chat } from '../../../assets/src/runtime/chat';
import { mountRuntime } from '../../../assets/src/runtime';
import { form } from './helpers';
import type { Step } from '../../../assets/src/runtime/types';

const host = document.createElement('div');
document.body.append(host);
afterEach(async () => { await act(() => render(null, host)); });
async function chat(step: Step, locale = 'en') {
  const controller = new RuntimeController({ form: form([step]), preview: true, locale }, null);
  await controller.initialize();
  await act(() => render(<Chat controller={controller} />, host));
  return controller;
}
const email: Step = { id: 'email', key: 'email', type: 'email', label: 'Email address', messages: [], required: true };

describe('runtime polish regressions', () => {
  it('refocuses the invalid input when the same bad answer is submitted again', async () => {
    const controller = await chat(email);
    const input = host.querySelector<HTMLInputElement>('.active input')!;
    const button = host.querySelector<HTMLButtonElement>('.active button')!;
    await act(() => { input.value = 'not-an-email'; input.dispatchEvent(new Event('input', { bubbles: true })); });
    for (let attempt = 0; attempt < 2; attempt++) {
      button.focus();
      await act(() => { host.querySelector('.active form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
      await vi.waitFor(() => expect(document.activeElement).toBe(input));
    }
    controller.dispose();
  });
  it('returns keyboard focus to the required input after a rejected answer', async () => {
    const controller = await chat(email);
    const input = host.querySelector<HTMLInputElement>('.active input')!;
    host.querySelector<HTMLButtonElement>('.active button')!.focus();
    await act(() => controller.answer(''));
    expect(host.querySelector('[role=alert]')?.textContent).toBe('Please answer this question.');
    await vi.waitFor(() => expect(document.activeElement).toBe(input));
    controller.dispose();
  });
  it('does not apply classic dark button ink to messaging header navigation', async () => {
    const controller = await chat(email);
    const element = host.querySelector<HTMLElement>('.chat')!;
    element.dataset.style = 'messaging'; element.classList.add('dark');
    const button = host.querySelector('nav button:last-child')!;
    const classicInk = [...stylesheet.sheet!.cssRules].filter((rule): rule is CSSStyleRule => 'selectorText' in rule).filter(rule => rule.style.color === '#171717' && button.matches(rule.selectorText));
    expect(classicInk.map(rule => rule.selectorText)).toEqual([]);
    controller.dispose();
  });
  it('uses readable button text for light and dark messaging accents', async () => {
    const target = document.createElement('div'); document.body.append(target);
    const envelope = form([email]); envelope.form.appearance = { style: 'messaging', theme: 'dark' };
    let handle!: ReturnType<typeof mountRuntime>;
    await act(() => { handle = mountRuntime(target, { form: envelope, preview: true }); });
    const root = target.shadowRoot!.querySelector('div')!;
    await vi.waitFor(() => expect(root.style.getPropertyValue('--cff-button-text')).toBe('#171717'));
    await act(() => handle.setAppearance({ style: 'messaging', primary: '#135724' }));
    expect(root.style.getPropertyValue('--cff-button-text')).toBe('#ffffff');
    await act(() => handle.setAppearance({ style: 'messaging', primary: '#ffff00' }));
    expect(root.style.getPropertyValue('--cff-button-text')).toBe('#171717');
    await act(() => handle.unmount()); target.remove();
  });
  it('returns popup focus to the external opener and leaves repeated open calls alone', async () => {
    const target = document.createElement('div'); document.body.append(target);
    const opener = document.createElement('button'); document.body.append(opener); opener.focus();
    let handle!: ReturnType<typeof mountRuntime>;
    await act(() => { handle = mountRuntime(target, { form: form([email]), preview: true, mode: 'popup' }); handle.open(); });
    const shadow = target.shadowRoot!;
    await vi.waitFor(() => expect(shadow.querySelector('.active input')).not.toBeNull());
    const input = shadow.querySelector<HTMLInputElement>('.active input')!; input.focus();
    await act(() => handle.open());
    expect(shadow.activeElement).toBe(input);
    await act(() => shadow.querySelector<HTMLButtonElement>('.close-chat')!.click());
    expect(document.activeElement).toBe(opener);
    await act(() => handle.unmount()); target.remove(); opener.remove();
  });
  it('explains required consent and associates the error with its checkbox', async () => {
    const controller = await chat({ id: 'consent', key: 'consent', type: 'consent', label: 'Agree', messages: [] });
    await act(() => controller.answer(false));
    expect(host.querySelector('[role=alert]')?.textContent).toBe('Please agree before continuing.');
    const checkbox = host.querySelector('input[type=checkbox]')!;
    expect(checkbox.getAttribute('aria-invalid')).toBe('true');
    expect(checkbox.getAttribute('aria-describedby')).toContain('error-consent');
    controller.dispose();
  });
  it('resolves dark messaging defaults on the theme root without overriding explicit colours', async () => {
    const target = document.createElement('div'); document.body.append(target);
    const envelope = form([email]); envelope.form.appearance = { style: 'messaging', theme: 'dark' };
    let handle!: ReturnType<typeof mountRuntime>;
    await act(() => { handle = mountRuntime(target, { form: envelope, preview: true }); });
    const root = target.shadowRoot!.querySelector('div')!;
    await vi.waitFor(() => expect(root.style.getPropertyValue('--cff-primary')).toBe('#5eb5f7'));
    expect(root.style.getPropertyValue('--cff-chat-bg')).toBe('#0e1621');
    await act(() => handle.setAppearance({ style: 'messaging', theme: 'dark', primary: '#135724', textColor: '#abcdef' }));
    expect(root.style.getPropertyValue('--cff-primary')).toBe('rgb(19, 87, 36)');
    expect(root.style.getPropertyValue('--cff-text')).toBe('rgb(171, 205, 239)');
    // Local .dark declarations must not shadow inherited explicit theme settings.
    expect(getComputedStyle(target.shadowRoot!.querySelector('.chat')!).getPropertyValue('--cff-primary')).toBe('');
    await act(() => handle.unmount()); target.remove();
  });
  it('keeps labels accessible without visually repeating the active chat prompt', async () => {
    const controller = await chat({ ...email, messages: ['Email address'] });
    await vi.waitFor(() => expect(host.querySelector('.active input')).not.toBeNull());
    expect(host.querySelector('.step .bubble')?.textContent).toBe('Email address');
    const label = host.querySelector<HTMLLabelElement>('.active label[for]')!;
    expect(label.control).toBe(host.querySelector('.active input'));
    expect(getComputedStyle(label).position).toBe('absolute');
    expect(getComputedStyle(label).width).toBe('1px');
    controller.dispose();
  });
  it.each(['classic', 'messaging'])('retains a visible label in %s when no chat prompt was configured', async style => {
    const controller = await chat(email);
    if (style === 'messaging') host.querySelector<HTMLElement>('.chat')!.dataset.style = style;
    expect(getComputedStyle(host.querySelector('.active label')!).position).not.toBe('absolute');
    controller.dispose();
  });
  it('announces a specific email correction linked to the invalid field', async () => {
    const controller = await chat(email);
    await act(() => controller.answer('not-an-email'));
    expect(host.querySelector('[role=alert]')?.textContent).toBe('Enter a valid email address.');
    const input = host.querySelector('input')!;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(host.querySelector('[role=alert]')!.id);
    expect(host.querySelector('[role=alert]')?.classList.contains('field-error')).toBe(true);
    controller.dispose();
  });
});
