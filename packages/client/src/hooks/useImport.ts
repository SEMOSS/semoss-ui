import { useContext } from 'react';

import { ImportContext, ImportContextType } from '@/contexts';

/**
 * Access the current Import Context
 * @returns the Import Context
 */
export function useImport(): ImportContextType {
    const context = useContext(ImportContext);
    if (context === undefined) {
        throw new Error(
            'useImport must be used within Import Context Provider',
        );
    }

    return context;
}
