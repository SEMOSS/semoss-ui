import { autorun } from 'mobx';
import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNotification, styled, Typography, Stack, Icon } from '@semoss/ui';

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
import { ConstructionOutlined } from '@mui/icons-material';

const StyledContainer = styled('div')(({ theme }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

const StyledScrollContainer = styled('div')(({ theme }) => ({
    height: '100%',
    overflow: 'scroll',
}));

const StyledMain = styled('div')(({ theme }) => ({
    flex: 1,
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
            .then(({ pixelReturn, errors, insightId }) => {
                if (errors.length) {
                    throw new Error(errors.join(''));
                }

                // get the output (SerializedState)
                const { output } = pixelReturn[0];

                // create a new state store
                const s = new StateStore({
                    mode: 'interactive',
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

                console.error(e);
            })
            .finally(() => {
                // close the loading screen
                workspace.setLoading(false);
            });
    }, []);

    // TODO: Convert to render context
    // update based on the mode
    useEffect(
        () =>
            autorun(() => {
                if (!state) {
                    return;
                }

                if (workspace.isEditMode) {
                    state.updateMode('static');
                } else {
                    state.updateMode('interactive');
                }
            }),
        [state],
    );

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
                    <StyledContainer>
                        <StyledMain>
                            {workspace.view === 'design' ? (
                                <BlocksView />
                            ) : null}
                            {workspace.view === 'data' ? <Notebook /> : null}
                            {workspace.view === 'settings' ? (
                                <StyledScrollContainer>
                                    <SettingsView />
                                </StyledScrollContainer>
                            ) : null}
                        </StyledMain>
                        <StyledFooter>
                            <Stack
                                direction="row"
                                padding={0}
                                spacing={0.5}
                                alignItems={'center'}
                            >
                                <Icon fontSize="small" color="warning">
                                    <ConstructionOutlined
                                        fontSize="inherit"
                                        color={'inherit'}
                                    />
                                </Icon>
                                <Typography
                                    variant={'caption'}
                                    fontWeight="bold"
                                >
                                    Note:
                                </Typography>
                                <Typography variant={'caption'}>
                                    This feature is currently in alpha.
                                </Typography>
                            </Stack>
                        </StyledFooter>
                    </StyledContainer>
                )}
            </Workspace>
        </Blocks>
    );
});
