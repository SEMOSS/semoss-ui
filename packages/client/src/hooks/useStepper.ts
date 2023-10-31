import { useContext } from 'react';

import { StepperContext, StepperContextType } from '@/contexts';

/**
 * Access the current Stepper Context
 * @returns the Stepper Context
 */
export function useStepper(): StepperContextType {
    const context = useContext(StepperContext);
    if (context === undefined) {
        throw new Error(
            'useStepper must be used within Stepper Context Provider',
        );
    }

    return context;
}
