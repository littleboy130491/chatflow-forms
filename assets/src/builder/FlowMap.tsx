/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ReactFlow, Background, Controls, MiniMap, type Connection, type Edge } from '@xyflow/react';
import type { FormSchema } from './api';
import '@xyflow/react/dist/style.css';

export function FlowMap({ schema, onChange, onSelect }: { schema: FormSchema; onChange: (schema: FormSchema) => void; onSelect: (id: string) => void }) {
  const position = (id: string, index: number) => schema.flowPositions?.find(p => p.id === id) ?? { x: 100 + index % 3 * 250, y: 60 + Math.floor(index / 3) * 145 };
  const nodes = [
    ...schema.steps.map((s, i) => ({ id: s.id, position: position(s.id, i), data: { label: `${i + 1}. ${s.label} (${s.key})` }, type: 'default' })),
    ...schema.endings.map((e, i) => ({ id: e.id, position: position(e.id, schema.steps.length + i), data: { label: `${__('Ending', 'chatflow-forms')}: ${e.id}` }, type: 'output' })),
  ];
  const edges: Edge[] = schema.steps.flatMap((s, index) => [
    ...(schema.steps[index + 1] ? [{ id: `next:${s.id}`, source: s.id, target: schema.steps[index + 1]!.id, label: __('Next', 'chatflow-forms'), deletable: false, style: { stroke: '#b2b9bf' } }] : []),
    ...(s.logic ?? []).flatMap((rule, i) => rule.then.action === 'jump' || rule.then.action === 'end' ? [{ id: `rule:${s.id}:${i}`, source: s.id, target: rule.then.to, label: `Rule ${i + 1}`, animated: true }] : []),
    ...(s.options ?? []).flatMap(option => (option.logic ?? []).flatMap((rule, i) => rule.then.action === 'jump' || rule.then.action === 'end' ? [{ id: `option-rule:${s.id}:${option.id}:${i}`, source: s.id, target: rule.then.to, label: `${option.label}: ${i + 1}`, animated: true }] : [])),
  ]);
  const connect = (connection: Connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return;
    const ending = schema.endings.some(e => e.id === connection.target);
    const at = schema.steps.findIndex(s => s.id === connection.source);
    const to = schema.steps.findIndex(s => s.id === connection.target);
    if (at < 0 || (!ending && to <= at)) return;
    onChange({ ...schema, steps: schema.steps.map((s, i) => i === at ? { ...s, logic: [...s.logic ?? [], { if: { all: [] }, then: { action: ending ? 'end' : 'jump', to: connection.target! } }] } : s) as FormSchema['steps'] });
    onSelect(connection.source);
  };
  const remove = (removed: Edge[]) => {
    const pairs = removed.filter(e => e.id.startsWith('rule:')).map(e => ({ source: e.source, target: e.target, index: Number(e.id.split(':').at(-1)) }));
    const options = removed.filter(e => e.id.startsWith('option-rule:')).map(e => ({ source: e.source, target: e.target, option: e.id.split(':')[2], index: Number(e.id.split(':').at(-1)) }));
    if (!pairs.length && !options.length) return;
    onChange({ ...schema, steps: schema.steps.map(s => ({ ...s, logic: s.logic?.filter((rule, i) => !pairs.some(p => p.source === s.id && p.index === i && 'to' in rule.then && p.target === rule.then.to)), options: s.options?.map(o => ({ ...o, logic: o.logic?.filter((rule, i) => !options.some(p => p.source === s.id && p.option === o.id && p.index === i && 'to' in rule.then && p.target === rule.then.to)) })) })) as FormSchema['steps'] });
  };
  return <div className="cff-flow-map" role="region" aria-label={__('Branching flow map', 'chatflow-forms')}>
    <ReactFlow nodes={nodes} edges={edges} fitView onConnect={connect} onEdgesDelete={remove} onNodeClick={(_, node) => onSelect(node.id)}
      onEdgeClick={(_, edge) => onSelect(edge.source)} onNodeDragStop={(_, node) => {
        const positions = (schema.flowPositions ?? []).filter(p => p.id !== node.id);
        onChange({ ...schema, flowPositions: [...positions, { id: node.id, x: Math.max(-10000, Math.min(10000, node.position.x)), y: Math.max(-10000, Math.min(10000, node.position.y)) }] });
      }}>
      <Background /><Controls /><MiniMap />
    </ReactFlow>
    <p>{__('Connect a step to a later step or ending to create a branch; select the node to edit the rule condition. Drag nodes to arrange the map.', 'chatflow-forms')}</p>
  </div>;
}
