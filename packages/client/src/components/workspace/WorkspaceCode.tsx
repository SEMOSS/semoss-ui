import { observer } from 'mobx-react-lite';

import { useWorkspace } from '@/hooks';
import { WorkspaceDef } from '@/types';

import { SettingsView } from './settings-view';
import { CodeView } from './code-view';
import { WorkspaceOverlay } from './WorkspaceOverlay';

export interface WorkspaceCodeDef extends WorkspaceDef<'code'> {
    /** Type of the workspace */
    type: 'code';

    /** Options of the workspace */
    options: Record<string, never>;
}

/**
 * Render the code workspace
 */
export const WorkspaceCode = observer(() => {
    const { workspace } = useWorkspace<WorkspaceCodeDef>();

    return (
        <>
            <WorkspaceOverlay />
            {workspace.view === 'design' ? <CodeView /> : null}
            {workspace.view === 'settings' ? <SettingsView /> : null}
        </>
    );
});
