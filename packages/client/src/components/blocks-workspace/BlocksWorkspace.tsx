import { useEffect, useState, useRef, useCallback } from 'react';
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
import SplitPane, { Pane } from 'react-split-pane';
import { Box } from '@mui/material';

const StyledMain = styled('div')(({ theme }) => ({
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    border: 'solid blue',
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

const StyledBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    height: '100vh',
    position: 'relative',
    userSelect: 'none',
}));

const StyledPane = styled(Box)(({ theme }) => ({
    overflow: 'auto',
}));

const StyledDivider = styled(Box)(({ theme }) => ({
    width: '2px',
    backgroundColor: theme.palette.divider,
    cursor: 'col-resize',
    '&&': {
        cursor: 'col-resize',
    },
    '&:hover': {
        background: theme.palette.action.hover,
        cursor: 'col-resize',
    },
    userSelect: 'none',
}));

const ACTIVE = 'page-1';
interface BlocksWorkspaceProps {
    /** Workspace to render */
    workspace: WorkspaceStore;
}

/**
 * Simply for layout and resizing panels
 * @returns
 */
const SplitScreen = ({ left, middle, right }) => {
    const [isDragging, setIsDragging] = useState(null);
    const [dividerPositions, setDividerPositions] = useState([23, 66]);
    // const [collapsedPanes, setCollapsedPanes] = useState([false, false, false]);

    const handleMouseDown = useCallback(
        (index) => (e) => {
            // e.preventDefault();
            setIsDragging(index);
        },
        [],
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(null);
    }, []);

    const handleMouseMove = useCallback(
        (e) => {
            if (isDragging !== null) {
                const newPosition = (e.clientX / window.innerWidth) * 100;
                setDividerPositions((prevPositions) => {
                    const newPositions = [...prevPositions];
                    newPositions[isDragging] = newPosition;

                    // Ensure dividers don't cross each other
                    if (isDragging === 0) {
                        newPositions[0] = Math.min(
                            newPositions[0],
                            newPositions[1] - 5,
                        );
                    } else {
                        newPositions[1] = Math.max(
                            newPositions[1],
                            newPositions[0] + 5,
                        );
                    }

                    return newPositions;
                });
            }
        },
        [isDragging],
    );

    // const getPaneWidth = (index) => {

    // }

    return (
        <StyledBox
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <StyledPane sx={{ width: `${dividerPositions[0]}%` }}>
                {left}
            </StyledPane>
            <StyledDivider onMouseDown={handleMouseDown(0)} />
            <StyledPane
                sx={{
                    width: `${dividerPositions[1] - dividerPositions[0]}%`,
                    padding: '20px',
                }}
            >
                {middle}
            </StyledPane>
            <StyledDivider onMouseDown={handleMouseDown(1)} />
            <StyledPane sx={{ width: `${100 - dividerPositions[1]}%` }}>
                {right}
            </StyledPane>
        </StyledBox>
    );
};

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
                    <SplitScreen
                        left={<div>Hello</div>}
                        middle={<Designer />}
                        right={<Notebook />}
                    />
                    {/* {workspace.view === 'design' ? <Designer /> : null}
                    {workspace.view === 'data' ? <Notebook /> : null}
                    {workspace.view === 'settings' ? <Settings /> : null} */}
                </StyledMain>
            </Workspace>
        </Blocks>
    );
});
