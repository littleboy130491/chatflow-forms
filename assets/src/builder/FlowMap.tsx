/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from '@wordpress/element';
import { useEffect, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import type { FormSchema } from './api';
import '@xyflow/react/dist/style.css';

type MapNode = Node<{ label: string }>;
const shortLabel = (label: string) => [...label].length > 88 ? [...label].slice(0, 87).join('') + '…' : label;
// Wrap the bounded text without clipping the connection handles outside the node.
const nodeStyle = { width: 210, overflowWrap: 'anywhere' as const };
const endingLabel = (ending: FormSchema['endings'][number]) =>
  ending.messages?.find(message => message.trim())?.replace(/\s+/g, ' ').trim() ||
  (ending.type === 'redirect' ? __('Redirect to website', 'chatflow-forms') : __('Thank-you message', 'chatflow-forms'));

/** Schema-derived graph. Nodes are not deletable here: steps are removed in the builder. */
function graph(schema: FormSchema): { nodes: MapNode[]; edges: Edge[] } {
  const position = (id: string, index: number) => {
    const saved = schema.flowPositions?.find((p) => p.id === id);
    return saved ? { x: saved.x, y: saved.y } : { x: 100 + (index % 3) * 250, y: 60 + Math.floor(index / 3) * 145 };
  };
  const nodes: MapNode[] = [
    ...schema.steps.map((s, i) => ({
      id: s.id,
      position: position(s.id, i),
      data: { label: shortLabel(`${i + 1}. ${s.label}`) },
      ariaLabel: `${i + 1}. ${s.label}`,
      style: nodeStyle,
      type: 'default',
      deletable: false,
    })),
    ...schema.endings.map((e, i) => ({
      id: e.id,
      position: position(e.id, schema.steps.length + i),
      data: { label: shortLabel(endingLabel(e)) },
      ariaLabel: endingLabel(e),
      style: nodeStyle,
      type: 'output',
      deletable: false,
    })),
  ];
  const edges: Edge[] = schema.steps.flatMap((s, index) => [
    ...(schema.steps[index + 1]
      ? [
          {
            id: `next:${s.id}`,
            source: s.id,
            target: schema.steps[index + 1]!.id,
            label: __('Next', 'chatflow-forms'),
            deletable: false,
            selectable: false,
            style: { stroke: '#b2b9bf' },
          },
        ]
      : []),
    ...(s.logic ?? []).flatMap((rule, i) =>
      rule.then.action === 'jump' || rule.then.action === 'end'
        ? [
            {
              id: `rule:${s.id}:${i}`,
              source: s.id,
              target: rule.then.to,
              /* translators: %d: rule number within the step */
              label: sprintf(__('Rule %d', 'chatflow-forms'), i + 1),
              animated: true,
            },
          ]
        : [],
    ),
    ...(s.options ?? []).flatMap((option) =>
      (option.logic ?? []).flatMap((rule, i) =>
        rule.then.action === 'jump' || rule.then.action === 'end'
          ? [
              {
                id: `option-rule:${s.id}:${option.id}:${i}`,
                source: s.id,
                target: rule.then.to,
                /* translators: 1: answer option label, 2: rule number within the option */
                label: sprintf(__('%1$s: rule %2$d', 'chatflow-forms'), option.label, i + 1),
                animated: true,
              },
            ]
          : [],
      ),
    ),
  ]);
  return { nodes, edges };
}

export function FlowMap({
  schema,
  onChange,
  onSelect,
}: {
  schema: FormSchema;
  onChange: (schema: FormSchema) => void;
  onSelect: (id: string) => void;
}) {
  const derived = useMemo(() => graph(schema), [schema]);
  // React Flow 12 is controlled: selection, dragging and deletion only work when
  // the change handlers below feed changes back into local node/edge state.
  const [nodes, setNodes, onNodesChange] = useNodesState<MapNode>(derived.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(derived.edges);
  useEffect(() => {
    // Re-derive from the schema while keeping the viewer's current selection.
    setNodes((current) => {
      const selected = new Set(current.filter((n) => n.selected).map((n) => n.id));
      return derived.nodes.map((n) => (selected.has(n.id) ? { ...n, selected: true } : n));
    });
    setEdges((current) => {
      const selected = new Set(current.filter((e) => e.selected).map((e) => e.id));
      return derived.edges.map((e) => (selected.has(e.id) ? { ...e, selected: true } : e));
    });
  }, [derived, setNodes, setEdges]);
  const connect = (connection: Connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return;
    const ending = schema.endings.some((e) => e.id === connection.target);
    const at = schema.steps.findIndex((s) => s.id === connection.source);
    const to = schema.steps.findIndex((s) => s.id === connection.target);
    if (at < 0 || (!ending && to <= at)) return;
    onChange({
      ...schema,
      steps: schema.steps.map((s, i) =>
        i === at
          ? {
              ...s,
              logic: [
                ...(s.logic ?? []),
                { if: { all: [] }, then: { action: ending ? 'end' : 'jump', to: connection.target! } },
              ],
            }
          : s,
      ) as FormSchema['steps'],
    });
  };
  const remove = (removed: Edge[]) => {
    const pairs = removed
      .filter((e) => e.id.startsWith('rule:'))
      .map((e) => ({ source: e.source, target: e.target, index: Number(e.id.split(':').at(-1)) }));
    const options = removed
      .filter((e) => e.id.startsWith('option-rule:'))
      .map((e) => ({
        source: e.source,
        target: e.target,
        option: e.id.split(':')[2],
        index: Number(e.id.split(':').at(-1)),
      }));
    if (!pairs.length && !options.length) return;
    onChange({
      ...schema,
      steps: schema.steps.map((s) => ({
        ...s,
        logic: s.logic?.filter(
          (rule, i) =>
            !pairs.some((p) => p.source === s.id && p.index === i && 'to' in rule.then && p.target === rule.then.to),
        ),
        options: s.options?.map((o) => ({
          ...o,
          logic: o.logic?.filter(
            (rule, i) =>
              !options.some(
                (p) =>
                  p.source === s.id &&
                  p.option === o.id &&
                  p.index === i &&
                  'to' in rule.then &&
                  p.target === rule.then.to,
              ),
          ),
        })),
      })) as FormSchema['steps'],
    });
  };
  return (
    <div className="cff-flow-map" role="region" aria-label={__('Branching flow map', 'chatflow-forms')}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        onConnect={connect}
        onEdgesDelete={remove}
        onNodeClick={(_, node) => {
          if (schema.steps.some((s) => s.id === node.id)) onSelect(node.id);
        }}
        onNodeDragStop={(_, node) => {
          const positions = (schema.flowPositions ?? []).filter((p) => p.id !== node.id);
          onChange({
            ...schema,
            flowPositions: [
              ...positions,
              {
                id: node.id,
                x: Math.max(-10000, Math.min(10000, node.position.x)),
                y: Math.max(-10000, Math.min(10000, node.position.y)),
              },
            ],
          });
        }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      <p>
        {__(
          'Connect a step to a later step or ending to create a branch. Click a branch and press Delete or Backspace to remove it. Click a step to edit its rule conditions. Drag nodes to arrange the map.',
          'chatflow-forms',
        )}
      </p>
    </div>
  );
}
