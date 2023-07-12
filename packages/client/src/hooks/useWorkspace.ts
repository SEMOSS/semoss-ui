import { useContext } from 'react';

import { WorkspaceContext } from '@/contexts';

/**
 * Access the current WorkspaceStore
 * @returns the WorkspaceStore
 */
export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error('useWorkspace must be used within Workspace');
    }

    return context;
};
