import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useNotification } from '@semoss/ui';

import { usePixel, useRootStore } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

import { BlocksWorkspace } from '@/components/blocks-workspace';
import { CodeWorkspace } from '@/components/code-workspace';

import { WorkspaceStore } from '@/stores';

export const WorkspacePage = observer(() => {
    // App ID Needed for pixel calls
    const { appId } = useParams();
    const { configStore } = useRootStore();

    const notification = useNotification();
    const navigate = useNavigate();

    const [workspace, setWorkspace] = useState<WorkspaceStore>(undefined);

    const validateDependencies = usePixel(
        appId
            ? 'ValidateUserProjectDependencies(project="' + appId + '");'
            : '',
    );

    useEffect(() => {
        let isMounted = true;
        if (appId) {
            // clear out the old app
            setWorkspace(undefined);

            configStore
                .createWorkspace(appId)
                .then((loadedWorkspace) => {
                    if (isMounted) {
                        setWorkspace(loadedWorkspace);
                    }
                })
                .catch((e) => {
                    notification.add({
                        color: 'error',
                        message: e.message,
                    });

                    navigate('/');
                });
        }

        return () => {
            isMounted = false;
        };
    }, [appId]);

    useEffect(() => {
        if (validateDependencies.status !== 'SUCCESS') {
            return;
        } else if (validateDependencies.data !== null) {
            const needsAccess = [];
            Object.entries(validateDependencies.data).forEach((kv) => {
                const hasAccess = kv[1];

                if (!hasAccess) {
                    needsAccess.push(kv[0]);
                }
            });
            if (needsAccess.length) {
                notification.add({
                    color: 'warning',
                    message:
                        needsAccess.join(', ') +
                        '- are dependencies you do not have access to',
                });
            }
        }
    }, [validateDependencies.status, validateDependencies.data]);

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
