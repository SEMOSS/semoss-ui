import { createContext } from 'react';
import { ConductorStore } from '@/stores/conductor/conductor.store';

/**
 * Value
 */
export type ConductorContextType = {
    conductor: ConductorStore;
};

/**
 * Context
 */
export const ConductorContext = createContext<ConductorContextType>(undefined);
