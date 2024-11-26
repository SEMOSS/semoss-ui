import { createContext } from 'react';

import { WorkspaceApp, WorkspaceStore } from '@/stores';

/**
 * Value
 */
export type WorkspaceContextProps = {
    /** Widgets available to all of the blocks */
    workspace: WorkspaceStore;

    /** Connected app. If no null, no app is connected */
    app: WorkspaceApp | null;
};

/**
 * Context
 */
export const WorkspaceContext = createContext<
    WorkspaceContextProps | undefined
>(undefined);
