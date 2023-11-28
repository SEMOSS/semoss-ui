import { observer } from 'mobx-react-lite';

import { useWorkspace } from '@/hooks';
import { AppRenderer } from '@/components/app';

import { CodeView } from './code-view';
import { BlocksView } from './blocks-view';
import { SettingsView } from './settings-view';
import { DataView } from './data-view';
/**
 * Render the content of the workspace
 */
export const WorkspaceRenderer = observer(() => {
    const { appId, isEditMode, view } = useWorkspace();

    if (!isEditMode) {
        return <AppRenderer appId={appId} />;
    }

    // TODO: Lazy load edit mode
    if (view === 'design') {
        //  TODO: load based on the project type (block or code)
        return <CodeView />;
    } else if (view === 'data') {
        return <DataView />;
    } else if (view === 'settings') {
        // TODO: Create this
        return <SettingsView />;
    }

    return <>Error</>;
});
