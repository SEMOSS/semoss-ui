import { useContext } from 'react';

import { WorkspaceContext, WorkspaceContextProps } from '@/contexts';
import { WorkspaceDef } from '@/types';

/**
 * Access the Workspace Context
 * @returns the Workspace Context
 */
export function useWorkspace<
    D extends WorkspaceDef = WorkspaceDef,
>(): WorkspaceContextProps<D> {
    const context = useContext(WorkspaceContext) as WorkspaceContextProps<D>;
    if (context === undefined) {
        throw new Error(
            'useWorkspace must be used within WorkspaceContext.Provider',
        );
    }

    return context;
}
