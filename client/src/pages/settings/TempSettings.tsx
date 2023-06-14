import React, { Suspense, lazy } from 'react';

// Lazy loading not necessary due to trade offs
// const DatabasePermissions = lazy(() => import('./DatabasePermissions'));
// const ProjectPermissions = lazy(() => import('./ProjectPermissions'));
// const InsightPermissions = lazy(() => import('./InsightPermissions'));
// const ExternalConnections = lazy(() => import('./ExternalConnections'));
// const TeamsPermissions = lazy(() => import('./TeamsPermissions'));
// const TeamsManagement = lazy(() => import('./TeamsManagement'));
// const Members = lazy(() => import('./Members'));
// const MyProfile = lazy(() => import('./MyProfile'));

import {
    // DatabasePermissionsPage,
    // ProjectPermissionsPage,
    // InsightPermissionsPage,
    ExternalConnectionsPage,
    TeamsPage,
    TeamsPermissionsPage,
    TeamsManagementPage,
    MyProfilePage,
    ThemePage,
    // SocialPropertiesPage,
    // AdminQueryPage,
} from './';

export const TempSettings = (props) => {
    const { type } = props;

    const renderContent = (): JSX.Element => {
        return (
            // use load screen for lazy load
            // <Suspense fallback={<div>Loading...</div>}>
            <>
                {type === 'external-connections' && (
                    <ExternalConnectionsPage></ExternalConnectionsPage>
                )}
                {type === 'teams' && <TeamsPage></TeamsPage>}
                {type === 'teams-management' && (
                    <TeamsManagementPage></TeamsManagementPage>
                )}
                {type === 'teams-permissions' && (
                    <TeamsPermissionsPage></TeamsPermissionsPage>
                )}
                {type === 'my-profile' && <MyProfilePage></MyProfilePage>}
                {type === 'theme' && <ThemePage></ThemePage>}
            </>
            // </Suspense>
        );
    };
    return <div>{renderContent()}</div>;
};
