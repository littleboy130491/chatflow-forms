// @vitest-environment jsdom
import { act } from 'react';
import { createElement, createRoot } from '@wordpress/element';
import type { Edge, ReactFlowProps } from '@xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { FlowMap } from '../../../assets/src/builder/FlowMap';
import { blankForm, makeStep } from '../../../assets/src/builder/model';
import type { FormSchema } from '../../../assets/src/builder/api';
let graph: ReactFlowProps;
// Only the canvas is stubbed (jsdom cannot measure it); the real controlled-state
// hooks and change reducers from @xyflow/react are used.
vi.mock('@xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@xyflow/react')>()),
  ReactFlow: (props: ReactFlowProps) => {
    graph = props;
    return null;
  },
  Background: () => null,
  Controls: () => null,
  MiniMap: () => null,
}));
function fixture(): FormSchema {
  const schema = blankForm().schema;
  schema.endings = [{ id: 'done', type: 'message', messages: ['Done'] }];
  const first = makeStep('single_choice', schema.steps);
  first.id = 'first';
  first.options = [
    { id: 'pick', value: 'yes', label: 'Yes', logic: [{ if: { all: [] }, then: { action: 'end', to: 'done' } }] },
  ];
  const second = makeStep('statement', schema.steps);
  second.id = 'second';
  schema.steps = [first, second];
  return schema;
}
describe('schema-backed branching map', () => {
  it('renders and deletes option branches and connects forward branches in the actual schema', async () => {
    let schema = fixture();
    const changed = vi.fn<(schema: FormSchema) => void>(),
      selected = vi.fn();
    const host = document.createElement('div'),
      root = createRoot(host);
    const render = () =>
      act(async () =>
        root.render(
          createElement(FlowMap, {
            schema,
            onChange: (next: FormSchema) => {
              changed(next);
              schema = next;
              void render();
            },
            onSelect: selected,
          }),
        ),
      );
    try {
      await render();
      expect(graph.onNodesChange).toBeTypeOf('function');
      expect(graph.onEdgesChange).toBeTypeOf('function');
      const edge = graph.edges!.find((e) => e.id === 'option-rule:first:pick:0')!;
      expect(edge).toMatchObject({ source: 'first', target: 'done', label: 'Yes: rule 1' });
      // Edge clicks never switch tabs; selection flows through the controlled state.
      expect(graph.onEdgeClick).toBeUndefined();
      await act(async () => graph.onEdgesChange!([{ id: edge.id, type: 'select', selected: true }]));
      expect(graph.edges!.find((e) => e.id === edge.id)?.selected).toBe(true);
      expect(selected).not.toHaveBeenCalled();
      // Dragging moves the node locally and persists the final position.
      await act(async () =>
        graph.onNodesChange!([{ id: 'second', type: 'position', position: { x: 640, y: 320 }, dragging: true }]),
      );
      const moved = graph.nodes!.find((n) => n.id === 'second')!;
      expect(moved.position).toEqual({ x: 640, y: 320 });
      await act(async () => graph.onNodeDragStop?.({} as never, moved, [moved]));
      expect(schema.flowPositions).toEqual([{ id: 'second', x: 640, y: 320 }]);
      expect(graph.nodes!.find((n) => n.id === 'second')!.position).toEqual({ x: 640, y: 320 });
      // The edge stays selected across the schema re-derive.
      expect(graph.edges!.find((e) => e.id === edge.id)?.selected).toBe(true);
      // Node clicks still select the step.
      graph.onNodeClick?.({} as never, moved);
      expect(selected).toHaveBeenCalledWith('second');
      await act(async () => graph.onEdgesDelete?.([edge as Edge]));
      expect(schema.steps[0]!.options![0]!.logic).toEqual([]);
      expect(graph.edges!.some((e) => e.id === edge.id)).toBe(false);
      await act(async () => graph.onConnect?.({ source: 'first', target: 'second', sourceHandle: null, targetHandle: null }));
      // A drawn edge starts with an explicit, editable condition rather than an unconditional jump.
      expect(schema.steps[0]!.logic).toEqual([{ if: { field: schema.steps[0]!.key, source: 'answer', op: 'eq', value: '' }, then: { action: 'jump', to: 'second' } }]);
      expect(graph.edges!.find((e) => e.id === 'rule:first:0')).toMatchObject({ label: 'Rule 1' });
      const calls = changed.mock.calls.length;
      graph.onConnect?.({ source: 'second', target: 'first', sourceHandle: null, targetHandle: null });
      expect(changed).toHaveBeenCalledTimes(calls);
      // Steps cannot be deleted from the map.
      expect(graph.nodes!.every((n) => n.deletable === false)).toBe(true);
    } finally {
      await act(async () => root.unmount());
    }
  });
});
