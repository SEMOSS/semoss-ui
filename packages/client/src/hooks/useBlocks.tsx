import { useContext } from 'react';

import { BlocksContext } from '@/contexts';

/**
 * Access the current InsightStore
 * @returns the InsightStore
 */
export const useBlocks = () => {
    const context = useContext(BlocksContext);
    if (context === undefined) {
        throw new Error('useBlocks must be used within Blocks');
    }

    return context;
};
