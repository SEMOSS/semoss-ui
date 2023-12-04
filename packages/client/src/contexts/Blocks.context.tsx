import { createContext } from 'react';
import { StateStore, Registry, NotebookStore } from '@/stores';

export interface BlocksContextProps {
    /** Widgets available to all of the blocks */
    registry: Registry;

    /** State to provide */
    state: StateStore;

    /** notebook helpers */
    notebook: NotebookStore;
}

/**
 * Insight Context
 */
export const BlocksContext = createContext<BlocksContextProps | undefined>(
    undefined,
);
