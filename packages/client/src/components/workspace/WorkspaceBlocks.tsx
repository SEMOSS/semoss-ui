import { observer } from 'mobx-react-lite';

import { useWorkspace } from '@/hooks';
import { WorkspaceDef } from '@/types';
import { StateStoreImplementation } from '@/stores';
import { DefaultBlocks } from '@/components/block-defaults';
import { Blocks } from '@/components/blocks';

import { BlocksView } from './blocks-view';
import { DataView } from './data-view';
import { SettingsView } from './settings-view';
import { WorkspaceOverlay } from './WorkspaceOverlay';

export interface WorkspaceBlocksDef extends WorkspaceDef<'blocks'> {
    /** Type of the workspace */
    type: 'blocks';

    /** Options of the workspace */
    options: {
        /** State to load */
        state: StateStoreImplementation;
    };
}

/**
 * Render the Blocks worksapce
 */
export const WorkspaceBlocks = observer(() => {
    const { workspace } = useWorkspace<WorkspaceBlocksDef>();

    console.log(workspace.view);

    return (
        <Blocks state={workspace.options.state} registry={DefaultBlocks}>
            <WorkspaceOverlay />
            {workspace.view === 'design' ? <BlocksView /> : null}
            {workspace.view === 'data' ? <DataView /> : null}
            {workspace.view === 'settings' ? <SettingsView /> : null}
        </Blocks>
    );
});
