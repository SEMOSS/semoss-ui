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
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <g clipPath="url(#clip0_2378_103062)">
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M12 3C7.58 3 4 4.79 4 7V17C4 19.21 7.59 21 12 21C16.41 21 20 19.21 20 17V7C20 4.79 16.42 3 12 3ZM18 17C18 17.5 15.87 19 12 19C8.13 19 6 17.5 6 17V14.77C7.61 15.55 9.72 16 12 16C14.28 16 16.39 15.55 18 14.77V17ZM18 12.45C16.7 13.4 14.42 14 12 14C9.58 14 7.3 13.4 6 12.45V9.64C7.47 10.47 9.61 11 12 11C14.39 11 16.53 10.47 18 9.64V12.45ZM12 9C8.13 9 6 7.5 6 7C6 6.5 8.13 5 12 5C15.87 5 18 6.5 18 7C18 7.5 15.87 9 12 9Z"
                                    fill="#EBEEFE"
                                />
                            </g>
                            <defs>
                                <clipPath id="clip0_2378_103062">
                                    <rect width="24" height="24" fill="white" />
                                </clipPath>
                            </defs>
                        </svg>
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
