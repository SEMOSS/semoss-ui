import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import ReactFlow, { MiniMap, Controls } from 'react-flow-renderer';
import { Stack, styled } from '@semoss/ui';
import DotGrid from '@/assets/img/DotGrid.svg';

import { PipelineContext } from '@/contexts';
import { PipelineStore } from '@/stores';

import { NodeRegistry } from './pipeline.types';
import { PipelineNewNodeMenu } from './PipelineNewNodeMenu';
import { PipelineNode } from './PipelineNode';
import { PipelineOverlay } from './PipelineOverlay';

const nodeTypes = {
    pipeline: PipelineNode,
};

const StyledContainer = styled(Stack)(() => ({
    position: 'relative',
    height: '100%',
    width: '100%',
}));

const StyledMenu = styled('div')(() => ({
    height: '100%',
    width: '200px',
}));

const StyledGrid = styled('div')(({ theme }) => ({
    flex: 1,
    position: 'relative',
    height: '100%',
    width: '100%',
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
            <StyledContainer direction={'row'}>
                <StyledMenu>
                    <PipelineNewNodeMenu />
                </StyledMenu>
                <StyledGrid>
                    <ReactFlow
                        nodes={store.graph.nodes}
                        edges={store.graph.edges}
                        onNodesChange={(c) => store.updateNode(c)}
                        onEdgesChange={(e) => console.log('edge ::: ', e)}
                        nodeTypes={nodeTypes}
                    >
                        <MiniMap />
                        <Controls showInteractive={false} />
                    </ReactFlow>
                </StyledGrid>
            </StyledContainer>
        </PipelineContext.Provider>
    );
});
