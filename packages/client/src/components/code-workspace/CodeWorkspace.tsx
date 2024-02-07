import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';

import { WorkspaceStore } from '@/stores';

import { Workspace, SettingsView } from '@/components/workspace';
import { CodeWorkspaceActions } from './CodeWorkspaceActions';
import { CodeEditor } from './CodeEditor';
import { CodeRenderer } from './CodeRenderer';
import { styled, Container } from '@/component-library';

interface CodeWorkspaceProps {
    /** Workspace to render */
    workspace: WorkspaceStore;
}

const StyledContainer = styled('div')(() => ({
    height: '100%',
    overflow: 'scroll',
}));

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
            <Workspace workspace={workspace} actions={<CodeWorkspaceActions />}>
                {!workspace.isEditMode ? (
                    <CodeRenderer appId={workspace.appId} />
                ) : (
                    <>
                        {workspace.view === 'code' ? <CodeEditor /> : null}
                        {workspace.view === 'settings' ? (
                            <StyledContainer>
                                <SettingsView />
                            </StyledContainer>
                        ) : null}
                    </>
                )}
            </Workspace>
        </>
    );
});
