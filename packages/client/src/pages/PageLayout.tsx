import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Outlet } from 'react-router-dom';

import { ErrorBoundary } from '@/components/common';
import { ErrorPage } from './ErrorPage';
import { PageStore } from '@/stores';
import { PageContext } from '@/contexts';
import { Page } from '@/components/shared/Page';

/**
 * Wrap the routes with a side navigation
 */
export const PageLayout = observer(() => {
    const page = useMemo(() => {
        return new PageStore();
    }, []);

    if (!page) {
        return null;
    }

    return (
        <ErrorBoundary fallback={<ErrorPage />}>
            <PageContext.Provider
                value={{
                    page: page,
                }}
            >
                <Page>
                    <Outlet />
                </Page>
            </PageContext.Provider>
        </ErrorBoundary>
    );
});
