import { createContext } from 'react';

import { Role } from '@/types';

/**
 * Value
 */
export type EngineContextType = {
    /** Engine Type */
    type: 'database' | 'model' | 'storage';

    /** ID of the engine to load */
    id: string;

    /** User's role associated with the engine */
    role: Role;

    /** refreshes meta vals for engine */
    refresh: () => void;

    /** metavals to show on detail pages */
    metaVals: any;
};

/**
 * Context
 */
export const EngineContext = createContext<EngineContextType>(undefined);
