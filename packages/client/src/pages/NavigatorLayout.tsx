import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Outlet } from 'react-router-dom';

import { styled, Box } from '@semoss/ui';

import { NavigationBar, SideNav } from '@/components/ui';
import { ErrorBoundary } from '@/components/common';
import { ErrorPage } from './ErrorPage';
import { PlatformMessages } from './PlatformMessages';

const StyledBox = styled(Box)(({ theme }) => ({
    background: '#FAFAFA',
    flexGrow: 1,
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    '& .MuiPaper-root > .MuiToolbar-root': {
        gap: '8px',
    },
}));

const StyledContent = styled('div')(() => ({
    // height: '100%',
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    border: 'solid blue',
    height: 'calc(100% - 56px)',
}));

/**
 * Wrap the routes with a side navigation
 */
export const NavigatorLayout = observer(() => {
    const [showSideNav, setShowSideNav] = useState(false);

    return (
        <ErrorBoundary fallback={<ErrorPage />}>
            <StyledBox>
                <NavigationBar
                    onOpen={() => {
                        setShowSideNav(true);
                    }}
                />
            </StyledBox>

            <SideNav
                isOpen={showSideNav}
                onClose={() => setShowSideNav(false)}
            />

            <StyledContent>
                <PlatformMessages platformAssist={true}>
                    <Outlet />
                </PlatformMessages>
            </StyledContent>
        </ErrorBoundary>
    );
});
