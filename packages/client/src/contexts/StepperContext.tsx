import { createContext } from 'react';

export interface Step {
    /** Title of the step */
    title: string;

    /** Description of the step */
    description: string;

    /** Data associated with the step */
    data: object | any;

    /** ID For particular step */
    id?: string;
}

/**
 * Value
 */
export type StepperContextType = {
    /**
     * List of the current steps
     */
    steps: Step[];

    /**
     * Active step index
     */
    activeStepIdx: number;

    /**
     * Active step info
     */
    activeStep: Step | null;

    /**
     * Track if the import is loading
     */
    isLoading: boolean;

    /**
     * Update the steps in the flow
     *
     * step - step to add
     * activeStepIdx - new active step
     */
    setSteps: (steps: Step[], activeStepIdx: number) => void;

    /**
     * Update the steps in the flow
     *
     * activeStepIdx - new active step
     */
    setActiveStep: (index: number) => void;

    /**
     * Set the loading boolean
     *
     * isLoading - toggle the loading true or false
     */
    setIsLoading: (isLoading: boolean) => void;
};

/**
 * Context
 */
export const StepperContext = createContext<StepperContextType>(undefined);
