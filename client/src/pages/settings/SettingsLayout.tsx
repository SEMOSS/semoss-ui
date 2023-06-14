import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, matchPath } from 'react-router-dom';
import { Page } from '@/components/ui/';
import { theme } from '@/theme';
import { styled, Breadcrumb } from '@semoss/components';

import { SettingsIndex } from './SettingsIndex';

const StyledTitleGroup = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    // alignItems: 'center',
    gap: theme.space['4'],
});

const StyledTitle = styled('h1', {
    flex: '1',
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.semibold,
});

const StyledSpaceBetween = styled('div', {
    display: 'flex',
    justifyContent: 'space-between',
});

const StyledAdminMode = styled('div', {
    display: 'flex',
    fontSize: theme.fontSizes.md,
    gap: '.5rem',
});

export const SettingsLayout = () => {
    const { pathname } = useLocation();

    const [crumbs, setCrumbs] = useState([]);

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
        <SettingsIndex>
            <Page
                header={
                    <>
                        <StyledTitleGroup>
                            <StyledTitle>Settings</StyledTitle>
                            <Breadcrumb>
                                {crumbs.map((c, i) => {
                                    return (
                                        <Breadcrumb.Item key={i} href={c.href}>
                                            {c.display}
                                        </Breadcrumb.Item>
                                    );
                                })}
                            </Breadcrumb>
                        </StyledTitleGroup>
                    </>
                }
            >
                <Outlet />
            </Page>
        </SettingsIndex>
    );
};
