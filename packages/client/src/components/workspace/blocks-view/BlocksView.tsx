import { useMemo } from 'react';
import { DesignerStore, StateStore } from '@/stores';
import { Designer } from '@/components/designer';
import { Blocks, Renderer } from '@/components/blocks';
import { DefaultBlocks } from '@/components/block-defaults';

const ACTIVE = 'page-1';

export const BlocksView = () => {
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
        <Blocks state={StateStore} registry={DefaultBlocks}>
            <Designer designer={designer}>
                <Renderer id={ACTIVE} />
            </Designer>
        </Blocks>
    );
};
