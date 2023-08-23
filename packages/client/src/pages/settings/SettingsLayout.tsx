import { useEffect, useMemo, useState } from 'react';
import {
    Outlet,
    Link,
    useLocation,
    matchPath,
    useParams,
} from 'react-router-dom';
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

// const StyledBreadcrumbs = styled(Breadcrumbs)({
//     marginTop: '1rem',
// });

const StyledLink = {
    textDecoration: 'none',
    color: 'inherit',
};
export const SettingsLayout = () => {
    const { monolithStore } = useRootStore();
    const { id } = useParams();
    const { pathname, state } = useLocation();

    // track the active breadcrumbs
    const [adminMode, setAdminMode] = useState(true);

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
                                    <Link to={'.'} style={StyledLink}>
                                        Settings
                                    </Link>
                                    {matchedRoute.history.map((link, i) => {
                                        return (
                                            <Link
                                                style={StyledLink}
                                                to={link.replace('<id>', id)}
                                                key={i + link}
                                                state={...state}
                                            >
                                                {link.includes('<id>')
                                                    ? id
                                                    : matchedRoute.title}
                                            </Link>
                                        );
                                    })}
                                </Breadcrumbs>
                            ) : null}
                        </div>
                        <Typography variant="h4">
                            {matchedRoute.history.length < 2
                                ? matchedRoute.title
                                : state
                                ? state.name
                                : matchedRoute.title}
                        </Typography>
                        <Typography variant="body1">
                            {!adminMode || matchedRoute.path !== ''
                                ? matchedRoute.description
                                : matchedRoute.adminDescription}
                        </Typography>
                    </Stack>
                }
            >
                <Outlet />
            </Page>
        </SettingsContext.Provider>
    );
};
