import { useEffect, useState } from 'react';
import { Outlet, useLocation, matchPath } from 'react-router-dom';
import { styled, Typography } from 'semoss-components';

import { useRootStore } from '@/hooks';
import { SettingsContext } from '@/contexts';
import { Page } from '@/components/ui/';

const Stack = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
}));

export const SettingsLayout = () => {
    const { monolithStore } = useRootStore();
    const { pathname } = useLocation();

    // track the active breadcrumbs
    const [crumbs, setCrumbs] = useState([]);
    const [adminMode, setAdminMode] = useState(false);

    useEffect(() => {
        const c = [];

        c.push({
            href: 'http://localhost:3000/settings/',
            display: 'All Content',
        });

        if (isActive('/settings')) {
            setCrumbs(c);
            return;
        } else if (isActive('/settings/database-permissions')) {
            c.push({
                href: 'http://localhost:3000/settings/database-permissions',
                display: 'Database Permissions',
            });
        } else if (isActive('/settings/project-permissions')) {
            c.push({
                href: 'http://localhost:3000/settings/project-permissions',
                display: 'Project Permissions',
            });
        } else if (isActive('/settings/insight-permissions')) {
            c.push({
                href: 'http://localhost:3000/settings/insight-permissions',
                display: 'Insight Permissions',
            });
        } else if (isActive('/settings/social-properties')) {
            c.push({
                href: 'http://localhost:3000/settings/social-properties',
                display: 'Social Properties',
            });
        } else if (isActive('/settings/jobs')) {
            c.push({
                href: 'http://localhost:3000/settings/jobs',
                display: 'Jobs',
            });
        } else if (isActive('/settings/admin-query')) {
            c.push({
                href: 'http://localhost:3000/settings/admin-query',
                display: 'Admin Query',
            });
        } else if (isActive('/settings/external-connections')) {
            c.push({
                href: 'http://localhost:3000/settings/external-connections',
                display: 'External Connections',
            });
        } else if (isActive('/settings/teams')) {
            c.push({
                href: 'http://localhost:3000/settings/teams',
                display: 'Teams',
            });
        } else if (isActive('/settings/teams-management')) {
            c.push({
                href: 'http://localhost:3000/settings/teams-management',
                display: 'Teams Management',
            });
        } else if (isActive('/settings/teams-permissions')) {
            c.push({
                href: 'http://localhost:3000/settings/teams-permissions',
                display: 'Teams Permissions',
            });
        } else if (isActive('/settings/members')) {
            c.push({
                href: 'http://localhost:3000/settings/members',
                display: 'Members',
            });
        } else if (isActive('/settings/my-profile')) {
            c.push({
                href: 'http://localhost:3000/settings/my-profile',
                display: 'My Profile',
            });
        } else if (isActive('/settings/theme')) {
            c.push({
                href: 'http://localhost:3000/settings/theme',
                display: 'Theme',
            });
        }

        setCrumbs(c);

        () => {
            setCrumbs([]);
        };
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

    /**
     * Check if a path is active
     * @param path - path to check against
     * @returns true if the path is active
     */
    const isActive = (path: string) => {
        return !!matchPath(path, pathname);
    };

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

    return (
        <SettingsContext.Provider
            value={{
                adminMode: adminMode,
            }}
        >
            <Page
                header={
                    <>
                        <Stack>
                            <Typography variant="h5">Settings</Typography>
                            <div>
                                {crumbs.map((c, i) => {
                                    return (
                                        <a key={i} href={c.href}>
                                            {c.display}
                                        </a>
                                    );
                                })}
                            </div>
                        </Stack>
                    </>
                }
            >
                <Outlet />
            </Page>
        </SettingsContext.Provider>
    );
};
