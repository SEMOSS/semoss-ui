import { createContext } from 'react';
import { StateStore, Registry } from '@/stores';

export interface BlocksContextProps {
    /** Widgets available to all of the blocks */
    registry: Registry;

    /** Store to provide */
    state: StateStore;
}

/**
 * Insight Context
 */
export const BlocksContext = createContext<BlocksContextProps | undefined>(
    undefined,
);
