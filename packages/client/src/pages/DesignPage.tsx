import { useMemo, useEffect } from 'react';

import {
    DesignerStore,
    Block,
    ActionMessages,
    Query,
    StateStore,
    StateStoreImplementation,
} from '@/stores';
import { Designer } from '@/components/designer';
import { Blocks, Renderer } from '@/components/blocks';
import { DefaultBlocks } from '@/components/block-defaults';

const ACTIVE = 'page-1';

export function DesignPage(props: { store: StateStoreImplementation }) {
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
        // TODO: Fix
        <div style={{ height: '100vh', width: '100vw' }}>
            <Blocks state={props.store} registry={DefaultBlocks}>
                <Designer designer={designer}>
                    <Renderer id={ACTIVE} />
                </Designer>
            </Blocks>
        </div>
    );
}
