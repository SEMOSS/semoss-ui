import { useEffect, useMemo, useState } from 'react';
import { styled, Button, Stack, Typography, useNotification } from '@semoss/ui';
import { ContentCopyOutlined } from '@mui/icons-material';

import { useEngine, usePixel } from '@/hooks';
import { LoadingScreen, Section } from '@/components/ui';
import {
    ActionMessages,
    SerializedState,
    StateStore,
    WorkspaceOptions,
} from '@/stores';
import { runPixel } from '@/api';
import { DefaultCells } from '@/components/cell-defaults';
import { Workspace, WorkspaceRenderer } from '@/components/workspace';
import { NotebookViewerPanel } from '@/components/panels';
import { Blocks } from '@/components/blocks';

const StyledContainer = styled('div')(() => ({
    height: '50vh',
    width: '100%',
}));

const StyledCodeBlock = styled('pre')(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '40px',
    background: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    margin: '0px',
}));

const StyledCodeContent = styled('code')(() => ({
    flex: 1,
    overflowX: 'scroll',
}));

const DEFAULT_OPTIONS: WorkspaceOptions = {
    version: '',
    drawer: {
        isOpen: false,
    },
    layout: {
        selected: 'settings',
        available: {
            settings: {
                id: 'settings',
                name: 'Settings',
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
                                enableTabStrip: true,
                                children: [
                                    {
                                        type: 'tab',
                                        name: 'Notebook',
                                        component: 'notebook-viewer',
                                        config: {
                                            id: 'engine-notebook',
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                },
            },
        },
    },
};

/**
 * Wrap the Database, Storage, Model routes
 */
export const EngineUsagePage = () => {
    // get the engine information
    const { id } = useEngine();
    const notification = useNotification();

    // get the engine info
    const getEngineUsage = usePixel<
        {
            type: 'pixel' | 'python' | 'java';
            label: string;
            code: string;
        }[]
    >(`GetEngineUsage(engine=["${id}"]);`);

    // set the state
    const [state, setState] = useState<StateStore>();
    useEffect(() => {
        // clear the state
        setState(null);

        // create a new insight
        runPixel<[]>(`true`, 'new')
            .then(async ({ errors, insightId }) => {
                if (errors.length) {
                    throw new Error(errors.join(''));
                }

                // create the state state
                const state: SerializedState = {
                    version: '',
                    queries: {
                        'engine-notebook': {
                            id: 'engine-notebook',
                            cells: [
                                {
                                    id: 'engine-cell',
                                    widget: 'code',
                                    parameters: {
                                        type: 'pixel',
                                        code: `Database(database=["${id}"]) | Query("<encode> your select query </encode>") | Collect(-1);`,
                                    },
                                },
                            ],
                        },
                    },
                    blocks: {},
                    variables: {},
                    dependencies: {},
                    executionOrder: [],
                };

                // create a new store
                const s = new StateStore({
                    mode: 'interactive',
                    insightId: insightId,
                    state: state,
                    cellRegistry: {
                        code: DefaultCells['code'],
                    },
                });

                setState(s);
            })
            .catch((e) => {
                notification.add({
                    color: 'error',
                    message: e.message,
                });
                console.error(e);
            });
    }, []);

    // update the notebook when the data comes back
    useEffect(() => {
        if (!state || getEngineUsage.status !== 'SUCCESS') {
            return null;
        }

        // get the pixel
        let pixel = '';
        for (const o of getEngineUsage.data) {
            if (o.type === 'pixel') {
                pixel = o.code;
            }
        }

        // update the notebook
        state.dispatch({
            message: ActionMessages.UPDATE_CELL,
            payload: {
                queryId: 'engine-notebook',
                cellId: 'engine-cell',
                path: `parameters.code`,
                value: pixel,
            },
        });
    }, [state, getEngineUsage.status]);

    // create the factory
    const factory = useMemo<
        React.ComponentProps<typeof WorkspaceRenderer>['factory']
    >(() => {
        return function _(node) {
            const component = node.getComponent();
            const config = node.getConfig();

            if (component === 'notebook-viewer') {
                return <NotebookViewerPanel id={config.id} />;
            }
        };
    }, []);

    /**
     * Copy text and add it to the clipboard
     * @param text - text to copy
     */
    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);

            notification.add({
                color: 'success',
                message: 'Successfully copied code',
            });
        } catch (e) {
            notification.add({
                color: 'error',
                message: 'Unable to copy code',
            });
        }
    };

    // show a loading screen when it is pending
    if (!state || getEngineUsage.status !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Loading Usage" />;
    }

    return (
        <div>
            <Section>
                <Blocks state={state}>
                    <StyledContainer>
                        <Workspace
                            name={`engine-usage--${id}`}
                            app={null}
                            options={DEFAULT_OPTIONS}
                            header={false}
                            drawer={false}
                        >
                            <WorkspaceRenderer factory={factory} />
                        </Workspace>
                    </StyledContainer>
                </Blocks>
            </Section>
            <Section>
                <Section.Header>
                    <Typography variant={'h6'}>Reference</Typography>
                </Section.Header>
                {getEngineUsage.data.length !== 0 ? (
                    <>
                        {Object.keys(getEngineUsage.data).map((key, idx) => {
                            const { code, label } = getEngineUsage.data[key];

                            if (!code) {
                                return null;
                            }

                            return (
                                <Stack key={idx} direction="column" spacing={1}>
                                    <Typography variant={'subtitle1'}>
                                        {label}
                                    </Typography>
                                    <StyledCodeBlock>
                                        <StyledCodeContent>
                                            {code}
                                        </StyledCodeContent>
                                        <Button
                                            size="medium"
                                            variant="outlined"
                                            color="secondary"
                                            startIcon={
                                                <ContentCopyOutlined
                                                    color={'inherit'}
                                                />
                                            }
                                            onClick={() => copy(code)}
                                        >
                                            Copy
                                        </Button>
                                    </StyledCodeBlock>
                                </Stack>
                            );
                        })}
                    </>
                ) : (
                    <Stack
                        p={4}
                        alignItems={'center'}
                        justifyContent={'center'}
                    >
                        <Typography variant="caption">No Details</Typography>
                    </Stack>
                )}
            </Section>
        </div>
    );
};
