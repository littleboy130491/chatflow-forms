declare module '@wordpress/block-editor' {
  import type { ComponentType, HTMLAttributes, ReactNode } from 'react';
  export const InspectorControls: ComponentType<{ children?: ReactNode }>;
  export function useBlockProps(props?: HTMLAttributes<HTMLDivElement>): HTMLAttributes<HTMLDivElement>;
}
