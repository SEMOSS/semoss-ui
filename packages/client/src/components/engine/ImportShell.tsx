import React from 'react';
import { ImportContext, ImportContextType } from '@/contexts';

interface ImportShellProps {
    children: React.ReactNode;
}
export const ImportShell = (props: ImportShellProps) => {
    const { children } = props;

    const value: ImportContextType = {
        steps: [],
        addStep: () => console.log('add'),
        removeStep: () => console.log('remove'),
    };

    return (
        <ImportContext.Provider value={value}>
            {children}
        </ImportContext.Provider>
    );
};
