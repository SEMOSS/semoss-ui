import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Button, useNotification } from '@semoss/ui';

import { useRootStore } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

import { BlocksRenderer } from '@/components/blocks-workspace';
import { CodeRenderer } from '@/components/code-workspace';

import { WorkspaceStore } from '@/stores';
import { Workspace } from '@/components/workspace';

const CONFIG: Parameters<WorkspaceStore['configure']>[0] = {
    layout: {
        selected: 'renderer',
        available: [
            {
                id: 'renderer',
                name: 'render',
                data: {
                    global: { tabEnableClose: false },
                    borders: [],
                    layout: {
                        type: 'row',
                        weight: 100,
                        children: [
                            {
                                type: 'tabset',
                                weight: 100,
                                selected: 0,
                                enableTabStrip: false,
                                children: [
                                    {
                                        type: 'tab',
                                        name: 'Renderer',
                                        component: 'renderer',
                                        config: {},
                                    },
                                ],
                            },
                        ],
                    },
                },
            },
        ],
    },
};

export const AppPage = observer(() => {
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
                // set the initial settings
                loadedWorkspace.configure({
                    ...CONFIG,
                });

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

    const factory = useCallback<
        React.ComponentProps<typeof Workspace>['factory']
    >(
        (node) => {
            const component = node.getComponent();

            if (component === 'renderer') {
                if (workspace.type === 'CODE') {
                    return <CodeRenderer appId={workspace.appId} />;
                } else if (workspace.type === 'BLOCKS') {
                    return <BlocksRenderer appId={workspace.appId} />;
                }
            }

            return <>{component}</>;
        },
        [workspace?.type, workspace?.appId],
    );

    // hide the screen while it loads
    if (!workspace) {
        return <LoadingScreen.Trigger description="Initializing app" />;
    }

    //TODO: Render directly here. Remove workspace.
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
            factory={factory}
        ></Workspace>
    );
});
