import {
    mdiAccountGroup,
    mdiClipboardTextOutline,
    mdiClock,
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

    /** Prior Links to nav to */
    history?: string[];
}[] = [
    {
        title: 'Settings',
        path: '',
        description: 'View and edit settings for the application',
        adminDescription:
            'View and make changes to settings at the database, project, and insight level.  As an admin conduct queries on SEMOSS specific databases as well as view and edit existing social properties.',
        icon: mdiCog,
        history: [],
    },
    {
        title: 'Database Settings',
        path: 'database',
        description:
            'Select a database to update permissions including requests to access the database, adding ad-hoc members, updating member access, and setting database visibility options.',
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
        title: 'Project Settings',
        path: 'project',
        description: 'View and edit settings for projects',
        icon: mdiClipboardTextOutline,
        history: ['project'],
    },
    {
        title: 'Project Settings',
        path: 'project/:id',
        description:
            'View member permissions, pending requests, and all other viewable settings pertaining to the project',
        icon: mdiClipboardTextOutline,
        history: ['project', 'project/<id>'],
    },
    {
        title: 'Insight Settings',
        path: 'insight',
        description: 'View and edit settings for project insights',
        icon: mdiTextBoxMultipleOutline,
        history: ['insight'],
    },
    {
        title: 'Insight Settings',
        path: 'insight/:id/:projectId',
        description:
            'View member permissions, pending requests, and all other viewable settings pertaining to the project',
        icon: mdiClipboardTextOutline,
        history: ['insight', 'insight/<id>/<projectId>'],
    },
    {
        title: 'Member Settings',
        path: 'members',
        description:
            'Add new members, reset passwords, and edit member-based permissions.',
        icon: mdiAccountGroup,
        history: ['settings/'],
    },

    {
        title: 'Configuration',
        path: 'social-properties',
        description: 'Use this portal to change configuration settings.',
        icon: mdiTabletCellphone,
        history: ['settings/'],
    },
    {
        title: 'Admin Query',
        path: 'admin-query',
        description: 'Query on SEMOSS based databases',
        icon: mdiDatabaseSearch,
        history: ['settings/'],
    },
    {
        title: 'External Connections',
        path: 'external-connections',
        description:
            'Integrate with external services like Dropbox, Google, Github, and more.',
        icon: mdiDatabase,
        history: ['settings/'],
    },
    {
        title: 'Teams',
        path: 'teams',
        description: 'Create and manage teams and set team level permissions.',
        icon: mdiDatabase,
        history: ['settings/'],
    },
    {
        title: 'Teams Management',
        path: 'teams-management',
        description: 'Create teams and manage members.',
        icon: mdiDatabase,
        history: ['settings/'],
    },
    {
        title: 'Teams Permissions',
        path: 'teams-permissions',
        description: 'Edit permission roles of teams.',
        icon: mdiDatabase,
        history: ['settings/'],
    },
    {
        title: 'My Profile',
        path: 'my-profile',
        description: 'Update profile settings.',
        icon: mdiDatabase,
        history: ['settings/'],
    },
    {
        title: 'Theming',
        path: 'theme',
        description: 'Update theme, this is an admin process.',
        icon: mdiDatabase,
        history: ['settings/'],
    },
    {
        title: 'Jobs',
        path: 'jobs',
        description: 'Search by job name or filter using job tags',
        icon: mdiClock,
    },
    {
        // TODO remove this route - using it now to look at old jobs page.
        title: 'Old Jobs',
        path: 'jobs-old',
        description: 'old jobs page using @semoss/components library',
        icon: mdiClock,
    },
];
