import {
    mdiAccountGroup,
    mdiClipboardTextOutline,
    // mdiClock,
    mdiCog,
    mdiDatabase,
    mdiDatabaseSearch,
    mdiTabletCellphone,
    // mdiTextBoxMultipleOutline,
    mdiArchive,
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

    /** Prior Links to nav to */
    history?: string[];

    admin?: boolean;
}[] = [
    {
        title: 'Settings',
        path: '',
        description: 'View and edit settings for the application',
        adminDescription:
            'View and make changes to settings at the database, app, and insight level.  As an admin conduct queries on SEMOSS specific databases as well as view and edit existing social properties.',
        icon: mdiCog,
        history: [],
    },
    {
        title: 'App Settings',
        path: 'app',
        description: 'View and edit settings for apps',
        icon: mdiClipboardTextOutline,
        history: ['app'],
    },
    {
        title: 'App Settings',
        path: 'app/:id',
        description:
            'View member permissions, pending requests, and all other viewable settings pertaining to the app',
        icon: mdiClipboardTextOutline,
        history: ['app', 'app/<id>'],
    },
    {
        title: 'Function Settings',
        path: 'function',
        description: 'View and edit settings for functions',
        icon: mdiDatabase,
        history: ['function'],
    },
    {
        title: 'Function Settings',
        path: 'function/:id',
        description:
            'View member permissions, pending requests, and all other viewable settings pertaining to the database',
        icon: mdiDatabase,
        history: ['function', 'function/<id>'],
    },
    {
        title: 'Model Settings',
        path: 'model',
        description: 'View and edit settings for models',
        icon: mdiDatabase,
        history: ['model'],
    },
    {
        title: 'Model Settings',
        path: 'model/:id',
        description:
            'View member permissions, pending requests, and all other viewable settings pertaining to the model',
        icon: mdiDatabase,
        history: ['model', 'model/<id>'],
    },
    {
        title: 'Database Settings',
        path: 'database',
        description: 'View and edit settings for databases',
        icon: mdiDatabase,
        history: ['database'],
    },
    {
        title: 'Database Settings',
        path: 'database/:id',
        description:
            'View member permissions, pending requests, and all other viewable settings pertaining to the database',
        icon: mdiDatabase,
        history: ['database', 'database/<id>'],
    },
    {
        title: 'Vector Settings',
        path: 'vector',
        description: 'View and edit settings for vector databases',
        icon: mdiDatabase,
        history: ['vector'],
    },
    {
        title: 'Vector Settings',
        path: 'vector/:id',
        description:
            'View member permissions, pending requests, and all other viewable settings pertaining to the vector',
        icon: mdiDatabase,
        history: ['vector', 'vector/<id>'],
    },
    {
        title: 'Storage Settings',
        path: 'storage',
        description: 'View and edit settings for storages',
        icon: mdiArchive,
        history: ['storage'],
    },
    {
        title: 'Storage Settings',
        path: 'storage/:id',
        description:
            'View member permissions, pending requests, and all other viewable settings pertaining to the storage',
        icon: mdiArchive,
        history: ['storage', 'storage/<id>'],
    },
    // {
    //     title: 'Insight Settings',
    //     path: 'insight',
    //     description: 'View and edit settings for app insights',
    //     icon: mdiTextBoxMultipleOutline,
    //     history: ['insight'],
    // },
    // {
    //     title: 'Insight Settings',
    //     path: 'insight/:id/:appId',
    //     description:
    //         'View member permissions, pending requests, and all other viewable settings pertaining to the app',
    //     icon: mdiClipboardTextOutline,
    //     history: ['insight', 'insight/<id>/<appId>'],
    // },
    {
        title: 'Member Settings',
        path: 'members',
        description:
            'Add new members, reset passwords, and edit member-based permissions.',
        icon: mdiAccountGroup,
        history: ['settings/'],
        admin: true,
    },
    {
        title: 'Team Permissions',
        path: 'team-permissions',
        description: 'View and edit permissions for teams',
        icon: mdiDatabase,
        history: ['team-permissions'],
        admin: true,
    },
    {
        title: 'Team Permissions',
        path: 'team-permissions/:id',
        description:
            'View member permissions, pending requests, and all other viewable settings pertaining to the team',
        icon: mdiDatabase,
        history: ['team-permissions', 'team-permissions/<id>'],
        admin: true,
    },
    {
        title: 'Configuration',
        path: 'social-properties',
        description: 'Use this portal to change configuration settings.',
        icon: mdiTabletCellphone,
        history: ['settings/'],
        admin: true,
    },
    {
        title: 'Jobs',
        path: 'jobs',
        description: 'Search by job name or filter using job tags',
        icon: mdiTabletCellphone,
        history: ['settings/'],
    },
    {
        title: 'Admin Query',
        path: 'admin-query',
        description: 'Query on SEMOSS based databases',
        icon: mdiDatabaseSearch,
        history: ['settings/'],
        admin: true,
    },
    {
        title: 'My Profile',
        path: 'my-profile',
        description: 'Update settings related to your profile.',
        icon: mdiDatabase,
        history: ['settings/'],
        admin: false,
    },
];
