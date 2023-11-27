import {
    Functions,
    Inventory2Outlined,
    Polyline,
    SwitchAccessShortcutOutlined,
    TokenOutlined,
} from '@mui/icons-material';

import { ENGINE_TYPES, Role } from '@/types';
import { ModelBrain } from '@/assets/img/ModelBrain';
import { Database } from '@/assets/img/Database';

import { EngineIndexPage } from './EngineIndexPage';
import { EngineMetadataPage } from './EngineMetadataPage';
import { EngineSettingsPage } from './EngineSettingsPage';
import { EngineFilePage } from './EngineFilePage';
import { EngineQAPage } from './EngineQAPage';
// import { EngineQueryDataPage } from './EngineQueryDataPage';
// import { EngineReplaceDataPage } from './EngineReplaceDataPage';
import { EngineUsagePage } from './EngineUsagePage';

export const ENGINE_ROUTES: {
    /** Name of the route */
    name: string;

    /** Path of the page */
    path: string;

    /** Icon to render in the page */
    icon: React.FunctionComponent;

    /** Type of the engine */
    type: ENGINE_TYPES;

    /** Child paths associated with a specific engine */
    specific: {
        /** Name of the specific page */
        name: string;

        /** Path of the specific page */
        path: string;

        /** Restrict to certain roles (set to false to allow all) */
        restrict: Role[] | false;

        /** Component to render */
        component: React.FunctionComponent<{
            /** Type of the engine */
            type: ENGINE_TYPES;
        }>;
    }[];
}[] = [
    {
        name: 'Function',
        path: 'function',
        type: 'FUNCTION',
        icon: SwitchAccessShortcutOutlined,
        specific: [
            {
                name: 'Overview',
                path: '',
                component: EngineIndexPage,
                restrict: false,
            },
            {
                name: 'Usage',
                path: 'usage',
                component: EngineUsagePage,
                restrict: ['EDIT', 'OWNER', 'READ_ONLY'],
            },
            {
                name: 'Settings',
                path: 'settings',
                component: EngineSettingsPage,
                restrict: ['EDIT', 'OWNER'],
            },
        ],
    },
    {
        name: 'Model',
        path: 'model',
        type: 'MODEL',
        icon: ModelBrain as React.FunctionComponent,
        specific: [
            {
                name: 'Overview',
                path: '',
                component: EngineIndexPage,
                restrict: false,
            },
            {
                name: 'Usage',
                path: 'usage',
                component: EngineUsagePage,
                restrict: ['EDIT', 'OWNER', 'READ_ONLY'],
            },
            {
                name: 'Settings',
                path: 'settings',
                component: EngineSettingsPage,
                restrict: ['EDIT', 'OWNER'],
            },
        ],
    },
    {
        name: 'Database',
        path: 'database',
        type: 'DATABASE',
        icon: Database,
        specific: [
            {
                name: 'Overview',
                path: '',
                component: EngineIndexPage,
                restrict: false,
            },
            {
                name: 'Metadata',
                path: 'metadata',
                component: EngineMetadataPage,
                restrict: ['EDIT', 'OWNER', 'READ_ONLY'],
            },
            {
                name: 'Usage',
                path: 'usage',
                component: EngineUsagePage,
                restrict: ['EDIT', 'OWNER', 'READ_ONLY'],
            },
            // {
            //     name: 'Query',
            //     path: 'query',
            //     component: EngineQueryDataPage,
            //     restrict: ['EDIT', 'OWNER', 'READ_ONLY'],
            // },
            // {
            //     name: 'Replace',
            //     path: 'replace',
            //     component: EngineReplaceDataPage,
            //     restrict: ['EDIT', 'OWNER'],
            // },
            {
                name: 'Settings',
                path: 'settings',
                component: EngineSettingsPage,
                restrict: ['EDIT', 'OWNER'],
            },
        ],
    },
    {
        name: 'Vector',
        path: 'vector',
        type: 'VECTOR',
        icon: TokenOutlined,
        specific: [
            {
                name: 'Overview',
                path: '',
                component: EngineIndexPage,
                restrict: false,
            },
            {
                name: 'Usage',
                path: 'usage',
                component: EngineUsagePage,
                restrict: ['EDIT', 'OWNER', 'READ_ONLY'],
            },
            {
                name: 'Settings',
                path: 'settings',
                component: EngineSettingsPage,
                restrict: ['EDIT', 'OWNER'],
            },
            ,
            {
                name: 'Files',
                path: 'files',
                component: EngineFilePage,
                restrict: ['OWNER'],
            },
            {
                name: 'Q&A',
                path: 'qa',
                component: EngineQAPage,
                restrict: ['OWNER'],
            },
        ],
    },
    {
        name: 'Storage',
        path: 'storage',
        type: 'STORAGE',
        icon: Inventory2Outlined,
        specific: [
            {
                name: 'Overview',
                path: '',
                component: EngineIndexPage,
                restrict: false,
            },
            {
                name: 'Usage',
                path: 'usage',
                component: EngineUsagePage,
                restrict: ['EDIT', 'OWNER', 'READ_ONLY'],
            },
            {
                name: 'Settings',
                path: 'settings',
                component: EngineSettingsPage,
                restrict: ['EDIT', 'OWNER'],
            },
        ],
    },
];
