import { observer } from 'mobx-react-lite';

import { Typography, useNotification } from '@semoss/ui';
import { Panel } from './Panel';
import { ReactFlow } from '@xyflow/react';
import { useBlocks } from '@semoss/renderer';
import { Node, Edge } from '@xyflow/react';

export const GraphPanel: React.FC = observer(() => {
    const notification = useNotification();

    const { state } = useBlocks();

    console.log('graph panel', state.dependencyGraph);

    return (
        <Panel>
            <ReactFlow
                // width={'100%'}
                nodes={state.dependencyGraph.nodes_two as Node[]}
                edges={state.dependencyGraph.edges as Edge[]}
                fitView
            />
        </Panel>
    );
});
