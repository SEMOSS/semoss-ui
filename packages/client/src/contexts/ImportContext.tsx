import { createContext } from 'react';

interface StepInterface {
    title: string;
    description: string;
    data: unknown;
}
/**
 * Value
 */
export type ImportContextType = {
    steps: StepInterface[];

    /** addStep in import flow */
    addStep: (stepInfo: unknown) => void;

    /** remove step in import flow */
    removeStep: (id: string) => void;

    /** navigates to step in workflow */
    switchStep: (index: number) => void;
};

/**
 * Context
 */
export const ImportContext = createContext<ImportContextType>(undefined);
