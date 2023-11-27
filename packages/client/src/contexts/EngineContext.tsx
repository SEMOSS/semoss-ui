import { createContext } from 'react';

import { Role, ENGINE_TYPES } from '@/types';

/**
 * Value
 */
export type EngineContextType = {
    /** Type of the engine */
    type: ENGINE_TYPES;

    /** ID of the engine to load */
    id: string;

    /** User's role associated with the engine */
    role: Role;

    /** refreshes meta vals for engine */
    refresh: () => void;

    /** Name of the engine */
    name: string;

    /** metavals to show on detail pages */
    metaVals: Record<string, unknown>;
};

/**
 * Context
 */
export const EngineContext = createContext<EngineContextType>(undefined);
