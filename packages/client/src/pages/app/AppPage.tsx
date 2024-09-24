import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Button, useNotification } from '@semoss/ui';

import { useRootStore } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

import { BlocksRenderer } from '@/components/blocks-workspace';
import { CodeRenderer } from '@/components/code-workspace';

import { WorkspaceStore } from '@/stores';
import { Workspace } from '@/components/workspace';

export const AppPage = observer(() => {
    // App ID Needed for pixel calls
    const { appId, ...route } = useParams();
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

    return (
        <Workspace
            workspace={workspace}
            startTopbar={null}
            endTopbar={
                <Button
                    variant="contained"
                    size={'small'}
                    color={'primary'}
                    disabled={
                        !(
                            workspace.role === 'OWNER' ||
                            workspace.role === 'EDIT'
                        )
                    }
                    onClick={() => {
                        navigate('edit');
                    }}
                >
                    Edit App
                </Button>
            }
        >
            {workspace.type === 'CODE' ? (
                <CodeRenderer appId={workspace.appId} />
            ) : null}
            {workspace.type === 'BLOCKS' ? (
                <BlocksRenderer appId={workspace.appId} route={route['*']} />
            ) : null}
        </Workspace>
    );
});
