// @vitest-environment jsdom
import { act } from 'react';
import { createElement, createRoot } from '@wordpress/element';
import type { ReactFlowProps } from '@xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { FlowMap } from '../../../assets/src/builder/FlowMap';
import { blankForm, makeStep } from '../../../assets/src/builder/model';
import type { FormSchema } from '../../../assets/src/builder/api';
let graph: ReactFlowProps;
vi.mock('@xyflow/react', () => ({
  ReactFlow: (props: ReactFlowProps) => { graph = props; return null; },
  Background: () => null, Controls: () => null, MiniMap: () => null, Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
}));
describe('schema-backed branching map', () => {
  it('renders and deletes option branches and connects forward branches in the actual schema', async () => {
    const schema = blankForm().schema;
    schema.endings = [{ id: 'done', type: 'message', messages: ['Done'] }];
    const first = makeStep('single_choice', schema.steps); first.id = 'first';
    first.options = [{ id: 'pick', value: 'yes', label: 'Yes', logic: [{ if: { all: [] }, then: { action: 'end', to: 'done' } }] }];
    const second = makeStep('statement', schema.steps); second.id = 'second';
    schema.steps = [first, second];
    const changed = vi.fn<(schema: FormSchema) => void>(), selected = vi.fn();
    const host = document.createElement('div'), root = createRoot(host);
    try {
      await act(async () => root.render(createElement(FlowMap, { schema, onChange: changed, onSelect: selected })));
      const edge = graph.edges!.find(e => e.id === 'option-rule:first:pick:0')!;
      expect(edge).toMatchObject({ source: 'first', target: 'done', label: 'Yes: 1' });
      graph.onEdgeClick?.({} as never, edge);
      expect(selected).toHaveBeenCalledWith('first');
      graph.onEdgesDelete?.([edge]);
      expect(changed.mock.calls.at(-1)![0].steps[0]!.options![0]!.logic).toEqual([]);
      graph.onConnect?.({ source: 'first', target: 'second', sourceHandle: null, targetHandle: null });
      expect(changed.mock.calls.at(-1)![0].steps[0]!.logic).toEqual([{ if: { all: [] }, then: { action: 'jump', to: 'second' } }]);
      const calls = changed.mock.calls.length;
      graph.onConnect?.({ source: 'second', target: 'first', sourceHandle: null, targetHandle: null });
      expect(changed).toHaveBeenCalledTimes(calls);
    } finally { await act(async () => root.unmount()); }
  });
});
