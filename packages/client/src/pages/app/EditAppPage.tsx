import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useNotification } from '@semoss/ui';

import { useRootStore } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

import { BlocksWorkspace } from '@/components/blocks-workspace';
import { CodeWorkspace } from '@/components/code-workspace';

import { WorkspaceStore } from '@/stores';

export const EditAppPage = observer(() => {
    // App ID Needed for pixel calls
    const { appId } = useParams();
    const { configStore } = useRootStore();

    const notification = useNotification();
    const navigate = useNavigate();

    const [workspace, setWorkspace] = useState<WorkspaceStore>(undefined);

    useEffect(() => {
        // clear out the old app
        setWorkspace(undefined);

        configStore
            .createWorkspace(appId)
            .then((loadedWorkspace) => {
                setWorkspace(loadedWorkspace);
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

    if (workspace.type === 'CODE') {
        return <CodeWorkspace workspace={workspace} />;
    }

    if (workspace.type === 'BLOCKS') {
        return <BlocksWorkspace workspace={workspace} />;
    }

    return null;
});
