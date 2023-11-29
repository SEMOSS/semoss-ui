import { createContext } from 'react';

import { WorkspaceStore } from '@/stores';
import { WorkspaceDef } from '@/types';

/**
 * Value
 */
export type WorkspaceContextProps<D extends WorkspaceDef = WorkspaceDef> = {
    /** Widgets available to all of the blocks */
    workspace: WorkspaceStore<D>;
};

/**
 * Context
 */
export const WorkspaceContext = createContext<
    WorkspaceContextProps | undefined
>(undefined);
