import React, { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { useNotification } from '@semoss/ui';
import {
    StateStore,
    Blocks,
    SerializedState,
    DefaultCells,
    DefaultBlocks,
    MigrationManager,
    STATE_VERSION,
} from '@semoss/renderer';

import { runPixel } from '@semoss/sdk/react';
import { WorkspaceStore, DesignerStore, WorkspaceOptions } from '@/stores';
import { DesignerContext } from '../../contexts';
import { LoadingScreen } from '../../components/ui';
import { BlocksWorkspaceDev } from './BlocksWorkspaceDev';
import { DEFAULT_MENU } from './menus/default-menu';
import { GraphPanel } from '../workspace/panels/GraphPanel';
import {
    Workspace,
    SettingsPanel,
    FileExplorerPanel,
    FileEditorPanel,
    TerminalPanel,
} from '../../components/workspace';
import {
    VariablesPanel,
    BlocksMenuPanel,
    LayersPanel,
    SelectedBlockPanel,
    DesignerPanel,
    NotebookExplorerPanel,
    NotebookViewerPanel,
} from './panels';
import { BlocksWorkspaceActions } from './BlocksWorkspaceActions';

const DEFAULT_BOTTOM_BORDER_SIZE = 300;
const DEFAULT_LEFT_BORDER_SIZE = 400;
const DEFAULT_RIGHT_BORDER_SIZE = 450;

const DEFAULT_OPTIONS: WorkspaceOptions = {
    version: '',
    layout: {
        global: { tabEnableClose: false },
        borders: [
            {
                type: 'border',
                location: 'left',
                size: DEFAULT_LEFT_BORDER_SIZE,
                minSize: DEFAULT_LEFT_BORDER_SIZE,
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
                        helpText: 'Files that are stored at app level',
                    },
                    {
                        type: 'tab',
                        name: 'Notebooks',
                        component: 'notebook-explorer',
                        config: {},
                        helpText: 'Notebooks associated with the app',
                    },
                ],
            },
            {
                type: 'border',
                location: 'right',
                size: DEFAULT_RIGHT_BORDER_SIZE,
                minSize: DEFAULT_RIGHT_BORDER_SIZE,
                children: [
                    {
                        type: 'tab',
                        name: 'Block Settings',
                        component: 'selected',
                        config: {},
                        helpText: 'Settings for UI component you have selected',
                        // icon: '@/assets/favicon.svg',
                    },
                ],
            },
            {
                type: 'border',
                location: 'bottom',
                size: DEFAULT_BOTTOM_BORDER_SIZE,
                minSize: DEFAULT_BOTTOM_BORDER_SIZE,
                children: [
                    {
                        id: 'settings',
                        type: 'tab',
                        name: 'Settings',
                        component: 'settings',
                        config: {},
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
                        // {
                        //     type: 'tab',
                        //     name: 'Dependency Graph',
                        //     component: 'graph',
                        //     config: {},
                        //     helpText: 'How your app is connected',
                        // },
                    ],
                },
            ],
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
    } else if (component === 'file-explorer') {
        return <FileExplorerPanel layout={layout} />;
    } else if (component === 'file-editor') {
        return <FileEditorPanel path={config.path} />;
    } else if (component === 'notebook-explorer') {
        return <NotebookExplorerPanel layout={layout} />;
    } else if (component === 'notebook-viewer') {
        return <NotebookViewerPanel id={config.id} />;
    } else if (component === 'terminal') {
        return <TerminalPanel />;
    } else if (component === 'graph') {
        return <GraphPanel />;
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

    //to throw a warning when the user tried to reload the page
    // this is to prevent the user from losing their work
    useEffect(() => {
        if (process.env.NODE_ENV !== 'development') {
            const handleBeforeUnload = (e: BeforeUnloadEvent) => {
                e.preventDefault();
                e.returnValue = '';
            };
            window.addEventListener('beforeunload', handleBeforeUnload);

            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            };
        }
    }, []);

    useEffect(() => {
        // start the loading screen
        workspace.setLoading(true);

        // load the app
        runPixel<[SerializedState]>(
            `GetAppBlocksJson ( project=["${workspace.appId}"]);`,
            workspace.insightId ? workspace.insightId : 'new',
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
                    navbarActions={<BlocksWorkspaceActions />}
                    options={DEFAULT_OPTIONS}
                    workspace={workspace}
                    factory={FACTORY}
                />
                <BlocksWorkspaceDev />
            </DesignerContext.Provider>
        </Blocks>
    );
});
