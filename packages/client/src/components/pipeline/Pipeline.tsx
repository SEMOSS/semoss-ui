import ReactFlow, { MiniMap, Controls, Node, Edge } from 'react-flow-renderer';
import { styled } from '@semoss/ui';
import DotGrid from '@/assets/img/DotGrid.svg';

import { PipelineNode } from './PipelineNode';
import { PipelineNodeData } from './pipeline.types';

const nodeTypes = {
    pipeline: PipelineNode,
};

const nodes: Node<PipelineNodeData>[] = [
    {
        id: 'node--1',
        type: 'pipeline',
        data: {
            widget: 'import',
            parameters: {
                FRAME: {
                    type: 'frame',
                    value: '',
                },
            },
            input: [],
            output: ['FRAME'],
        },
        position: {
            x: 50,
            y: 50,
        },
    },
    {
        id: 'node--2',
        type: 'pipeline',
        data: {
            widget: 'import',
            parameters: {
                FRAME: {
                    type: 'frame',
                    value: '',
                },
            },
            input: [],
            output: ['FRAME'],
        },
        position: {
            x: 50,
            y: 250,
        },
    },
    {
        id: 'node--3',
        type: 'pipeline',
        data: {
            widget: 'merge',

            parameters: {
                SOURCE_1: {
                    type: 'frame',
                    value: '',
                },
                SOURCE_2: {
                    type: 'frame',
                    value: '',
                },
                TARGET: {
                    type: 'frame',
                    value: '',
                },
            },
            input: ['SOURCE_1', 'SOURCE_2'],
            output: ['TARGET'],
        },
        position: {
            x: 500,
            y: 125,
        },
    },
    {
        id: 'node--4',
        type: 'pipeline',
        data: {
            widget: 'agent',
            parameters: {
                FRAME: {
                    type: 'frame',
                    value: '',
                },
            },
            input: ['FRAME'],
            output: [],
        },
        position: {
            x: 900,
            y: 125,
        },
    },
];

const edges: Edge[] = [
    {
        id: 'edge--1',
        type: 'pipeline',
        source: 'node--1',
        sourceHandle: 'FRAME',
        target: 'node--3',
        targetHandle: 'SOURCE_1',
    },
    {
        id: 'edge--2',
        type: 'pipeline',
        source: 'node--2',
        sourceHandle: 'FRAME',
        target: 'node--3',
        targetHandle: 'SOURCE_2',
    },
    {
        id: 'edge--3',
        type: 'pipeline',
        source: 'node--3',
        sourceHandle: 'FRAME',
        target: 'node--4',
        targetHandle: 'FRAME',
    },
];

const StyledGrid = styled('div')(({ theme }) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url(${DotGrid})`,
    backgroundRepeat: 'repeat',
    backgroundColor: theme.palette.background.default,
}));

export const Pipeline = (): JSX.Element => {
    return (
        <>
            <StyledGrid>
                <ReactFlow
                    defaultNodes={nodes}
                    defaultEdges={edges}
                    nodeTypes={nodeTypes}
                >
                    <MiniMap />
                    <Controls showInteractive={false} />
                </ReactFlow>
            </StyledGrid>
        </>
    );
};
