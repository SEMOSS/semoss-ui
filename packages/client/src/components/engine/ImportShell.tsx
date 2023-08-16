import { useState } from 'react';
import { ImportContext, ImportContextType } from '@/contexts';

interface ImportShellProps {
    children: React.ReactNode;
}
export const ImportShell = (props: ImportShellProps) => {
    const { children } = props;

    const [steps, setSteps] = useState([]);

    const addStep = (stepInfo) => {
        setSteps([
            ...steps,
            {
                id: Date.now(), // find better way to make unique id
                title: stepInfo.title,
                description: stepInfo.description,
                data: stepInfo.data,
            },
        ]);
    };

    /**
     * @name switchStep
     * @param index
     * @desc allows navigation to a prior step
     */
    const switchStep = (index: number) => {
        const newSteps = [];

        for (let i = 0; i < index; i++) {
            newSteps.push(steps[i]);
        }

        setSteps(newSteps);
    };

    /**
     * @desc removes step from list based on stepId
     */
    const removeStep = (stepId) => {
        setSteps([]);
    };

    const value: ImportContextType = {
        steps: steps,
        addStep: addStep,
        removeStep: () => console.log('remove'),
        switchStep: switchStep,
    };

    return (
        <ImportContext.Provider value={value}>
            {children}
        </ImportContext.Provider>
    );
};
