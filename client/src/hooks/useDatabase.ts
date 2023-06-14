import { useContext } from 'react';

import { DatabaseContext, DatabaseContextType } from '@/contexts';

/**
 * Access the current Database Context
 * @returns the Database Context
 */
export function useDatabase(): DatabaseContextType {
    const context = useContext(DatabaseContext);
    if (context === undefined) {
        throw new Error('useDatabase must be used within DatabaseProvider');
    }

    return context;
}
