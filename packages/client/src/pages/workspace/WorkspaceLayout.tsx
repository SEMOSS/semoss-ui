import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Outlet } from 'react-router-dom';

import { WorkspaceContext } from '@/contexts';
import { WorkspaceStore } from '@/stores';

import { WorkspaceOverlay } from '@/components/workspace/';

export const WorkspaceLayout = observer(() => {
    // create a new instance of the store and provide it to the childen
    const store = useMemo(() => {
        return new WorkspaceStore();
    }, []);

    //TODO: Integrate Insight Provider
    return (
        <WorkspaceContext.Provider
            value={{
                workspace: store,
            }}
        >
            <WorkspaceOverlay />
            <Outlet />
        </WorkspaceContext.Provider>
    );
});
