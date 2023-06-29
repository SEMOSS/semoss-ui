import {
    mdiAccountGroup,
    mdiClipboardTextOutline,
    mdiCog,
    mdiDatabase,
    mdiDatabaseSearch,
    mdiTabletCellphone,
    mdiTextBoxMultipleOutline,
} from '@mdi/js';

export const SETTINGS_ROUTES: {
    /*** Title of the page */
    title: string;
    /** Relative path to navigate to the page */
    path: string;
    /** Description of the page */
    description: string;

    /** Description of the  page if admin */
    adminDescription?: string;

    /** Icon representing the page */
    icon: string;
}[] = [
    {
        title: 'Settings',
        path: '',
        description: 'View and edit settings for the application',
        adminDescription:
            'View and make changes to settings at the database, project, and insight level.  As an admin conduct queries on SEMOSS specific databases as well as view and edit existing social properties.',
        icon: mdiCog,
    },
    {
        title: 'Database Settings',
        path: 'database-settings',
        description:
            'Select a database to update permissions including requests to access the database, adding ad-hoc members, updating member access, and setting database visibility options.',
        icon: mdiDatabase,
    },
    {
        title: 'Project Settings',
        path: 'project-permissions',
        description: 'View and edit settings for projects',
        icon: mdiClipboardTextOutline,
    },
    {
        title: 'Insight Settings',
        path: 'insight-permissions',
        description: 'View and edit settings for project insights',
        icon: mdiTextBoxMultipleOutline,
    },
    {
        title: 'Member Settings',
        path: 'members',
        description:
            'Add new members, reset passwords, and edit member-based permissions.',
        icon: mdiAccountGroup,
    },

    {
        title: 'Configuration',
        path: 'social-properties',
        description: 'Use this portal to change configuration settings.',
        icon: mdiTabletCellphone,
    },
    {
        title: 'Admin Query',
        path: 'admin-query',
        description: 'Query on SEMOSS based databases',
        icon: mdiDatabaseSearch,
    },
    {
        title: 'External Connections',
        path: 'external-connections',
        description:
            'Integrate with external services like Dropbox, Google, Github, and more.',
        icon: mdiDatabase,
    },
    {
        title: 'Teams',
        path: 'teams',
        description: 'Create and manage teams and set team level permissions.',
        icon: mdiDatabase,
    },
    {
        title: 'Teams Management',
        path: 'teams-management',
        description: 'Create teams and manage members.',
        icon: mdiDatabase,
    },
    {
        title: 'Teams Permissions',
        path: 'teams-permissions',
        description: 'Edit permission roles of teams.',
        icon: mdiDatabase,
    },
    {
        title: 'My Profile',
        path: 'my-profile',
        description: 'Update profile settings.',
        icon: mdiDatabase,
    },
    {
        title: 'Theming',
        path: 'theme',
        description: 'Update theme, this is an admin process.',
        icon: mdiDatabase,
    },
];
