import { observer } from 'mobx-react-lite';
import { Outlet, Link } from 'react-router-dom';
import { styled, Stack, Icon, Divider } from '@semoss/ui';

import {
    Settings,
    Inventory2Outlined,
    LibraryBooksOutlined,
    SmartToyOutlined,
} from '@mui/icons-material';

import { Navbar } from '@/components/ui';
import { Database } from '@/assets/img/Database';

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
    return (
        <>
            <Navbar />
            <StyledSidebar>
                <StyledSidebarItem to={''}>
                    <Icon>
                        <LibraryBooksOutlined />
                    </Icon>
                </StyledSidebarItem>
                <StyledSidebarDivider />
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
                        <SmartToyOutlined />
                    </Icon>
                </StyledSidebarItem>
                <Stack flex={1}>&nbsp;</Stack>
                <StyledSidebarItem to={'settings'}>
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
