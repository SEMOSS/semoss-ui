import { useContext } from 'react';

import { RootStoreContext } from '@/contexts';

/**
 * Access the current RootStore
 * @returns the RootStore
 */
export const useRootStore = () => {
    const context = useContext(RootStoreContext);
    if (context === undefined) {
        throw new Error('useRootStore must be used within RootStoreProvider');
    }

    return context;
};
