import React, { useMemo, useCallback } from 'react';
import { useBlocks } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { QueryStateConfig } from '@/stores';
import { Stack, Typography } from '@semoss/ui';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Node,
} from '@xyflow/react';
import { CustomEdge } from './CustomEdge';
import { CellNode } from './CellNode';
import { DependencyNode } from './DependencyNode';
import { BlockNode } from './BlockNode';

const nodeTypes = {
    BLOCK_NODE: BlockNode,
    CELL_NODE: CellNode,
    DEPENDENCY_NODE: DependencyNode,
};

const edgeTypes = {
    'start-end': CustomEdge,
};

const defaultViewport = { x: 50, y: 50, zoom: 0 };

type NodeTypes =
    | Node
    | {
          id: string;
          type: 'CELL_NODE';
          position: { x: number; y: number };
          data: { to: string };
      }
    | {
          id: string;
          type: 'DEPENDENCY_NODE';
          position: { x: number; y: number };
          data: { to: string };
      }
    | {
          id: string;
          type: 'BLOCK_NODE';
          position: { x: number; y: number };
          data: { to: string };
      };

export const Pipeline = observer(() => {
    const { state } = useBlocks();

    /**
     * Do i need to set relations directly on each node
     * If so
     */
    const qs = useMemo(() => {
        console.log(state.queries['default']);
        return state.queries['default'] ? state.queries['default'] : null;
    }, [state.queries.list]);

    return (
        <Stack sx={{ height: '100%' }}>
            {qs ? <Child nodes={qs.nodes} edges={qs.edges} /> : null}
        </Stack>
    );
});

export const Child = (props: { nodes: NodeTypes[]; edges: [] }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState<NodeTypes>(
        props.nodes,
    );
    const [edges, setEdges, onEdgesChange] = useEdgesState(props.edges);

    // debugger;
    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );
    return (
        <Stack
            direction={'column'}
            gap={2}
            sx={{ height: '100%', border: 'solid red' }}
        >
            <Typography variant={'caption'}>Pipeline</Typography>{' '}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultViewport={defaultViewport}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
            >
                {/* <MiniMap /> */}
                <Controls />
                <Background />
            </ReactFlow>
        </Stack>
    );
};
