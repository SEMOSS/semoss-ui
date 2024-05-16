import { createElement } from 'react';
import { observer } from 'mobx-react-lite';
import { Outlet, Link, useLocation, matchPath } from 'react-router-dom';
import { styled, Stack, Icon, Divider, Tooltip } from '@semoss/ui';
import { LibraryBooksOutlined, Settings } from '@mui/icons-material';
import { ErrorBoundary } from 'react-error-boundary';

import { Navbar } from '@/components/ui';

import { ENGINE_ROUTES } from '@/pages/engine';
import { ErrorPage } from './ErrorPage';

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
    const { pathname } = useLocation();

    return (
        <ErrorBoundary fallback={<ErrorPage />}>
            <Navbar />
            <StyledSidebar>
                <Tooltip title={`Open App Library`} placement="right">
                    <StyledSidebarItem
                        data-tour="nav-app-library"
                        to={'/'}
                        selected={!!matchPath('', pathname)}
                        aria-label={'Navigate to app library'}
                    >
                        <Icon>
                            <LibraryBooksOutlined />
                        </Icon>
                    </StyledSidebarItem>
                </Tooltip>
                <StyledSidebarDivider />
                {ENGINE_ROUTES.map((r) => (
                    <Tooltip
                        title={`Open ${r.name}`}
                        key={r.path}
                        placement="right"
                    >
                        <StyledSidebarItem
                            data-testid={`${r.name}-icon`}
                            // id={`${r.name}-icon`}
                            data-tour={`nav-engine-${r.path}`}
                            to={`/engine/${r.path}`}
                            selected={
                                !!matchPath(`engine/${r.path}/*`, pathname)
                            }
                            aria-label={`Navigate to ${r.name}`}
                        >
                            <Icon>{createElement(r.icon, {})}</Icon>
                        </StyledSidebarItem>
                    </Tooltip>
                ))}
                <Stack flex={1}>&nbsp;</Stack>
                <Tooltip title={`Open Settings`} placement="right">
                    <StyledSidebarItem
                        to={'/settings'}
                        selected={!!matchPath('settings/*', pathname)}
                        aria-label={'Navigate to settings'}
                    >
                        <Icon>
                            <Settings data-testid="Settings-icon" />
                        </Icon>
                    </StyledSidebarItem>
                </Tooltip>
            </StyledSidebar>
            <StyledContent>
                <Outlet />
            </StyledContent>
        </ErrorBoundary>
    );
});
