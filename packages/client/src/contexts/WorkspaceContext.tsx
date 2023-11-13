import { createContext } from 'react';

import { WorkspaceStore } from '@/stores';

/**
 * Value
 */
export type WorkspaceContextType = WorkspaceStore;

/**
 * Context
 */
export const WorkspaceContext = createContext<WorkspaceContextType>(undefined);
