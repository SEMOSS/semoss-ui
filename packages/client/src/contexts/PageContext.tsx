import { createContext } from 'react';

import { PageStore } from '@/stores';

/**
 * Value
 */
export type PageContextType = {
    /** Page store*/
    page: PageStore;
};

/**
 * Context
 */
export const PageContext = createContext<PageContextType | undefined>(
    undefined,
);
