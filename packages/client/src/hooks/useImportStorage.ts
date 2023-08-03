import { useContext } from 'react';

import { ImportStorageContext, ImportStorageContextType } from '@/contexts';

/**
 * Access the the selected storage to import
 * @returns the Import Storage Context
 */
export function useImportStorage(): ImportStorageContextType {
    const context = useContext(ImportStorageContext);
    if (context === undefined) {
        throw new Error(
            'useImportStorage must be used within Import Storage Context Provider',
        );
    }

    return context;
}
