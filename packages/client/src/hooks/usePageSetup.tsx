import { useContext } from 'react';

import { PageContext, PageContextType } from '@/contexts';

/**
 * Access the Page Context
 * @returns the Page Context
 */
export function usePageSetup(): PageContextType {
    const context = useContext(PageContext);
    if (context === undefined) {
        throw new Error('usePage must be used within PageContext.Provider');
    }

    return context;
}
