import { createContext } from 'react';
import { InsightStore } from '@/stores';

export interface InsightContextType {
    /** Mode to render the widgets */
    registry: unknown;

    /** Insight Store to provide */
    insight: InsightStore;
}

/**
 * Insight Context
 */
export const InsightContext = createContext<InsightContextType | undefined>(
    undefined,
);
