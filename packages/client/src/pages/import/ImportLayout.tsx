import { useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LoadingScreen } from '@/components/ui';

import { ImportContext, ImportContextType } from '@/contexts';
import { CONNECTION_OPTIONS } from './import.constants';

export const ImportLayout = () => {
    const [isLoading, setIsLoading] =
        useState<ImportContextType['isLoading']>(false);
    const [internalSteps, setInternalSteps] = useState<
        ImportContextType['steps']
    >([]);
    const [internalActiveStepIdx, setInternalActiveStepIdx] =
        useState<ImportContextType['activeStepIdx']>(-1);

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

    useEffect(() => {
        debugger;
        assignUniqueIds(CONNECTION_OPTIONS);
    }, []);

    function assignUniqueIds(obj, prefix = '') {
        if (Array.isArray(obj)) {
            // If it's an array, iterate through its elements
            for (let i = 0; i < obj.length; i++) {
                assignUniqueIds(obj[i], `${prefix}[${i}]`);
            }
        } else if (typeof obj === 'object' && obj !== null) {
            // If it's an object, iterate through its properties
            for (const key in obj) {
                // if (obj.hasOwnProperty(key)) {
                const currentPrefix = prefix ? `${prefix}.${key}` : key;

                // Assign unique ID to the 'name', 'disable', 'fields' properties
                if (key === 'name' || key === 'disable' || key === 'fields') {
                    obj[`id`] = `${currentPrefix}${obj['name']}`;
                }

                // Recursively traverse nested objects
                assignUniqueIds(obj[key], currentPrefix);
                // }
            }
        }
    }
    /**
     * Update the steps in the flow
     *
     * step - step to add
     * activeStepIdx - new step idx
     */
    const setSteps: ImportContextType['setSteps'] = (
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
    const setActiveStep: ImportContextType['setActiveStep'] = (
        updatedActiveStepIdx,
    ) => {
        setInternalActiveStepIdx(updatedActiveStepIdx);
    };

    // console.log(CONNECTION_OPTIONS);

    return (
        <ImportContext.Provider
            value={{
                isLoading: isLoading,
                steps: internalSteps,
                activeStepIdx: internalActiveStepIdx,
                activeStep: activeStep,
                setIsLoading: setIsLoading,
                setSteps: setSteps,
                setActiveStep: setActiveStep,
                CONNECTION_OPTIONS: CONNECTION_OPTIONS,
            }}
        >
            {isLoading && <LoadingScreen.Trigger />}
            <Outlet />
        </ImportContext.Provider>
    );
};
