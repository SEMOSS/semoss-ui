import { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useLocation, matchPath } from 'react-router-dom';
import { styled, Typography, Breadcrumbs } from '@semoss/ui';

import { useRootStore } from '@/hooks';
import { SettingsContext } from '@/contexts';
import { Page } from '@/components/ui/';
import { SETTINGS_ROUTES } from './settings.constants';

const Stack = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
}));

const StyledBreadcrumbs = styled(Breadcrumbs)({
    marginTop: '1rem',
});

const StyledLink = {
    textDecoration: 'none',
    color: 'inherit',
};
export const SettingsLayout = () => {
    const { monolithStore } = useRootStore();
    const { pathname } = useLocation();

    // track the active breadcrumbs
    const [adminMode, setAdminMode] = useState(false);

    const matchedRoute = useMemo(() => {
        for (const r of SETTINGS_ROUTES) {
            if (matchPath(`/settings/${r.path}`, pathname)) {
                return r;
            }
        }

        return null;
    }, [pathname]);

    // check if the user is an admin on load
    useEffect(() => {
        monolithStore
            .isAdminUser()
            .then((response) => {
                if (response) {
                    setAdminMode(true);
                } else {
                    setAdminMode(false);
                }
            })
            .catch(() => {
                setAdminMode(false);
            });
    }, []);

    // const showAdminToggle = () => {
    //     let bool = false;

    //     if (admin) {
    //         bool = true;
    //     }

    //     if (isActive('/settings/social-properties')) {
    //         bool = false;
    //     } else if (isActive('/settings/admin-query')) {
    //         bool = false;
    //     }

    //     return bool;
    // };

    if (!matchedRoute) {
        return null;
    }

    return (
        <SettingsContext.Provider
            value={{
                adminMode: adminMode,
            }}
        >
            <Page
                header={
                    <Stack>
                        <div>
                            {matchedRoute.path ? (
                                <Breadcrumbs separator="/">
                                    <Link style={StyledLink} to={'.'}>
                                        Settings
                                    </Link>
                                    <Link
                                        style={StyledLink}
                                        to={matchedRoute.path}
                                    >
                                        {matchedRoute.title}
                                    </Link>
                                </Breadcrumbs>
                            ) : null}
                        </div>
                        <Typography variant="h4">
                            {matchedRoute.title}
                        </Typography>
                        <Typography variant="body1">
                            {!adminMode || matchedRoute.path !== ''
                                ? matchedRoute.description
                                : matchedRoute.adminDescription}
                            {matchedRoute.description}
                        </Typography>
                    </Stack>
                }
            >
                <Outlet />
            </Page>
        </SettingsContext.Provider>
    );
};
