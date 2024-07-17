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
import { EngineSmssPage } from './EngineSmssPage';

export const ENGINE_ROUTES: {
    /** Name of the route */
    name: string;

    /** Path of the page */
    path: string;

    /** Icon to render in the page */
    icon: React.FunctionComponent;

    /** Type of the engine */
    type: ENGINE_TYPES;

    /** Description of the engine*/
    description: string;

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
        description:
            'Expose and reuse LLM functionality in the form of functions to promote efficiency across app development. These functions include LLM Guard scanners to ensure the secure use of LLMs. ',
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
            {
                name: 'SMSS',
                path: 'smss',
                component: EngineSmssPage,
                restrict: ['OWNER'],
            },
        ],
    },
    {
        name: 'Model',
        path: 'model',
        type: 'MODEL',
        description:
            'Models are diverse, with particular strengths and weaknesses specific to each use case. Our model catalog exposes these models in an abstracted fashion, allowing data scientists to hand-select and/or swap models as desired.',
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
            {
                name: 'SMSS',
                path: 'smss',
                component: EngineSmssPage,
                restrict: ['OWNER'],
            },
        ],
    },
    {
        name: 'Database',
        path: 'database',
        type: 'DATABASE',
        description:
            'Database catalog is an integrated data nexus connecting to diverse databases and serving as a springboard for unified data orchestration, innovation, and insights. Access structured data sources like relational database management systems (RDBMS), Triplestore/RDF, graph databases, Excel/CSVs, and data exposed via API.  ',
        icon: Database as React.FunctionComponent,
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
            {
                name: 'SMSS',
                path: 'smss',
                component: EngineSmssPage,
                restrict: ['OWNER'],
            },
        ],
    },
    {
        name: 'Vector',
        path: 'vector',
        type: 'VECTOR',
        description:
            'Knowledge repositories, also known as vector databases, enable fast retrieval of information and semantic search. Create knowledge repositories on the fly and connect them for simplified reuse across apps.  ',
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
            {
                name: 'SMSS',
                path: 'smss',
                component: EngineSmssPage,
                restrict: ['OWNER'],
            },
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
        description:
            'Tapping into unstructured data (e.g., audio, video, images, code) is critical when training and using AI solutions. Our storage catalog enables integration with many industry-leading cloud storage solutions to effortlessly access a project’s unstructured data.',
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
            {
                name: 'SMSS',
                path: 'smss',
                component: EngineSmssPage,
                restrict: ['OWNER'],
            },
        ],
    },
];
