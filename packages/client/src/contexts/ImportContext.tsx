import { MonolithStore } from '@/stores';
import { createContext } from 'react';

interface ImportStep {
    /** Title of the step */
    title: string;

    /** Description of the step */
    description: string;

    /** Data associated with the step */
    data: any; // TODO Look through steps and type out each one should be just {} and "";

    /** Component to render in the step */
    component?: React.FunctionComponent;
}

/**
 * Value
 */
export type ImportContextType = {
    /**
     * Track if the import is loading
     */
    isLoading: boolean;

    /**
     * List of the current steps
     */
    steps: ImportStep[];

    /**
     * Active step index
     */
    activeStepIdx: number;

    /**
     * Active step info
     */
    activeStep: ImportStep | null;

    /**
     * Set the loading boolean
     *
     * isLoading - toggle the loading true or false
     */
    setIsLoading: (isLoading: boolean) => void;

    /**
     * Update the steps in the flow
     *
     * step - step to add
     * activeStepIdx - new active step
     */
    setSteps: (steps: ImportStep[], activeStepIdx: number) => void;

    /**
     * Update the steps in the flow
     *
     * activeStepIdx - new active step
     */
    setActiveStep: (index: number) => void;
};

/**
 * Context
 */
export const ImportContext = createContext<ImportContextType>(undefined);
