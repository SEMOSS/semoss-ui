import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { addEdge, ReactFlow } from '@xyflow/react';
import { Node, Edge } from '@xyflow/react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import dagre from '@dagrejs/dagre';

import { useBlocks } from '@semoss/renderer';
import { Button, Stack, Typography, useNotification } from '@semoss/ui';

import { AnimatedNodeEdge } from './AnimatedNodeEdge';
import { Panel } from './Panel';
import { BlockNode } from './dependency-graph/BlockNode';
import { CellNode } from './dependency-graph/CellNode';
import { useDesigner } from '@/hooks';
import { AnimatedEdge } from './dependency-graph/AnimatedEdge';
import { AnimatedSvgEdge } from './dependency-graph/AnimatedSvgEdge';

const nodeWidth = 172;
const nodeHeight = 36;

function getLayoutedElements(nodes, edges, direction = 'TB') {
    const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(
        () => ({}),
    );
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const { x, y } = dagreGraph.node(node.id);
        return {
            ...node,
            position: { x: x - nodeWidth / 2, y: y - nodeHeight / 2 },
            targetPosition: direction === 'LR' ? 'left' : 'top',
            sourcePosition: direction === 'LR' ? 'right' : 'bottom',
        };
    });

    return { nodes: layoutedNodes, edges };
}

const edgeTypes = {
    animatedEdge: AnimatedEdge,
    animatedSvgEdge: AnimatedSvgEdge,
};

const nodeTypes = {
    blockNode: BlockNode,
    cellNode: CellNode,
};

export const GraphPanel: React.FC = observer(() => {
    const notification = useNotification();
    const { designer } = useDesigner();
    const { state, notebook } = useBlocks();

    const [nodes, setNodes, onNodesChange] = useNodesState(
        state.dependencyGraph.nodes_two as Node[],
    );
    const [edges, setEdges, onEdgesChange] = useEdgesState(
        state.dependencyGraph.edges as Edge[],
    );

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const onLayout = useCallback(
        (direction) => {
            const { nodes: layoutedNodes, edges: layoutedEdges } =
                getLayoutedElements(nodes, edges, direction);

            setNodes([...layoutedNodes]);
            setEdges([...layoutedEdges]);
        },
        [nodes, edges, setNodes, setEdges],
    );

    return (
        <Panel>
            <Stack>
                <Button onClick={() => onLayout('LR')}>Horizontal</Button>
                <Button onClick={() => onLayout('TB')}>Vertical</Button>
            </Stack>
            <ReactFlow
                // width={'100%'}
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onConnect={onConnect}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={(event, node) => {
                    if (node.type === 'blockNode') {
                        console.log('highlick block');
                        designer.setSelected(node.data.id as string);
                    } else if (node.type === 'cellNode') {
                        console.log('highlick query', node.data.queryId);
                        console.log('highlight cell', node.data.id);

                        notebook.selectCell(
                            node.data.queryId as string,
                            node.data.id as string,
                        );
                    }
                }}
                onNodeMouseEnter={(event, node) => {
                    if (node.type === 'blockNode') {
                        console.log('highlick block');
                        designer.setHovered(node.data.id as string);
                    }
                }}
                onNodeMouseLeave={(event, node) => {
                    if (node.type === 'blockNode') {
                        console.log('highlick block');
                        designer.setHovered('');
                    }
                }}
                fitView
            />
        </Panel>
    );
});
