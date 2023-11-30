import { useMemo } from 'react';
import { DesignerStore } from '@/stores';
import { Designer } from '@/components/designer';
import { Renderer } from '@/components/blocks';
import { useWorkspace } from '@/hooks';

import { WorkspaceBlocksDef } from '../WorkspaceBlocks';

const ACTIVE = 'page-1';

export const BlocksView = () => {
    const { workspace } = useWorkspace<WorkspaceBlocksDef>();

    /**
     * Have the designer control the blocks
     */
    const designer = useMemo(() => {
        // set the state
        const d = new DesignerStore(workspace.options.state);

        // set the rendered one
        d.setRendered(ACTIVE);

        // return the store
        return d;
    }, [workspace.options.state]);

    if (!designer) {
        return null;
    }

    return (
        <Designer designer={designer}>
            <Renderer id={ACTIVE} />
        </Designer>
    );
};
