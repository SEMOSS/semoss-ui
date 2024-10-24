import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNotification, styled, Typography, Stack } from '@semoss/ui';

import { runPixel } from '@/api';
import {
    SerializedState,
    StateStore,
    WorkspaceStore,
    MigrationManager,
    STATE_VERSION,
} from '@/stores';
import { DefaultCells } from '@/components/cell-defaults';
import { DefaultBlocks } from '@/components/block-defaults';
import { Blocks } from '@/components/blocks';
import { Notebook } from '@/components/notebook';
import { Designer } from '@/components/designer';
import { Workspace, Settings } from '@/components/workspace';
import { LoadingScreen } from '@/components/ui';
import { BlocksWorkspaceActions } from './BlocksWorkspaceActions';
import { BlocksWorkspaceDev } from './BlocksWorkspaceDev';
import { ConstructionOutlined } from '@mui/icons-material';
import { BlocksWorkspaceTabs } from './BlocksWorkspaceTabs';

const StyledMain = styled('div')(({ theme }) => ({
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

const StyledFooter = styled('div')(({ theme }) => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    height: theme.spacing(4),
    width: '100%',
    background: 'rgba(253, 237, 225, 1)',
}));

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
            .then(async ({ pixelReturn, errors, insightId }) => {
                if (errors.length) {
                    throw new Error(errors.join(''));
                }

                // get the output (SerializedState)
                const { output } = pixelReturn[0];

                // assume the output is the current state
                let state = output;

                // run migration if not up to date
                if (state.version !== STATE_VERSION) {
                    const migration = new MigrationManager();
                    state = await migration.run(output);
                }

                // create a new state store
                const s = new StateStore({
                    mode: 'static',
                    insightId: insightId,
                    state: state,
                    cellRegistry: DefaultCells,
                });

                // set it
                setState(s);

                const { errors: errs } = await runPixel(
                    `SetContext("${workspace.appId}");`,
                    insightId,
                );

                if (errs.length) {
                    notification.add({
                        color: 'error',
                        message: errs.join(''),
                    });
                }
            })
            .catch((e) => {
                notification.add({
                    color: 'error',
                    message: e.message,
                });

                console.error(e);
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
                startTopbar={<BlocksWorkspaceTabs />}
                endTopbar={<BlocksWorkspaceActions />}
                footer={
                    <StyledFooter>
                        <Stack
                            direction="row"
                            padding={0}
                            spacing={0.5}
                            alignItems={'center'}
                        >
                            <ConstructionOutlined
                                fontSize="small"
                                color={'warning'}
                            />
                            <Typography variant={'caption'} fontWeight="bold">
                                Note:
                            </Typography>
                            <Typography variant={'caption'}>
                                This feature is currently in alpha.
                            </Typography>
                        </Stack>
                    </StyledFooter>
                }
            >
                {process.env.NODE_ENV == 'development' && (
                    <BlocksWorkspaceDev />
                )}
                <StyledMain>
                    {workspace.view === 'design' ? <Designer /> : null}
                    {workspace.view === 'data' ? <Notebook /> : null}
                    {workspace.view === 'settings' ? <Settings /> : null}
                </StyledMain>
            </Workspace>
        </Blocks>
    );
});
