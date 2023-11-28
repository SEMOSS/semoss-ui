import { observer } from 'mobx-react-lite';
import { styled } from '@semoss/ui';

import { StateStore } from '@/stores';
import { Blocks } from '@/components/blocks';
import { DefaultBlocks } from '@/components/block-defaults';
import { Notebook } from '@/components/notebook';

const StyledViewport = styled('div')(() => ({
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
}));

const StyledContent = styled('div')(() => ({
    flex: '1',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

export const NotebookPage = observer(() => {
    return (
        <StyledViewport>
            <StyledContent>
                <Blocks state={StateStore} registry={DefaultBlocks}>
                    <Notebook />
                </Blocks>
            </StyledContent>
        </StyledViewport>
    );
});
