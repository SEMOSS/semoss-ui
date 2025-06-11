import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Outlet } from 'react-router-dom';

import { styled, Box, Stack } from '@semoss/ui';

import { NavigationBar, SideNav } from '@/components/ui';
import { ErrorBoundary } from '@/components/common';
import { ErrorPage } from './ErrorPage';
import { PlatformMessages } from './PlatformMessages';
import { useCacheState } from '@/hooks';

const StyledMain = styled('div')(() => ({
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
}));

const StyledContent = styled(Stack)(() => ({
    position: 'relative',
    flex: '1',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

const StyledInner = styled('div')(({ theme }) => ({
    flex: '1',
    height: '100%',
    width: '100%',
    background: '#FAFAFA',
    overflowX: 'hidden',
    overflowY: 'auto',
}));

/**
 * Wrap the routes with a side navigation
 */
export const NavigatorLayout = observer(() => {
    const [isSideNavOpen, setIsSideNavOpen] = useState(false);
    const [isSideNavPinned, setIsSideNavPinned] = useCacheState(
        false,
        `sidenav--isPinned--DEV`,
    );

    return (
        <ErrorBoundary fallback={<ErrorPage />}>
            <StyledMain>
                <SideNav
                    isOpen={isSideNavOpen}
                    isPinned={isSideNavPinned}
                    onUpdate={(isOpen, isPinned) => {
                        console.log(isOpen, isPinned);
                        setIsSideNavOpen(isOpen);
                        setIsSideNavPinned(isPinned);
                    }}
                />

                <StyledContent direction={'column'}>
                    <NavigationBar
                        isPinned={isSideNavPinned}
                        onOpen={() => {
                            setIsSideNavOpen(true);
                        }}
                    />
                    <StyledInner>
                        <PlatformMessages platformAssist={true}>
                            <Outlet />
                        </PlatformMessages>
                    </StyledInner>
                </StyledContent>
            </StyledMain>
        </ErrorBoundary>
    );
});
