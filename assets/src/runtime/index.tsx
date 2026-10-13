import { render } from 'preact';

export function mountRuntime(host: HTMLElement): void {
  const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  render(<p role="status">ChatFlow foundation build. Visitor module not yet enabled.</p>, shadow);
}
