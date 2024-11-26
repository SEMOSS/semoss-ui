import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useNotification } from '@semoss/ui';

import { useRootStore } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

import { BlocksWorkspace, CodeWorkspace } from '@/components/workspace';
import { WorkspaceApp } from '@/stores';

export const WorkspacePage = observer(() => {
    // App ID Needed for pixel calls
    const { appId } = useParams();
    const { configStore } = useRootStore();

    const notification = useNotification();
    const navigate = useNavigate();

    const [app, setApp] = useState<WorkspaceApp | null>(null);

    useEffect(() => {
        // clear out the old app
        setApp(null);

        configStore
            .loadApp(appId)
            .then((app) => {
                setApp(app as WorkspaceApp);
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
    if (!app) {
        return <LoadingScreen.Trigger description="Initializing app" />;
    }

    if (app.type === 'CODE') {
        return <CodeWorkspace app={app} />;
    }

    if (app.type === 'BLOCKS') {
        return <BlocksWorkspace app={app} />;
    }

    return null;
});
