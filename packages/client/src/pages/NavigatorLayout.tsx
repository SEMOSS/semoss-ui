import { observer } from 'mobx-react-lite';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { styled, Stack, Icon, Divider } from '@semoss/ui';

import {
    Settings,
    Inventory2Outlined,
    LibraryBooksOutlined,
} from '@mui/icons-material';

import { Navbar } from '@/components/ui';
import { Database } from '@/assets/img/Database';
import { ModelBrain } from '@/assets/img/ModelBrain';

const NAV_HEIGHT = '48px';
const SIDEBAR_WIDTH = '56px';
const SIDEBAR_DIVIDER_WIDTH = '16px';

// background: var(--light-text-primary, rgba(0, 0, 0, 0.87));

const StyledSidebar = styled('nav')(({ theme }) => ({
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
    top: NAV_HEIGHT,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    overflow: 'hidden',
    color: 'rgba(235, 238, 254, 1)',
    backgroundColor: theme.palette.common.black,
    zIndex: 10,
}));

const StyledSidebarItem = styled(Link, {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{
    /** Track if item is selected */
    selected: boolean;
}>(({ theme, selected }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'inherit',
    textDecoration: 'none',
    height: NAV_HEIGHT,
    width: SIDEBAR_WIDTH,
    cursor: 'pointer',
    backgroundColor: selected
        ? theme.palette.primary.main
        : theme.palette.common.black,
    transition: 'backgroundColor 2s ease',
    '&:hover': {
        backgroundColor: selected
            ? theme.palette.primary.main
            : `${theme.palette.primary.dark}4D`,
        transition: 'backgroundColor 2s ease',
    },
}));

const StyledSidebarDivider = styled(Divider)(() => ({
    backgroundColor: 'rgba(235, 238, 254, 1)',
    width: SIDEBAR_DIVIDER_WIDTH,
}));

const StyledContent = styled('div')(() => ({
    position: 'absolute',
    paddingTop: NAV_HEIGHT,
    paddingLeft: SIDEBAR_WIDTH,
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

/**
 * Wrap the routes with a side navigation
 */
export const NavigatorLayout = observer(() => {
    const location = useLocation();

    return (
        <>
            <Navbar />
            <StyledSidebar>
                <StyledSidebarItem to={''} selected={location.pathname === '/'}>
                    <Icon>
                        <LibraryBooksOutlined />
                    </Icon>
                </StyledSidebarItem>
                <StyledSidebarDivider />
                <StyledSidebarItem
                    to={'catalog?type=database'}
                    selected={location.search.includes('?type=database')}
                >
                    <Icon>
                        <Database />
                    </Icon>
                </StyledSidebarItem>
                <StyledSidebarItem
                    to={'catalog?type=storage'}
                    selected={location.search.includes('?type=storage')}
                >
                    <Icon>
                        <Inventory2Outlined />
                    </Icon>
                </StyledSidebarItem>
                <StyledSidebarItem
                    to={'catalog?type=model'}
                    selected={location.search.includes('?type=model')}
                >
                    <Icon>
                        <ModelBrain />
                    </Icon>
                </StyledSidebarItem>
                <Stack flex={1}>&nbsp;</Stack>
                <StyledSidebarItem
                    to={'settings'}
                    selected={location.pathname === '/settings'}
                >
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
