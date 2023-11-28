import { createContext } from 'react';

import { NotebookStore } from '@/stores';

/**
 * Value
 */
export type NotebookContextType = {
    /** Store holding notebook information */
    notebook: NotebookStore;
};

/**
 * Context
 */
export const NotebookContext = createContext<NotebookContextType>(undefined);
