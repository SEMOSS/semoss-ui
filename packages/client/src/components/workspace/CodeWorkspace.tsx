import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { styled } from '@semoss/ui';

import { WorkspaceApp, WorkspaceOptions } from '@/stores';

import {
    AppSettingsPanel,
    FileExplorerPanel,
    FileEditorPanel,
    RendererPanel,
} from '@/components/panels';

import { Workspace } from './Workspace';
import { CodeWorkspaceActions } from './CodeWorkspaceActions';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceDrawer } from './WorkspaceDrawer';
import { WorkspaceReset } from './WorkspaceReset';
import { WorkspaceRenderer } from './WorkspaceRenderer';

const StyledContainer = styled('div')(() => ({
    height: '100vh',
    width: '100vw',
}));

const DEFAULT_OPTIONS: WorkspaceOptions = {
    version: '',
    drawer: {
        isOpen: false,
    },
    layout: {
        selected: 'code',
        available: {
            code: {
                id: 'code',
                name: 'Code',
                data: {
                    global: {
                        tabEnableClose: false,
                        tabEnableRename: false,
                    },
                    borders: [
                        {
                            type: 'border',
                            location: 'left',
                            selected: 0,
                            size: 400,
                            children: [
                                {
                                    id: 'file-explorer',
                                    type: 'tab',
                                    name: 'Files',
                                    component: 'file-explorer',
                                    enableClose: false,
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
                                weight: 50,
                                selected: 0,
                                enableTabStrip: true,
                                children: [
                                    {
                                        id: 'render',
                                        type: 'tab',
                                        name: 'App',
                                        component: 'renderer',
                                        config: {},
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

interface CodeWorkspaceProps {
    /** App to render */
    app: WorkspaceApp;
}

/**
 * Render the code workspace
 */
export const CodeWorkspace = observer((props: CodeWorkspaceProps) => {
    const { app } = props;

    // create the factory
    const factory = useMemo<
        React.ComponentProps<typeof WorkspaceRenderer>['factory']
    >(() => {
        return function _(node, layout) {
            const component = node.getComponent();
            const config = node.getConfig();

            if (component === 'file-explorer') {
                return (
                    <FileExplorerPanel
                        node={node}
                        layout={layout}
                        type={'APP'}
                        space={app.appId}
                    />
                );
            } else if (component === 'file-editor') {
                return (
                    <FileEditorPanel
                        node={node}
                        type={'APP'}
                        space={app.appId}
                        path={config.path}
                    />
                );
            } else if (component === 'renderer') {
                return <RendererPanel appId={app.appId} />;
            } else if (component === 'settings') {
                return <AppSettingsPanel />;
            }

            return <>{component}</>;
        };
    }, [app]);

    return (
        <StyledContainer>
            <Workspace
                name={`code--${app.appId}`}
                app={app}
                options={DEFAULT_OPTIONS}
                header={<WorkspaceHeader end={<CodeWorkspaceActions />} />}
                drawer={<WorkspaceDrawer />}
            >
                <WorkspaceRenderer factory={factory} />
                <WorkspaceReset />
            </Workspace>
        </StyledContainer>
    );
});
