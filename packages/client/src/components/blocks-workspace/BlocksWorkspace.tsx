import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ConstructionOutlined } from '@mui/icons-material';
import { useNotification, styled, Typography, Stack } from '@semoss/ui';
import { runPixel } from '@/api';
import {
    SerializedState,
    StateStore,
    WorkspaceStore,
    MigrationManager,
    STATE_VERSION,
    DesignerStore,
    WorkspaceOptions,
} from '@/stores';
import { DesignerContext } from '@/contexts';
import { DefaultCells } from '@/components/cell-defaults';
import { DefaultBlocks } from '@/components/block-defaults';
import { Blocks } from '@/components/blocks';
import {
    Workspace,
    SettingsPanel,
    FileExplorerPanel,
    FileEditorPanel,
} from '@/components/workspace';
import { LoadingScreen } from '@/components/ui';
import { DEFAULT_MENU, VISUALIZATION_MENU } from '@/components/designer';
import { BlocksWorkspaceActions } from './BlocksWorkspaceActions';
import {
    VariablesPanel,
    BlocksMenuPanel,
    LayersPanel,
    SelectedBlockPanel,
    DesignerPanel,
    NotebookExplorerPanel,
    NotebookViewerPanel,
} from './panels';
import { BlocksWorkspaceDev } from './BlocksWorkspaceDev';

const DEFAULT_BORDER_SIZE = 300;

const StyledAlert = styled('div')(({ theme }) => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    height: theme.spacing(4),
    borderRadius: '4px',
    background: 'rgba(253, 237, 225, 1)',
}));

