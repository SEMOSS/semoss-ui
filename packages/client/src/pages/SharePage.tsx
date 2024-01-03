import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { styled, useNotification } from '@semoss/ui';

import { useRootStore } from '@/hooks';
import { WorkspaceStore } from '@/stores';
import { LoadingScreen } from '@/components/ui';
import { CodeRenderer } from '@/components/code-workspace';
import { BlocksRenderer } from '@/components/blocks-workspace';

const StyledViewport = styled('div')(() => ({
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
}));

export const SharePage = observer(() => {
    // App ID Needed for pixel calls
    const { appId } = useParams();
    const { cache } = useRootStore();

    const notification = useNotification();
    const navigate = useNavigate();

    const [workspace, setWorkspace] = useState<WorkspaceStore>(undefined);

    useEffect(() => {
        // clear out the old app
        setWorkspace(undefined);

        // load a fresh copy of the app
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
                <CodeRenderer appId={workspace.appId} />
            ) : null}
            {workspace.type === 'BLOCKS' ? (
                <BlocksRenderer appId={workspace.appId} />
            ) : null}
        </StyledViewport>
    );
});
