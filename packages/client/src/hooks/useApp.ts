import { useContext } from 'react';

import { AppContext, AppContextType } from '@/contexts';

/**
 * Access the App Context
 * @returns the App Context
 */
export function useApp(): AppContextType {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within App Context Provider');
    }

    return context;
}
