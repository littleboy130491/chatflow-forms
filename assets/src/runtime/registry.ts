import type { ComponentType } from 'preact';
import type { FieldProps } from './types';
const renderers = new Map<string, ComponentType<FieldProps>>();
export function registerField(type: string, renderer: ComponentType<FieldProps>): () => void {
  if (!/^[a-z][a-z0-9_]{0,63}$/.test(type) || typeof renderer !== 'function') throw new TypeError('Invalid field renderer');
  if (renderers.has(type)) throw new Error('Field renderer already registered');
  renderers.set(type, renderer);
  return () => { if (renderers.get(type) === renderer) renderers.delete(type); };
}
export function fieldRenderer(type: string): ComponentType<FieldProps> | undefined { return renderers.get(type); }
