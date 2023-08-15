import { createContext } from 'react';

/**
 * Value
 */
export type ImportContextType = {
    steps: any[];

    /** addStep in import flow */
    addStep: (id: string) => void;

    /** remove step in import flow */
    removeStep: (id: string) => void;
};

/**
 * Context
 */
export const ImportContext = createContext<ImportContextType>(undefined);
