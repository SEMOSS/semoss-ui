import { ActionMessages, Query, StateStore } from '@/stores';
import { BlocksBuilder as DesignerPage } from '@semoss/blocks/src/BlocksBuilder';
import { styled } from '@semoss/ui';
import { runPixel } from '@/api';

const NAV_HEIGHT = '48px';

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

export const DesignPage = () => {
    return (
        <StyledViewport>
            <StyledContent>
                <DesignerPage
                    blocks={StateStore.blocks}
                    queries={StateStore.queries}
                    run={(pixel: string) => runPixel('', pixel)}
                    editMode={true}
                    customBlocks={undefined}
                />
            </StyledContent>
        </StyledViewport>
    );
};
