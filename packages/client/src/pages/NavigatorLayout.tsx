import { createElement } from 'react';
import { observer } from 'mobx-react-lite';
import { Outlet, Link, useLocation, matchPath } from 'react-router-dom';
import {
    styled,
    Stack,
    Icon,
    Divider,
    Tooltip,
    Box,
    Container,
} from '@semoss/ui';
import {
    ArticleOutlined,
    LibraryBooksOutlined,
    Settings,
} from '@mui/icons-material';

import { Navbar, NavigationBar, SideNav } from '@/components/ui';
import { ErrorBoundary } from '@/components/common';
import { ENGINE_ROUTES } from '@/pages/engine';
import { ErrorPage } from './ErrorPage';
import { PlatformMessages } from './PlatformMessages';
import { useRootStore } from '@/hooks';
import { useEffect, useState } from 'react';

const StyledBox = styled(Box)(({ theme }) => ({
    background: '#FAFAFA',
    height: '40px !important',
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
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
}));

/**
 * Wrap the routes with a side navigation
 */
export const NavigatorLayout = observer(() => {
    const { pathname } = useLocation();
    const { configStore } = useRootStore();
    const [viewSidebar, setViewSidebar] = useState(false);
    const [showSideNav, setShowSideNav] = useState(false);

    // useEffect(() => {
    //     if (configStore.store.user.admin) {
    //         setViewSidebar(true);
    //     } else if (
    //         !configStore.store.user.admin &&
    //         !configStore.store.config.adminOnlyViewMenuBarFlag
    //     ) {
    //         setViewSidebar(true);
    //     }
    // }, [
    //     configStore.store.user.admin,
    //     configStore.store.config.adminOnlyViewMenuBarFlag,
    // ]);

    // let showSidebar = true;
    // if (configStore.store.user.admin) {
    //     // show the sidebar if the user is an admin
    //     showSidebar = true;
    // } else if (!configStore.store.config.adminOnlyViewMenuBarFlag) {
    //     // if the flag is false, show the sidebar
    //     showSidebar = true;
    // } else {
    //     showSidebar = false;
    // }

    return (
        <ErrorBoundary fallback={<ErrorPage />}>
            <StyledBox>
                <NavigationBar
                    onOpen={() => {
                        console.log('hello');
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
