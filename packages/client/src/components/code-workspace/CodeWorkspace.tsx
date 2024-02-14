import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';

import { WorkspaceStore } from '@/stores';

import { Workspace, SettingsView } from '@/components/workspace';

import { CodeWorkspaceActions } from './CodeWorkspaceActions';
import { CodeEditor } from './CodeEditor';
import { CodeWorkspaceTabs } from './CodeWorkspaceTabs';

interface CodeWorkspaceProps {
    /** Workspace to render */
    workspace: WorkspaceStore;
}

/**
 * Render the code workspace
 */
export const CodeWorkspace = observer((props: CodeWorkspaceProps) => {
    const { workspace } = props;

    useEffect(() => {
        // set the initial settings
        workspace.configure({
            view: 'code',
        });
    }, []);

    return (
        <>
            <Workspace
                workspace={workspace}
                startTopbar={<CodeWorkspaceTabs />}
                endTopbar={<CodeWorkspaceActions />}
            >
                {workspace.view === 'code' ? <CodeEditor /> : null}
                {workspace.view === 'settings' ? <SettingsView /> : null}
            </Workspace>
        </>
    );
});
