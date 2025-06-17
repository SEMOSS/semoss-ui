import { PageStoreInterface } from '@/stores';
import { usePage } from './usePage';
import { useEffect } from 'react';

interface usePageSetupProps {
    /**
     * Content to show in the topnav
     */
    topNav?: PageStoreInterface['topNav'];
}

/**
 * Access the Page Context
 * @returns the Page Context
 */
export function usePageSetup({ topNav = false }: usePageSetupProps) {
    const { page } = usePage();

    // set the topNav
    useEffect(() => {
        page.setTopNav(topNav);

        return () => {
            // reset when navigating away
            page.setTopNav();
        };
    }, [topNav]);
}
