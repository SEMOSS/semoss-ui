import { observer } from 'mobx-react-lite';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { styled, Stack, Icon } from '@semoss/ui';

import { useRootStore } from '@/hooks/';
import {
    AccountCircle,
    Settings,
    Inventory2Outlined,
    MenuBookOutlined,
} from '@mui/icons-material';
import { Database } from '@/assets/img/Database';

const NAV_HEIGHT = '48px';
const SIDEBAR_WIDTH = '56px';

// background: var(--light-text-primary, rgba(0, 0, 0, 0.87));

const StyledHeader = styled('div')(({ theme }) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: NAV_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    color: 'rgba(235, 238, 254, 1)',
    backgroundColor: theme.palette.common.black,
}));

const StyledHeaderLogo = styled(Link)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    color: 'inherit',
    textDecoration: 'none',
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    cursor: 'pointer',
    backgroundColor: theme.palette.common.black,
    '&:hover': {
        backgroundColor: `rgba(255, 255, 255, ${theme.palette.action.hoverOpacity})`,
    },
}));

const StyledHeaderLogout = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'inherit',
    textDecoration: 'none',
    height: NAV_HEIGHT,
    width: SIDEBAR_WIDTH,
    cursor: 'pointer',
    backgroundColor: theme.palette.common.black,
    '&:hover': {
        backgroundColor: `rgba(255, 255, 255, ${theme.palette.action.hoverOpacity})`,
    },
}));

const StyledSidebar = styled('nav')(({ theme }) => ({
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    top: NAV_HEIGHT,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    overflow: 'hidden',
    color: 'rgba(235, 238, 254, 1)',
    backgroundColor: theme.palette.common.black,
}));

const StyledSidebarItem = styled(Link)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'inherit',
    textDecoration: 'none',
    height: NAV_HEIGHT,
    width: SIDEBAR_WIDTH,
    cursor: 'pointer',
    backgroundColor: theme.palette.common.black,
    '&:hover': {
        backgroundColor: `rgba(255, 255, 255, ${theme.palette.action.hoverOpacity})`,
    },
}));

const StyledContent = styled('div')(({ theme }) => ({
    paddingTop: NAV_HEIGHT,
    paddingLeft: SIDEBAR_WIDTH,
    height: '100%',
    width: '100%',
}));

/**
 * Wrap the database routes and add additional funcitonality
 */
export const AuthenticatedLayout = observer(() => {
    const { configStore } = useRootStore();
    const location = useLocation();

    // wait till the config is authenticated to load the view
    if (configStore.store.status === 'MISSING AUTHENTICATION') {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return (
        <>
            <StyledHeader>
                <StyledHeaderLogo to={''}>Logo</StyledHeaderLogo>
                <Stack flex={1}>&nbsp;</Stack>
                <StyledHeaderLogout>
                    <Icon>
                        <AccountCircle />
                    </Icon>
                </StyledHeaderLogout>
            </StyledHeader>
            <StyledSidebar>
                <StyledSidebarItem to={'catalog?type=database'}>
                    <Icon>
                        <Database />
                    </Icon>
                </StyledSidebarItem>
                <StyledSidebarItem to={'catalog?type=storage'}>
                    <Icon>
                        <Inventory2Outlined />
                    </Icon>
                </StyledSidebarItem>
                <StyledSidebarItem to={'catalog?type=model'}>
                    <Icon>
                        <MenuBookOutlined />
                    </Icon>
                </StyledSidebarItem>
                <Stack flex={1}>&nbsp;</Stack>
                <StyledSidebarItem to={'a'}>
                    <Icon>
                        <Settings />
                    </Icon>
                </StyledSidebarItem>
            </StyledSidebar>
            <StyledContent>
                <Outlet />
            </StyledContent>
        </>
    );
});
