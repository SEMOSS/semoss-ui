import { useContext } from 'react';

import { EngineContext, EngineContextType } from '@/contexts';

/**
 * Access the current Engine Context
 * @returns the Engine Context
 */
export function useDatabase(): EngineContextType {
    const context = useContext(EngineContext);
    if (context === undefined) {
        throw new Error(
            'useDatabase must be used within Engine Context Provider',
        );
    }

    return context;
}
