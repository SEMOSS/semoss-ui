import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import ReactFlow, { MiniMap, Controls } from 'react-flow-renderer';
import { styled } from '@semoss/ui';
import DotGrid from '@/assets/img/DotGrid.svg';

import { PipelineContext } from '@/contexts';
import { PipelineStore } from '@/stores';

import { NodeRegistry } from './pipeline.types';
import { PipelineNode } from './PipelineNode';
import { PipelineOverlay } from './PipelineOverlay';

const nodeTypes = {
    pipeline: PipelineNode,
};

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

interface PipelineProps {
    /** Nodes that are available to the pipeline */
    registry: NodeRegistry;
}

export const Pipeline = observer((props: PipelineProps): JSX.Element => {
    const { registry } = props;

    // create a new instance of the store and provide it to the childen
    const store = useMemo(() => {
        return new PipelineStore();
    }, []);

    return (
        <PipelineContext.Provider
            value={{
                pipeline: store,
                registry: registry,
            }}
        >
            <PipelineOverlay />
            <StyledGrid>
                <ReactFlow
                    nodes={store.renderedNodes}
                    edges={store.renderedEdges}
                    nodeTypes={nodeTypes}
                >
                    <MiniMap />
                    <Controls showInteractive={false} />
                </ReactFlow>
            </StyledGrid>
        </PipelineContext.Provider>
    );
});
