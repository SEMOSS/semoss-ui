import {
    mdiAccountGroup,
    mdiClipboardTextOutline,
    mdiCog,
    mdiDatabase,
    mdiDatabaseSearch,
    mdiTabletCellphone,
    mdiTextBoxMultipleOutline,
} from '@mdi/js';

import { SettingsIndexPage } from './SettingsIndexPage';
import { DatabasePermissionsPage } from './DatabasePermissionsPage';
import { ProjectPermissionsPage } from './ProjectPermissionsPage';
import { InsightPermissionsPage } from './InsightPermissionsPage';
import { MemberSettingsPage } from './MemberSettingsPage';
import { SocialPropertiesPage } from './SocialPropertiesPage';
import { AdminQueryPage } from './AdminQueryPage';
import { ExternalConnectionsPage } from './ExternalConnectionsPage';
import { TeamsManagementPage } from './TeamsManagementPage';
import { TeamsPage } from './TeamsPage';
import { TeamsPermissionsPage } from './TeamsPermissionsPage';
import { MyProfilePage } from './MyProfilePage';
import { ThemePage } from './ThemePage';

export const SETTINGS_ROUTES: {
    /*** Title of the page */
    title: string;
    /** Relative path to navigate to the page */
    path: string;
    /** Description of the page */
    description: string;
    /** Icon representing the page */
    icon: string;
    /** Component to render for the route */
    component: React.FunctionComponent;
}[] = [
    {
        title: 'Settings',
        path: '',
        description: 'View and edit settings for the application',
        icon: mdiCog,
        component: SettingsIndexPage,
    },
    {
        title: 'Database Settings',
        path: 'database-permissions',
        description: 'View and edit settings for databases',
        icon: mdiDatabase,
        component: DatabasePermissionsPage,
    },
    {
        title: 'Project Settings',
        path: 'project-permissions',
        description: 'View and edit settings for projects',
        icon: mdiClipboardTextOutline,
        component: ProjectPermissionsPage,
    },
    {
        title: 'Insight Settings',
        path: 'insight-permissions',
        description: 'View and edit settings for project insights',
        icon: mdiTextBoxMultipleOutline,
        component: InsightPermissionsPage,
    },
    {
        title: 'Member Settings',
        path: 'members',
        description:
            'Add new members, reset passwords, and edit member-based permissions.',
        icon: mdiAccountGroup,
        component: MemberSettingsPage,
    },

    {
        title: 'Social Properties',
        path: 'social-properties',
        description: 'Edit social properties',
        icon: mdiTabletCellphone,
        component: AdminQueryPage,
    },
    {
        title: 'Admin Query',
        path: 'admin-query',
        description: 'Query on SEMOSS based databases',
        icon: mdiDatabaseSearch,
        component: SocialPropertiesPage,
    },
    {
        title: 'External Connections',
        path: 'external-connections',
        description:
            'Integrate with external services like Dropbox, Google, Github, and more.',
        icon: mdiDatabase,
        component: ExternalConnectionsPage,
    },
    {
        title: 'Teams',
        path: 'teams',
        description: 'Create and manage teams and set team level permissions.',
        icon: mdiDatabase,
        component: TeamsPage,
    },
    {
        title: 'Teams Management',
        path: 'teams-management',
        description: 'Create teams and manage members.',
        icon: mdiDatabase,
        component: TeamsManagementPage,
    },
    {
        title: 'Teams Permissions',
        path: 'teams-permissions',
        description: 'Edit permission roles of teams.',
        icon: mdiDatabase,
        component: TeamsPermissionsPage,
    },
    {
        title: 'My Profile',
        path: 'my-profile',
        description: 'Update profile settings.',
        icon: mdiDatabase,
        component: MyProfilePage,
    },
    {
        title: 'Theming',
        path: 'theme',
        description: 'Update theme, this is an admin process.',
        icon: mdiDatabase,
        component: ThemePage,
    },
];
