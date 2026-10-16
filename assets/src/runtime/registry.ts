import type { ComponentType } from 'preact';
import type { FieldProps } from './types';
import { ENABLED_FIELD_TYPES } from '../shared/logic';
const renderers = new Map<string, ComponentType<FieldProps>>();
const builtIn = new Set<string>(ENABLED_FIELD_TYPES);
export function registerField(type: string, renderer: ComponentType<FieldProps>): () => void {
  if (!/^[a-z][a-z0-9_]{0,63}$/.test(type) || typeof renderer !== 'function') throw new TypeError('Invalid field renderer');
  if (builtIn.has(type)) throw new Error('Built-in field types cannot be replaced');
  if (renderers.has(type)) throw new Error('Field renderer already registered');
  renderers.set(type, renderer);
  return () => { if (renderers.get(type) === renderer) renderers.delete(type); };
}
export function fieldRenderer(type: string): ComponentType<FieldProps> | undefined { return renderers.get(type); }
