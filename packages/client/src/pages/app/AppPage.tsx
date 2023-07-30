import { createElement } from 'react';
import { observer } from 'mobx-react-lite';
import { Navigate } from 'react-router-dom';

import { useRootStore } from '@/hooks';

import { CustomApp } from '@/components/app';

// all of the apps that can be loaded
const APPS = {
    [CustomApp.type]: CustomApp,
};

/**
 * Page to load a specific app
 */
export const AppPage = observer(() => {
    const { workspaceStore } = useRootStore();

    // if there is no app don't render
    if (!workspaceStore.selectedApp || !APPS[workspaceStore.selectedApp.type]) {
        return <Navigate to={`/`} replace />;
    }

    // return the app
    return createElement(APPS[workspaceStore.selectedApp.type], {
        key: workspaceStore.selectedApp.id,
        id: workspaceStore.selectedApp.id,
        env: workspaceStore.selectedApp.env,
    });
});
