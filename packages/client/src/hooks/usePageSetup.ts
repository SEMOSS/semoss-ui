import { PageStoreInterface } from '@/stores';
import { usePage } from './usePage';
import { useEffect } from 'react';

interface usePageSetupProps {
    /**
     * Content to show in the topnav
     */
    topNav?: PageStoreInterface['topNav'];

    /**
     * Content to show in the header
     */
    header?: PageStoreInterface['header'];
}

/**
 * Access the Page Context
 * @returns the Page Context
 */
export function usePageSetup({
    topNav = false,
    header = false,
}: usePageSetupProps) {
    const { page } = usePage();

    // set the topNav
    useEffect(() => {
        page.setTopNav(topNav);
    }, [topNav]);

    // set the header
    useEffect(() => {
        page.setHeader(header);
    }, [header]);
}
