import { useContext } from 'react';

import { CanvasContext } from '@/contexts';

/**
 * Access the current InsightStore
 * @returns the InsightStore
 */
export const useCanvas = () => {
    const context = useContext(CanvasContext);
    if (context === undefined) {
        throw new Error('useInsight must be used within Canvas');
    }

    return context;
};
