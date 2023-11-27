import { useMemo } from 'react';
import { StateStore, DesignerStore } from '@/stores';
import { Designer } from '@/components/designer';
import { Blocks, Renderer } from '@/components/blocks';
import { DefaultBlocks } from '@/components/block-defaults';
import { styled } from '@semoss/ui';
import { observer } from 'mobx-react-lite';

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

const ACTIVE = 'page-1';

export const DesignPage = observer(() => {
    /**
     * Have the designer control the blocks
     */
    const designer = useMemo(() => {
        const d = new DesignerStore(StateStore);

        // set the rendered one
        d.setRendered(ACTIVE);

        // return the store
        return d;
    }, [StateStore]);

    return (
        <StyledViewport>
            <StyledContent>
                <Blocks state={StateStore} registry={DefaultBlocks}>
                    <Designer designer={designer}>
                        <Renderer id={ACTIVE} />
                    </Designer>
                </Blocks>
            </StyledContent>
        </StyledViewport>
    );
});
