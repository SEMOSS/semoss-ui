import { useContext } from 'react';

import { InsightContext } from './InsightProvider';

/**
 * Access the current insight
 */
export const useInsight = () => {
    const context = useContext(InsightContext);
    if (context === undefined) {
        throw new Error('useInsight must be used within InsightProvider');
    }

    return context;
};
