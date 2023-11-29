import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { styled, useNotification } from '@semoss/ui';

import { WorkspaceContext } from '@/contexts';
import { useRootStore } from '@/hooks';
import { Navbar, LoadingScreen } from '@/components/ui';

import {
    WorkspaceActions,
    WorkspaceCode,
    WorkspaceBlocks,
} from '@/components/workspace';
import { WorkspaceStore } from '@/stores';
import { AppRenderer } from '@/components/app';

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
    paddingTop: NAV_HEIGHT,
}));

export const AppPage = observer(() => {
    // App ID Needed for pixel calls
    const { appId } = useParams();
    const { cache } = useRootStore();

    const notification = useNotification();
    const navigate = useNavigate();

    const [workspace, setWorkspace] = useState<WorkspaceStore>(undefined);

    useEffect(() => {
        // see if the workspace is already loaded
        if (cache.containsWorkspace(appId)) {
            // load the cached workspace
            const w = cache.getWorkspace(appId);
            setWorkspace(w);

            return;
        }

        // clear out the old app
        setWorkspace(undefined);

        if (appId === 'blocks') {
            cache
                .loadBlocksWorkspace(appId)
                .then((loadedApp) => {
                    setWorkspace(loadedApp);
                })
                .catch((e) => {
                    console.log(e);
                });

            return;
        }

        // load the app
        cache
            .loadWorkspace(appId)
            .then((loadedApp) => {
                setWorkspace(loadedApp);
            })
            .catch((e) => {
                notification.add({
                    color: 'error',
                    message: e.message,
                });

                navigate('/');
            });
    }, [appId]);

    // hide the screen while it loads
    if (!workspace) {
        return <LoadingScreen.Trigger description="Loading app" />;
    }

    return (
        <WorkspaceContext.Provider
            value={{
                workspace: workspace,
            }}
        >
            <StyledViewport>
                <Navbar>
                    <WorkspaceActions />
                </Navbar>
                <StyledContent>
                    {!workspace.isEditMode ? (
                        <AppRenderer appId={workspace.appId} />
                    ) : null}
                    {workspace.isEditMode && workspace.type === 'code' ? (
                        <WorkspaceCode />
                    ) : null}
                    {workspace.isEditMode && workspace.type === 'blocks' ? (
                        <WorkspaceBlocks />
                    ) : null}
                </StyledContent>
            </StyledViewport>
        </WorkspaceContext.Provider>
    );
});
