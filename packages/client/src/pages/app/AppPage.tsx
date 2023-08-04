import { createElement } from 'react';
import { observer } from 'mobx-react-lite';
import { Navigate } from 'react-router-dom';

import { useRootStore } from '@/hooks';
import { AppRenderer } from '@/components/app';

/**
 * Page to load a specific app
 */
export const AppPage = observer(() => {
    const { workspaceStore } = useRootStore();

    // if there is no app don't render
    if (!workspaceStore.selectedApp) {
        return <Navigate to={`/`} replace />;
    }

    // return the app
    return (
        <AppRenderer
            id={workspaceStore.selectedApp.id}
            url={workspaceStore.selectedApp.url}
        ></AppRenderer>
    );
});
