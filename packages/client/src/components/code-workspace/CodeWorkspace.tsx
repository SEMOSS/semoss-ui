import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';

import { WorkspaceStore } from '@/stores';

import { Workspace, SettingsPanel } from '@/components/workspace';

import { CodeWorkspaceActions } from './CodeWorkspaceActions';
import { CodePanel } from './panels';

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
                                enableTabStrip: false,
                                children: [
                                    {
                                        type: 'tab',
                                        name: 'Editor',
                                        component: 'code',
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
        ],
    },
};

const FACTORY: React.ComponentProps<typeof Workspace>['factory'] = (node) => {
    const component = node.getComponent();

    if (component === 'code') {
        return <CodePanel />;
    } else if (component === 'settings') {
        return <SettingsPanel />;
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
                endTopbar={<CodeWorkspaceActions />}
                factory={FACTORY}
            ></Workspace>
        </>
    );
});
