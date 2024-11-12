import { useContext } from 'react';

import { AppContext, AppContextType } from '@/contexts';

/**
 * TODO: Create what information app info to store in App Context
 * that hook can return.
 *
 * Access the current App Context
 * @returns the App Context
 */
export function useApp(): AppContextType {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within AppContext Provider');
    }

    return context;
}
