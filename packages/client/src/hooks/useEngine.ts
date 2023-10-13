import { useContext } from 'react';

import { EngineContext, EngineContextType } from '@/contexts';

/**
 * Access the current Engine Context
 * @returns the Engine Context
 */
export function useEngine(): EngineContextType {
    const context = useContext(EngineContext);
    if (context === undefined) {
        throw new Error('useEngine must be used within EngineContext Provider');
    }

    return context;
}