const DEFAULT_OPTIONS: WorkspaceOptions = {
    version: '',
    drawer: {
        isOpen: false,
    },
    layout: {
        selected: 'ui',
        available: {
            ui: {
                id: 'ui',
                name: 'UI',
                data: {
                    global: { tabEnableClose: false },
                    borders: [
                        {
                            type: 'border',
                            location: 'left',
                            selected: 0,
                            size: DEFAULT_BORDER_SIZE,
                            children: [
                                {
                                    type: 'tab',
                                    name: 'Blocks',
                                    component: 'blocks',
                                    config: {},
                                    enableDrag: false,
                                    helpText:
                                        'UI components that can be used to display for your app',
                                },
                                {
                                    type: 'tab',
                                    name: 'Visualizations',
                                    component: 'viz',
                                    config: {},
                                    enableDrag: false,
                                    helpText:
                                        'Visualizations to be used within the designer',
                                },
                                {
                                    type: 'tab',
                                    name: 'Layers',
                                    component: 'layers',
                                    config: {},
                                    enableDrag: false,
                                    helpText:
                                        'Hierarchy for UI elements within the designer',
                                },
                                {
                                    type: 'tab',
                                    name: 'Variables',
                                    component: 'variables',
                                    config: {},
                                    enableDrag: false,
                                    helpText:
                                        'Parameters that are used within blocks and notebooks',
                                },
                            ],
                        },
                        {
                            type: 'border',
                            location: 'right',
                            size: DEFAULT_BORDER_SIZE,
                            children: [
                                {
                                    type: 'tab',
                                    name: 'Block Settings',
                                    component: 'selected',
                                    config: {},
                                    enableDrag: false,
                                    helpText:
                                        'Settings for UI component you have selected',
                                    // icon: '@/assets/favicon.svg',
                                },
                            ],
                        },
                    ],
                    layout: {
                        type: 'row',
                        weight: 100,
                        children: [
                            {
                                type: 'tabset',
                                weight: 100,
                                selected: 0,
                                children: [
                                    {
                                        type: 'tab',
                                        name: 'page-1',
                                        component: 'designer',
                                        config: {
                                            id: 'page-1',
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                },
            },
            'data-science': {
                id: 'data-science',
                name: 'Data',
                data: {
                    global: { tabEnableClose: false },
                    borders: [
                        {
                            type: 'border',
                            location: 'left',
                            selected: 0,
                            size: DEFAULT_BORDER_SIZE,
                            children: [
                                {
                                    type: 'tab',
                                    name: 'Notebooks',
                                    component: 'notebook-explorer',
                                    config: {},
                                    enableDrag: false,
                                    helpText:
                                        'Notebooks associated with the app',
                                },
                                {
                                    type: 'tab',
                                    name: 'Variables',
                                    component: 'variables',
                                    config: {},
                                },
                                {
                                    type: 'tab',
                                    name: 'Files',
                                    component: 'file-explorer',
                                    config: {},
                                    enableDrag: false,
                                    helpText:
                                        'Files that are stored at app level',
                                },
                            ],
                        },
                    ],
                    layout: {
                        type: 'row',
                        weight: 100,
                        children: [],
                    },
                },
            },
            dev: {
                id: 'dev',
                name: 'Dev',
                data: {
                    global: { tabEnableClose: false },
                    borders: [
                        {
                            type: 'border',
                            location: 'left',
                            size: DEFAULT_BORDER_SIZE,
                            children: [
                                {
                                    type: 'tab',
                                    name: 'Blocks',
                                    component: 'blocks',
                                    config: {},
                                    helpText:
                                        'UI components that can be used to display for your app',
                                },
                                {
                                    type: 'tab',
                                    name: 'Visualizations',
                                    component: 'viz',
                                    config: {},
                                    helpText:
                                        'Visualizations to be used within the designer',
                                },
                                {
                                    type: 'tab',
                                    name: 'Layers',
                                    component: 'layers',
                                    config: {},
                                    helpText:
                                        'Hierarchy for UI elements within the designer',
                                },
                                {
                                    type: 'tab',
                                    name: 'Variables',
                                    component: 'variables',
                                    config: {},
                                    helpText:
                                        'Parameters that are used within blocks and notebooks',
                                },
                                {
                                    type: 'tab',
                                    name: 'Files',
                                    component: 'file-explorer',
                                    config: {},
                                    helpText:
                                        'Files that are stored at app level',
                                },
                                {
                                    type: 'tab',
                                    name: 'Notebooks',
                                    component: 'notebook-explorer',
                                    config: {},
                                    helpText:
                                        'Notebooks associated with the app',
                                },
                                {
                                    type: 'tab',
                                    name: 'Block Settings',
                                    component: 'selected',
                                    config: {},
                                    helpText:
                                        'Settings for UI component you have selected',
                                    // icon: '@/assets/favicon.svg',
                                },
                            ],
                        },
                    ],
                    layout: {
                        type: 'row',
                        weight: 100,
                        children: [
                            {
                                type: 'tabset',
                                weight: 100,
                                selected: 0,
                                children: [
                                    {
                                        type: 'tab',
                                        name: 'page-1',
                                        component: 'designer',
                                        config: {
                                            id: 'page-1',
                                        },
                                        enableClose: true,
                                    },
                                ],
                            },
                        ],
                    },
                },
            },
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
                                enableTabStrip: false,
                                children: [
                                    {
                                        type: 'tab',
                                        name: 'Settings',
                                        component: 'settings',
                                        config: {},
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

const FACTORY: React.ComponentProps<typeof Workspace>['factory'] = (
    node,
    layout,
) => {
    const component = node.getComponent();
    const config = node.getConfig();

    if (component === 'designer') {
        return <DesignerPanel id={config.id} />;
    } else if (component === 'variables') {
        return <VariablesPanel />;
    } else if (component === 'settings') {
        return <SettingsPanel />;
    } else if (component === 'layers') {
        return <LayersPanel />;
    } else if (component === 'selected') {
        return <SelectedBlockPanel />;
    } else if (component === 'blocks') {
        return <BlocksMenuPanel title={'Add Blocks'} items={DEFAULT_MENU} />;
    } else if (component === 'viz') {
        return (
            <BlocksMenuPanel
                title={'Add Visualization'}
                items={VISUALIZATION_MENU}
            />
        );
    } else if (component === 'file-explorer') {
        return <FileExplorerPanel layout={layout} />;
    } else if (component === 'file-editor') {
        return <FileEditorPanel path={config.path} />;
    } else if (component === 'notebook-explorer') {
        return <NotebookExplorerPanel layout={layout} />;
    } else if (component === 'notebook-viewer') {
        return <NotebookViewerPanel id={config.id} />;
    }

    return <>{component}</>;
};

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

    /**
     * Have the designer control the blocks
     */
    const designer = useMemo(() => {
        // return the store
        if (state) {
            return new DesignerStore(state, {
                rendered: ACTIVE,
            });
        }
    }, [state]);

    if (!state) {
        return <LoadingScreen.Trigger />;
    }

    return (
        <Blocks state={state} registry={DefaultBlocks}>
            <DesignerContext.Provider
                value={{
                    designer: designer,
                }}
            >
                <Workspace
                    options={DEFAULT_OPTIONS}
                    workspace={workspace}
                    endTopbar={<BlocksWorkspaceActions />}
                    alert={
                        <StyledAlert>
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
                        </StyledAlert>
                    }
                    factory={FACTORY}
                />
                <BlocksWorkspaceDev />
            </DesignerContext.Provider>
        </Blocks>
    );
});
