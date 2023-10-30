import { useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LoadingScreen } from '@/components/ui';

import { StepperContext, StepperContextType } from '@/contexts';

export const ImportLayout = (props) => {
    const [isLoading, setIsLoading] =
        useState<StepperContextType['isLoading']>(false);
    const [internalSteps, setInternalSteps] = useState<
        StepperContextType['steps']
    >([]);
    const [internalActiveStepIdx, setInternalActiveStepIdx] =
        useState<StepperContextType['activeStepIdx']>(-1);

    /**
     * Get the active step
     */
    const activeStep = useMemo(() => {
        if (
            internalActiveStepIdx !== -1 &&
            internalSteps[internalActiveStepIdx]
        ) {
            return internalSteps[internalActiveStepIdx];
        }

        return null;
    }, [internalSteps, internalActiveStepIdx]);

    /**
     * Update the steps in the flow
     *
     * step - step to add
     * activeStepIdx - new step idx
     */
    const setSteps: StepperContextType['setSteps'] = (
        updatedSteps,
        updatedActiveStepIdx,
    ) => {
        // set the step
        setInternalSteps(updatedSteps);

        // navigate if open
        if (updatedActiveStepIdx) {
            setInternalActiveStepIdx(updatedActiveStepIdx);
        }
    };

    /**
     * Set the new active step
     *
     * activeStepIdx - new step idx
     */
    const setActiveStep: StepperContextType['setActiveStep'] = (
        updatedActiveStepIdx,
    ) => {
        setInternalActiveStepIdx(updatedActiveStepIdx);
    };

    return (
        <StepperContext.Provider
            value={{
                isLoading: isLoading,
                steps: internalSteps,
                activeStepIdx: internalActiveStepIdx,
                activeStep: activeStep,
                setIsLoading: setIsLoading,
                setSteps: setSteps,
                setActiveStep: setActiveStep,
            }}
        >
            {isLoading && <LoadingScreen.Trigger />}
            <Outlet />
        </StepperContext.Provider>
    );
};
