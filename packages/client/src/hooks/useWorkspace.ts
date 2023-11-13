import { useContext } from 'react';

import { WorkspaceContext, WorkspaceContextType } from '@/contexts';

/**
 * Access the Workspace Context
 * @returns the Workspace Context
 */
export function useWorkspace(): WorkspaceContextType {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error(
            'useWorkspace must be used within WorkspaceContext.Provider',
        );
    }

    return context;
}
