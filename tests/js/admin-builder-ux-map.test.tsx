// @vitest-environment jsdom
import { act } from 'react';
import { createElement, createRoot } from '@wordpress/element';
import type { ReactFlowProps } from '@xyflow/react';
import { expect, it, vi } from 'vitest';
import { FlowMap } from '../../assets/src/builder/FlowMap';
import { blankForm } from '../../assets/src/builder/model';
import { palettes, messagingDefaults } from '../../assets/src/builder/ThemeEditor';
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { contrastRatio } from '../../assets/src/builder/contrast';
let graph: ReactFlowProps;
vi.mock('@xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@xyflow/react')>()),
  ReactFlow: (props: ReactFlowProps) => { graph = props; return null; },
  Background: () => null, Controls: () => null, MiniMap: () => null,
}));
it('labels endings with readable text, bounded node layout and accessible full labels', async () => {
 const form = blankForm(); form.schema.endings = [{ id: 'end_internal_123', type: 'message', messages: ['Thank you for getting in touch '.repeat(12)] }];
 const host = document.createElement('div'); const root = createRoot(host);
 await act(async () => root.render(createElement(FlowMap, { schema: form.schema, onChange: vi.fn(), onSelect: vi.fn() })));
 try {
   const ending = graph.nodes!.find(n => n.id === 'end_internal_123')!;
   expect(String(ending.data.label)).not.toContain('end_internal');
   expect(String(ending.data.label)).toContain('Thank you');
   expect(String(ending.data.label).length).toBeLessThanOrEqual(90);
   expect(ending.ariaLabel).toContain(form.schema.endings[0]!.messages![0]!.trim());
   expect(ending.style?.width).toBe(210);
   expect(ending.style?.overflowWrap).toBe('anywhere');
 } finally { await act(async () => root.unmount()); }
});
it('seeds a normal-text AA button colour for new forms and the default palette without overriding configured colours', () => {
 expect(contrastRatio('#ffffff', blankForm().settings.appearance!.primary ?? messagingDefaults.primary)!).toBeGreaterThanOrEqual(4.5);
 expect(contrastRatio('#ffffff', palettes()[0]!.colors.primary)!).toBeGreaterThanOrEqual(4.5);
 expect(blankForm({ appearance: { primary: '#123456' } }).settings.appearance!.primary).toBe('#123456');
});
