import { createContext } from 'react';
import { WorkspaceStore } from '@/stores';

export interface WorkspaceContextProps {
    /** Store holding workspace information */
    workspace: WorkspaceStore;
}

/**
 * Workspace Context
 */
export const WorkspaceContext = createContext<WorkspaceContextProps>(undefined);
