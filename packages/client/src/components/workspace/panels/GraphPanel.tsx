import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { addEdge, ReactFlow } from '@xyflow/react';
import { Node, Edge } from '@xyflow/react';
import { useNodesState, useEdgesState } from '@xyflow/react';

import { useBlocks } from '@semoss/renderer';
import { Typography, useNotification } from '@semoss/ui';

import { AnimatedNodeEdge } from './AnimatedNodeEdge';
import { Panel } from './Panel';

const edgeTypes = {
    animatedNode: AnimatedNodeEdge,
};

export const GraphPanel: React.FC = observer(() => {
    const notification = useNotification();

    const { state } = useBlocks();
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
    console.log('graph panel', state.dependencyGraph);

    return (
        <Panel>
            <ReactFlow
                // width={'100%'}
                nodes={nodes}
                edges={edges}
                onConnect={onConnect}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                edgeTypes={edgeTypes}
                fitView
            />
        </Panel>
    );
});
