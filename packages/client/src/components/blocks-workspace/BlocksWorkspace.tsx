import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNotification } from '@semoss/ui';

import { runPixel } from '@/api';
import { SerializedState, StateStore, WorkspaceStore } from '@/stores';
import { DefaultCellTypes } from '@/components/cell-defaults';
import { DefaultBlocks } from '@/components/block-defaults';
import { Blocks, Renderer } from '@/components/blocks';
import { Notebook } from '@/components/notebook';
import { Workspace, SettingsView } from '@/components/workspace';
import { LoadingScreen } from '@/components/ui';
import { BlocksView } from './BlocksView';
import { BlocksWorkspaceActions } from './BlocksWorkspaceActions';
import { BlocksWorkspaceDev } from './BlocksWorkspaceDev';

const ACTIVE = 'page-1';

interface BlocksWorkspaceProps {
    /** Workspace to render */
    workspace: WorkspaceStore;
}

/**
 * Render the Blocks worksapce
 */
export const BlocksWorkspace = observer((props: BlocksWorkspaceProps) => {
    const { workspace } = props;
    const notification = useNotification();

    const [state, setState] = useState<StateStore>();

    useEffect(() => {
        // set the initial settings
        workspace.configure({
            view: 'design',
        });

        // start the loading screen
        workspace.setLoading(true);

        // load the app
        runPixel<[SerializedState]>(
            `GetAppBlocksJson ( project=["${workspace.appId}"]);`,
            'new',
        )
            .then(({ pixelReturn, errors, insightId }) => {
                if (errors.length) {
                    throw new Error(errors.join(''));
                }

                // get the output (SerializedState)
                const { output } = pixelReturn[0];

                // create a new state store
                const s = new StateStore({
                    insightId: insightId,
                    state: output,
                    cellTypeRegistry: DefaultCellTypes,
                });

                // set it
                setState(s);
            })
            .catch((e) => {
                notification.add({
                    color: 'error',
                    message: e.message,
                });
            })
            .finally(() => {
                // close the loading screen
                workspace.setLoading(false);
            });
    }, []);

    if (!state) {
        return <LoadingScreen.Trigger />;
    }

    return (
        <Blocks state={state} registry={DefaultBlocks}>
            <Workspace
                workspace={workspace}
                actions={<BlocksWorkspaceActions />}
            >
                {process.env.NODE_ENV == 'development' && (
                    <BlocksWorkspaceDev />
                )}
                {!workspace.isEditMode ? (
                    <Renderer id={ACTIVE} />
                ) : (
                    <>
                        {workspace.view === 'design' ? <BlocksView /> : null}
                        {workspace.view === 'data' ? <Notebook /> : null}
                        {workspace.view === 'settings' ? (
                            <SettingsView />
                        ) : null}
                    </>
                )}
            </Workspace>
        </Blocks>
    );
});
