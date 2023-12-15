import { useMemo } from 'react';
import { DesignerStore } from '@/stores';
import { Designer } from '@/components/designer';
import { Renderer } from '@/components/blocks';
import { useBlocks } from '@/hooks';

const ACTIVE = 'page-1';

export const BlocksView = () => {
    const { state } = useBlocks();

    /**
     * Have the designer control the blocks
     */
    const designer = useMemo(() => {
        // set the state
        const d = new DesignerStore(state);

        // set the rendered one
        d.setRendered(ACTIVE);

        // return the store
        return d;
    }, [state]);

    if (!designer) {
        return null;
    }

    return (
        <Designer designer={designer}>
            <Renderer id={ACTIVE} />
        </Designer>
    );
};
