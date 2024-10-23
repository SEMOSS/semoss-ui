import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';

import { WorkspaceStore } from '@/stores';

import { Workspace, SettingsView } from '@/components/workspace';

import { CodeWorkspaceActions } from './CodeWorkspaceActions';
import { CodeEditor } from './CodeEditor';
import { CodeWorkspaceTabs } from './CodeWorkspaceTabs';

const CONFIG: Parameters<WorkspaceStore['configure']>[0] = {
    layout: {
        selected: 'code',
        available: [
            {
                id: 'code',
                name: 'Code',
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
                                        name: 'Editor',
                                        component: 'editor',
                                        config: {},
                                    },
                                ],
                            },
                        ],
                    },
                },
            },
            {
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
                                        name: 'Editor',
                                        component: 'editor',
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

const FACTORY: React.ComponentProps<typeof Workspace>['factory'] = (node) => {
    const component = node.getComponent();

    if (component === 'editor') {
        return <CodeEditor />;
    } else if (component === 'settings') {
        return <SettingsView />;
    }

    return <>{component}</>;
};

interface CodeWorkspaceProps {
    /** Workspace to render */
    workspace: WorkspaceStore;
}

/**
 * Render the code workspace
 */
export const CodeWorkspace = observer((props: CodeWorkspaceProps) => {
    const { workspace } = props;

    useEffect(() => {
        // set the initial settings
        workspace.configure({
            ...CONFIG,
        });
    }, []);

    return (
        <>
            <Workspace
                workspace={workspace}
                startTopbar={<CodeWorkspaceTabs />}
                endTopbar={<CodeWorkspaceActions />}
                factory={FACTORY}
            ></Workspace>
        </>
    );
});
