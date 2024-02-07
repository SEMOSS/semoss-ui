import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { styled, useNotification } from '@/component-library';

import { useRootStore } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

import { BlocksWorkspace } from '@/components/blocks-workspace';
import { CodeWorkspace } from '@/components/code-workspace';

import { WorkspaceStore } from '@/stores';

const StyledViewport = styled('div')(() => ({
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
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
        return <LoadingScreen.Trigger description="Initializing app" />;
    }

    return (
        <StyledViewport>
            {workspace.type === 'CODE' ? (
                <CodeWorkspace workspace={workspace} />
            ) : null}
            {workspace.type === 'BLOCKS' ? (
                <BlocksWorkspace workspace={workspace} />
            ) : null}
        </StyledViewport>
    );
});
