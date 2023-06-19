import { useContext } from 'react';

import { RootStoreContext, RootStoreContextType } from '@/contexts';

/**
 * Access the current RootStore
 * @returns the RootStore
 */
export function useRootStore(): RootStoreContextType {
    const context = useContext(RootStoreContext);
    if (context === undefined) {
        throw new Error('useRootStore must be used within RootStoreProvider');
    }

    return context;
}
