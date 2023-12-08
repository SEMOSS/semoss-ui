//Drag and Drop Data
import CSV from '@/assets/img/CSV.svg';
import EXCEL from '@/assets/img/EXCEL.png';
import TSV from '@/assets/img/TSV.svg';
import SQLITE from '@/assets/img/SQLITE.png';
import H2_DB from '@/assets/img/H2_DB.png';
import NEO4J from '@/assets/img/NEO4J.png';
import TINKER from '@/assets/img/TINKER.png';
import ZIP from '@/assets/img/ZIP.png';
//Connect to an External Database
import ASTER from '@/assets/img/ASTER.png';
import ATHENA from '@/assets/img/ATHENA.png';
import BIGQUERY from '@/assets/img/BIGQUERY.png';
import CASSANDRA from '@/assets/img/CASSANDRA.png';
import CLICKHOUSE from '@/assets/img/CLICKHOUSE.png';
import DATABRICKS from '@/assets/img/DATABRICKS.png';
import DATASTAX from '@/assets/img/DATASTAX.png';
import DB2 from '@/assets/img/DB2.png';
import DERBY from '@/assets/img/DERBY.png';
import ELASTIC_SEARCH from '@/assets/img/ELASTIC_SEARCH.svg';
import HIVE from '@/assets/img/HIVE.jpg';
import IMPALA from '@/assets/img/IMPALA.png';
import MARIA_DB from '@/assets/img/MARIA_DB.png';
import MYSQL from '@/assets/img/MYSQL.png';
import OPEN_SEARCH from '@/assets/img/OPEN_SEARCH.png';
import ORACLE from '@/assets/img/ORACLE.png';
import PHOENIX from '@/assets/img/PHOENIX.png';
import POSTGRES from '@/assets/img/POSTGRES.png';
import REDSHIFT from '@/assets/img/REDSHIFT.png';
import SAP_HANA from '@/assets/img/SAP_HANA.png';
import SEMOSS from '@/assets/img/SEMOSS_BLUE_LOGO.svg';
import SNOWFLAKE from '@/assets/img/SNOWFLAKE.png';
import SQL_SERVER from '@/assets/img/SQL_SERVER.png';
import TERADATA from '@/assets/img/TERADATA.png';
import TIBCO from '@/assets/img/TIBCO.png';
import TRINO from '@/assets/img/TRINO.jpg';
//Add Storage
import AMAZON_S3 from '@/assets/img/Amazon_S3.png';
import DREAMHOST from '@/assets/img/DREAMHOST.png';
import DROPBOX from '@/assets/img/dropbox.png';
import GOOGLE_CLOUD from '@/assets/img/GOOGLE_CLOUD_STORAGE.png';
import GOOGLE_DRIVE from '@/assets/img/GOOGLE_DRIVE.png';
import ONEDRIVE from '@/assets/img/ONEDRIVE.png';
import AZURE_BLOB from '@/assets/img/AZURE_BLOB.png';
import MINIO from '@/assets/img/MINIO.png';
import CEPH from '@/assets/img/CEPH.png';
import SFTP from '@/assets/img/SFTP.png';
//Commercial Models
import OPEN_AI from '@/assets/img/OPEN_AI.png';
import AZURE_OPEN_AI from '@/assets/img/OPEN_AI.png';
import CLAUDE from '@/assets/img/CLAUDE_AI.png';
import VERTEX from '@/assets/img/VERTEX_AI.png';
//Local Models
import BRAIN from '@/assets/img/BRAIN.png';
import META from '@/assets/img/META.png';
import FALCON from '@/assets/img/FALCON_AI.png';
import VICUNA from '@/assets/img/VICUNA.jpg';
import MOSAIC from '@/assets/img/MOSAIC.png';
import DOLLY from '@/assets/img/DOLLY_AI.jpg';
import FLAN from '@/assets/img/FLAN.jpg';
import BERT from '@/assets/img/BERT.png';
import ELEUTHER from '@/assets/img/ELEUTHER_AI.png';
import NEMO from '@/assets/img/NEMO.png';
import GOOGLE from '@/assets/img/google.png';
//Embedded Models
import ORCA from '@/assets/img/ORCA.png';
import STABILITY_AI from '@/assets/img/STABILITY_AI.png';
import REPLIT from '@/assets/img/REPLIT_CODE.png';
// Functions
import WEVIATE from '@/assets/img/WEVIATE.png';
import PINECONE from '@/assets/img/PINECONE.png';
import RESTAPI from '@/assets/img/rest-api.svg';

// TODO: Get rid of this and throw it into Connection Options
export const stepsOne = [
    {
        name: 'Connect to Database',
        description:
            "In today's data-driven world, the ability to effortlessly establish connections with various database types is pivotal for unlocking the full potential of your applications and analytical processes. Whether you're a developer, data analyst, or business professional, this page serves as your gateway to understanding the array of database options at your disposal.",
        disabled: false,
        data: 'DATABASE',
    },
    {
        name: 'Copy Database',
        description: '',
        disabled: true,
        data: 'COPY_DATABASE', // DOES NOT MATTER AT THE MOMENT, Tie this into one DS
    },
    // {
    //     name: 'Upload Database',
    //     description: '',
    //     disabled: true,
    //     data: 'UPLOAD_DATABASE', // DOES NOT MATTER AT THE MOMENT, Tie this into one DS
    // },
    {
        name: 'Build Database',
        description: '',
        disabled: true,
        data: 'BUILD_DATABASE', // DOES NOT MATTER AT THE MOMENT, Tie this into one DS
    },
    {
        name: 'Connect to Model',
        description:
            "In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of database options available within the LLM landscape.",
        disabled: false,
        data: 'MODEL',
    },
    {
        name: 'Connect to Storage',
        description: '',
        disabled: false,
        data: 'STORAGE',
    },
    {
        name: 'Connect to Vector Database',
        description: '',
        disabled: false,
        data: 'VECTOR',
    },
    {
        name: 'Connect to Function',
        description:
            "In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of database options available within the LLM landscape.",
        disabled: false,
        data: 'FUNCTION',
    },
];

// {
//     MODEL: {
//         "View All Page Header": [{
//             // id will get created on mount of import and held in Context.
//             id: Model-View All Page Header-Open AI
//             name: 'Open AI',
//             disable: false,
//             icon: OPEN_AI,
//             fields: [] // FORM FIELDS
//         }]
//     },
//     STORAGE: {},
// }

export type EngineFields = {
    name: string;
    fields: {
        fieldName: string;
        label: string;
        defaultValue: string;
        options: {
            component: string;
            options?: { value: string; display: string }[];
            pixel?: string; // Pixel to populate options for select
        };
        disabled: boolean;
        rules: Record<string, any>; // react hook form
        pixel?: string; // used to populate default value
    }[];
}[];

// TODO: Type out Connection Options
export const CONNECTION_OPTIONS = {
    MODEL: {
        'Commercially Hosted': [
            {
                name: 'Open AI',
                disable: false,
                icon: OPEN_AI,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: 'OPEN_AI',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Open AI',
                                    value: 'OPEN_AI',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'OPEN_AI_KEY',
                        label: 'Open AI Key',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'gpt-3.5-turbo',
                                    value: 'gpt-3.5-turbo',
                                },
                                {
                                    display: 'gpt-4-32k',
                                    value: 'gpt-4-32k',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'Azure Open AI',
                disable: false,
                icon: AZURE_OPEN_AI,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: 'OPEN_AI',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Open AI',
                                    value: 'OPEN_AI',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'OPEN_AI_KEY',
                        label: 'Azure Open AI Key',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Deployment Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENDPOINT',
                        label: 'Azure Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'Claude',
                disable: false,
                icon: CLAUDE,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: 'BEDROCK',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Bedrock',
                                    value: 'BEDROCK',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'AWS_REGION',
                        label: 'Aws Region',
                        defaultValue: 'us-east-1',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'AWS_ACCESS_KEY',
                        label: 'Aws Access Key',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'AWS_SECRET_KEY',
                        label: 'Aws Secret Key',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'Vertex',
                disable: false,
                icon: VERTEX,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: 'VERTEX',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Vertex',
                                    value: 'VERTEX',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: 'text-bison',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'GCP_REGION',
                        label: 'GCP Region',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
        ],
        'Locally Hosted': [
            {
                name: 'Wizard 13B',
                disable: false,
                icon: BRAIN,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: 'Wizard 13B',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Text Generation',
                                    value: 'TEXT_GENERATION',
                                },
                                {
                                    display: 'vLLM (Fast Chat)',
                                    value: 'FAST_CHAT',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENDPOINT',
                        label: 'Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'Llama2 7B',
                disable: false,
                icon: META,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: 'lmsys/vicuna-7b-v1.5',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Text Generation',
                                    value: 'TEXT_GENERATION',
                                },
                                {
                                    display: 'vLLM (Fast Chat)',
                                    value: 'FAST_CHAT',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENDPOINT',
                        label: 'Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'Llama2 13B',
                disable: false,
                icon: META,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: 'Llama2 13B',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Text Generation',
                                    value: 'TEXT_GENERATION',
                                },
                                {
                                    display: 'vLLM (Fast Chat)',
                                    value: 'FAST_CHAT',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENDPOINT',
                        label: 'Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'Llama2 70B',
                disable: false,
                icon: META,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: 'Llama2 70B',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Text Generation',
                                    value: 'TEXT_GENERATION',
                                },
                                {
                                    display: 'vLLM (Fast Chat)',
                                    value: 'FAST_CHAT',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENDPOINT',
                        label: 'Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'Falcon',
                disable: false,
                icon: FALCON,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: 'Falcon',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Text Generation',
                                    value: 'TEXT_GENERATION',
                                },
                                {
                                    display: 'vLLM (Fast Chat)',
                                    value: 'FAST_CHAT',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENDPOINT',
                        label: 'Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'StableBeluga2',
                disable: false,
                icon: BRAIN,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: 'StableBeluga2',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Text Generation',
                                    value: 'TEXT_GENERATION',
                                },
                                {
                                    display: 'vLLM (Fast Chat)',
                                    value: 'FAST_CHAT',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENDPOINT',
                        label: 'Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'Guanaco',
                disable: false,
                icon: BRAIN,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: 'Guanaco',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Text Generation',
                                    value: 'TEXT_GENERATION',
                                },
                                {
                                    display: 'vLLM (Fast Chat)',
                                    value: 'FAST_CHAT',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENDPOINT',
                        label: 'Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'Vicuna',
                disable: false,
                icon: VICUNA,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: 'Vicuna',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Text Generation',
                                    value: 'TEXT_GENERATION',
                                },
                                {
                                    display: 'vLLM (Fast Chat)',
                                    value: 'FAST_CHAT',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENDPOINT',
                        label: 'Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'Mosaic ML',
                disable: false,
                icon: MOSAIC,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: 'Mosaic ML',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Text Generation',
                                    value: 'TEXT_GENERATION',
                                },
                                {
                                    display: 'vLLM (Fast Chat)',
                                    value: 'FAST_CHAT',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENDPOINT',
                        label: 'Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'Dolly',
                disable: false,
                icon: DOLLY,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: 'Dolly',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Text Generation',
                                    value: 'TEXT_GENERATION',
                                },
                                {
                                    display: 'vLLM (Fast Chat)',
                                    value: 'FAST_CHAT',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENDPOINT',
                        label: 'Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'Replit code model – 3b',
                disable: false,
                icon: REPLIT,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: 'Replit code model – 3b',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Text Generation',
                                    value: 'TEXT_GENERATION',
                                },
                                {
                                    display: 'vLLM (Fast Chat)',
                                    value: 'FAST_CHAT',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENDPOINT',
                        label: 'Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'Flan T5 Large',
                disable: false,
                icon: FLAN,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: 'Flan T5 Large',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Text Generation',
                                    value: 'TEXT_GENERATION',
                                },
                                {
                                    display: 'vLLM (Fast Chat)',
                                    value: 'FAST_CHAT',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENDPOINT',
                        label: 'Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'Flan T5 XXL',
                disable: false,
                icon: FLAN,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: 'Flan T5 XXL',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Text Generation',
                                    value: 'TEXT_GENERATION',
                                },
                                {
                                    display: 'vLLM (Fast Chat)',
                                    value: 'FAST_CHAT',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENDPOINT',
                        label: 'Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'Bert',
                disable: false,
                icon: BERT,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: 'Bert',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Text Generation',
                                    value: 'TEXT_GENERATION',
                                },
                                {
                                    display: 'vLLM (Fast Chat)',
                                    value: 'FAST_CHAT',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENDPOINT',
                        label: 'Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'Eleuther GPTJ',
                disable: false,
                icon: ELEUTHER,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: 'Eleuther GPTJ',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Text Generation',
                                    value: 'TEXT_GENERATION',
                                },
                                {
                                    display: 'vLLM (Fast Chat)',
                                    value: 'FAST_CHAT',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENDPOINT',
                        label: 'Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'Wizard Coder',
                disable: false,
                icon: BRAIN,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: 'WizardLM/WizardCoder-15B-V1.0',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Text Generation',
                                    value: 'TEXT_GENERATION',
                                },
                                {
                                    display: 'vLLM (Fast Chat)',
                                    value: 'FAST_CHAT',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENDPOINT',
                        label: 'Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'NeMo',
                disable: true,
                icon: NEMO,
                fields: [],
            },
        ],
        Embedded: [
            {
                name: 'Orca',
                disable: false,
                icon: ORCA,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: 'Orca',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Embedded',
                                    value: 'EMBEDDED',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENDPOINT',
                        label: 'Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'Stablity AI',
                disable: true,
                icon: STABILITY_AI,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Embedded',
                                    value: 'EMBEDDED',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENDPOINT',
                        label: 'Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'Replit Code Model',
                disable: true,
                icon: REPLIT,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Embedded',
                                    value: 'EMBEDDED',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENDPOINT',
                        label: 'Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VAR_NAME',
                        label: 'Variable Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INIT_MODEL_ENGINE',
                        label: 'Init Script',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_CONVERSATION_HISTORY',
                        label: 'Keep Conversation History',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'KEEP_INPUT_OUTPUT',
                        label: 'Record Questions and Responses',
                        defaultValue: 'false',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'true',
                                    value: 'true',
                                },
                                {
                                    display: 'false',
                                    value: 'false',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MAX_TOKENS',
                        label: 'Max Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                    {
                        fieldName: 'MAX_INPUT_TOKENS',
                        label: 'Max Input Tokens',
                        rules: { required: false },
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                    },
                ],
            },
            {
                name: 'NeMo',
                disable: true,
                icon: NEMO,
                fields: [],
            },
        ],
        'File Uploads': [
            {
                name: 'ZIP',
                disable: false,
                icon: ZIP,
                fields: [
                    {
                        fieldName: 'ZIP',
                        label: 'Zip File',
                        defaultValue: null,
                        options: {
                            component: 'file-upload',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                ],
            },
        ],
    },
    FUNCTION: {
        Function: [
            {
                name: 'REST',
                disable: false,
                icon: RESTAPI,
                fields: [
                    {
                        fieldName: 'FUNCTION_TYPE',
                        label: 'Function Type',
                        defaultValue: 'REST',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'URL',
                        label: 'URL',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'HTTP_METHOD',
                        label: 'Http Method',
                        defaultValue: 'POST',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'GET',
                                    value: 'GET',
                                },
                                {
                                    display: 'POST',
                                    value: 'POST',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'CONTENT_TYPE',
                        label: 'POST Message Body',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: '',
                                    value: '',
                                },
                                {
                                    display: 'json',
                                    value: 'json',
                                },
                                {
                                    display: 'x-www-form-urlencoded',
                                    value: 'x-www-form-urlencoded',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'FUNCTION_NAME',
                        label: 'Function Name (metadata)',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'FUNCTION_DESCRIPTION',
                        label: 'Function Description (metadata)',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'parameters',
                        label: 'Function Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'requiredParameters',
                        label: 'Function Required Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                ],
            },
        ],
        'File Uploads': [
            {
                name: 'ZIP',
                disable: false,
                icon: ZIP,
                fields: [
                    {
                        fieldName: 'ZIP',
                        label: 'Zip File',
                        defaultValue: null,
                        options: {
                            component: 'file-upload',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                ],
            },
        ],
    },
    VECTOR: {
        Connections: [
            {
                name: 'FAISS',
                disable: false,
                icon: META,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VECTOR_TYPE',
                        label: 'Type',
                        defaultValue: 'FAISS',
                        options: {
                            component: 'text-field',
                        },
                        hidden: true,
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'Connection URL',
                        hidden: true,
                        defaultValue: '@BaseFolder@/vector/@ENGINE@/',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    // {
                    //     fieldName: 'ENCODER_NAME',
                    //     label: 'Encoder Name',
                    //     defaultValue: '',
                    //     options: {
                    //         component: 'text-field',
                    //     },
                    //     disabled: false,
                    //     rules: { required: true },
                    // },
                    // {
                    //     fieldName: 'ENCODER_TYPE',
                    //     label: 'Encoder Type',
                    //     defaultValue: '',
                    //     options: {
                    //         component: 'text-field',
                    //     },
                    //     disabled: false,
                    //     rules: { required: true },
                    // },
                    // {
                    //     fieldName: 'ENCODER_API_KEY',
                    //     label: 'Encoder API Key',
                    //     defaultValue: '',
                    //     options: {
                    //         component: 'text-field',
                    //     },
                    //     disabled: false,
                    //     rules: { required: true },
                    // },
                    // {
                    //     fieldName: 'TEST_FIELD',
                    //     label: 'TEST FIELD WITH OPTION REACTOR PARAMS',
                    //     defaultValue: '',
                    //     options: {
                    //         component: 'select',
                    //         options: [],
                    //         pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "<NAME>" }] , engineTypes = [ 'MODEL' ] ) ;`,
                    //     },
                    //     disabled: false,
                    //     rules: { required: true },
                    //     helperText: 'Test',
                    // },
                    // {
                    //     fieldName: 'RAM',
                    //     label: 'TEST ADVANCED FIELD WITH OPTION PARAMS',
                    //     defaultValue: '',
                    //     options: {
                    //         component: 'select',
                    //         options: [],
                    //         pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "<EMBEDDER_ENGINE_ID>" }] , engineTypes = [ 'MODEL' ] ) ;`,
                    //     },
                    //     advanced: true,
                    //     disabled: false,
                    //     rules: { required: true },
                    //     helperText: 'Test',
                    // },
                    {
                        fieldName: 'EMBEDDER_ENGINE_ID',
                        label: 'Embedder',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [],
                            pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
                        },
                        disabled: false,
                        rules: { required: true },
                        helperText:
                            'The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.',
                    },
                    {
                        fieldName: 'CONTENT_LENGTH',
                        label: 'Content Length',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                        helperText:
                            "The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
                        pixel: `GetModelMaxTokenLength ( engine = "<EMBEDDER_ENGINE_ID>") ;`,
                    },
                    {
                        fieldName: 'CONTENT_OVERLAP',
                        label: 'Content Overlap',
                        defaultValue: '0',
                        options: {
                            component: 'text-field',
                            options: [],
                        },
                        disabled: false,
                        rules: { required: true },
                        helperText:
                            'The number of tokens from prior chunks that are carried over into the current chunk when processing content.',
                    },
                    {
                        fieldName: 'DISTANCE_METHOD',
                        label: 'Distance Method',
                        defaultValue: 'cosine similarity',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Squared Euclidean (L2) distance',
                                    value: 'Squared Euclidean (L2) distance',
                                },
                                {
                                    display: 'cosine similarity',
                                    value: 'cosine similarity',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: false },
                        advanced: true,
                        helperText: '',
                    },
                    {
                        fieldName: 'EMBEDDINGS',
                        label: 'Embeddings',
                        defaultValue: null,
                        options: {
                            component: 'file-upload',
                        },
                        disabled: true,
                        secondary: true,
                        rules: {},
                    },
                ],
            },
            {
                name: 'Weaviate',
                disable: true,
                icon: WEVIATE,
                fields: [],
            },
            {
                name: 'Pinecone',
                disable: true,
                icon: PINECONE,
                fields: [],
            },
            {
                name: 'pgvector',
                disable: true,
                icon: POSTGRES,
                fields: [],
            },
        ],
        'File Uploads': [
            {
                name: 'ZIP',
                disable: false,
                icon: ZIP,
                fields: [
                    {
                        fieldName: 'ZIP',
                        label: 'Zip File',
                        defaultValue: null,
                        options: {
                            component: 'file-upload',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                ],
            },
        ],
    },
    DATABASE: {
        'File Uploads': [
            {
                name: 'ZIP',
                description: 'Drop a zip file',
                disable: false,
                icon: ZIP,
                fields: [
                    {
                        fieldName: 'ZIP',
                        label: 'Zip File',
                        defaultValue: null,
                        options: {
                            component: 'file-upload',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                ],
            },
            {
                name: 'CSV',
                disable: true,
                icon: CSV,
                fields: [],
            },
            {
                name: 'Excel',
                disable: true,
                icon: EXCEL,
                fields: [],
            },
            {
                name: 'TSV',
                disable: true,
                icon: TSV,
                fields: [],
            },
            {
                name: 'SQLite',
                disable: true,
                icon: SQLITE,
                fields: [],
            },
            {
                name: 'H2',
                disable: true,
                icon: H2_DB,
                fields: [],
            },
            {
                name: 'Neo4J',
                disable: true,
                icon: NEO4J,
                fields: [],
            },
            {
                name: 'Tinker',
                disable: true,
                icon: TINKER,
                fields: [],
            },
        ],
        Connections: [
            {
                name: 'Aster',
                disable: false,
                icon: ASTER,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'ASTER_DB',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },
            {
                name: 'Athena',
                disable: false,
                icon: ATHENA,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'ATHENA',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'region',
                        label: 'Region',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'accessKey',
                        label: 'Access Key',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'secretKey',
                        label: 'Secret Key',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'output',
                        label: 'Output',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },
            {
                name: 'BigQuery',
                disable: false,
                icon: BIGQUERY,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'BIG_QUERY',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: 'https://www.googleapis.com/bigquery/v2',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'projectId',
                        label: 'Project',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'oauthType',
                        label: 'OAuth Type',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'oauthServiceAcctEmail',
                        label: 'OAuth Service Account',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'oauthPvtKeyPath',
                        label: 'OAuth Service Account Key',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                ],
            },
            {
                name: 'Cassandra',
                disable: false,
                icon: CASSANDRA,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'CASSANDRA',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '9042',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },
            {
                name: 'Clickhouse',
                disable: false,
                icon: CLICKHOUSE,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'CLICKHOUSE',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '9042',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'database',
                        label: 'Database',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },
            {
                name: 'DATABRICKS',
                disable: false,
                icon: DATABRICKS,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'DATABRICKS',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'httpPAth',
                        label: 'HTTP Path',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'UID',
                        label: 'UID',
                        defaultValue: 'token',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'PWD',
                        label: 'Personal Access Token',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'database',
                        label: 'Database',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },
            {
                name: 'DataStax',
                disable: true,
                icon: DATASTAX,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'DATASTAX',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'graph',
                        label: 'GRAPH',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: 'token',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: 'token',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                ],
            },
            {
                name: 'DB2',
                disable: false,
                icon: DB2,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'DB2',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '446',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    }, // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },

            {
                name: 'Derby',
                disable: false,
                icon: DERBY,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'DERBY',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '1527',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },

            {
                name: 'Elastic Search',
                disable: false,
                icon: ELASTIC_SEARCH,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'ELASTIC_SEARCH',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '9200',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'httpType',
                        label: 'HTTP Type',
                        defaultValue: 'https',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                ],
            },
            {
                name: 'H2',
                disable: false,
                icon: H2_DB,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'HIVE',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '1000',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },

            {
                name: 'Hive',
                disable: false,
                icon: HIVE,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'HIVE',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '1000',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },

            {
                name: 'Impala',
                disable: false,
                icon: IMPALA,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'IMPALA',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '21050',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },
            {
                name: 'MariaDB',
                disable: false,
                icon: MARIA_DB,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'MARIA_DB',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '3306',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },
            {
                name: 'MySQL',
                disable: false,
                icon: MYSQL,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'MYSQL',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '3306',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },
            {
                name: 'Open Search',
                disable: false,
                icon: OPEN_SEARCH,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'OPEN_SEARCH',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '9200',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'httpPath',
                        label: 'HTTP Path',
                        defaultValue: 'https',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                ],
            },
            {
                name: 'Oracle',
                disable: false,
                icon: ORACLE,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'ORACLE',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'service',
                        label: 'SID Service',
                        defaultValue: '1521',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },
            {
                name: 'Phoenix',
                disable: false,
                icon: PHOENIX,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'PHOENIX',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '8765',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },
            {
                name: 'Postgres',
                disable: false,
                icon: POSTGRES,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'POSTGRES',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '5432',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'database',
                        label: 'Database',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: 'dbo',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },
            {
                name: 'Redshift',
                disable: false,
                icon: REDSHIFT,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'REDSHIFT',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '5439',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'database',
                        label: 'Database',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },
            {
                name: 'SAP Hana',
                disable: false,
                icon: SAP_HANA,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'SAP_HANA',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '30015',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },
            {
                name: 'SEMOSS',
                disable: false,
                icon: SEMOSS,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'SEMOSS',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '443',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'project',
                        label: 'Project Id',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'insight',
                        label: 'Insight Id',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'endpoint',
                        label: 'Endpoint',
                        defaultValue: 'Monolith',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'protocol',
                        label: 'Protocol',
                        defaultValue: 'https',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'sub_url',
                        label: 'Sub URL',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },
            {
                name: 'Snowflake',
                disable: false,
                icon: SNOWFLAKE,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'SNOWFLAKE',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '443',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'warehouse',
                        label: 'Warehouse',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'role',
                        label: 'Role',
                        defaultValue: 'PUBLIC',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'database',
                        label: 'Database',
                        defaultValue: '443',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },

                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },
            {
                name: 'SQL Server',
                disable: false,
                icon: SQL_SERVER,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'SQL_SERVER',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '1433',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'database',
                        label: 'Database',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: 'dbo',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },

            {
                name: 'SQLITE',
                disable: false,
                icon: SQLITE,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'SQLITE',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '1000',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },
            {
                name: 'Teradata',
                disable: false,
                icon: TERADATA,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'TERADATA',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'database',
                        label: 'Database',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },
            {
                name: 'Tibco',
                disable: false,
                icon: TIBCO,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'TIBCO',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '1433',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },
            {
                name: 'Trino',
                disable: false,
                icon: TRINO,
                fields: [
                    {
                        fieldName: 'dbDriver',
                        label: 'Driver Name',
                        defaultValue: 'TRINO',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                        hidden: true,
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Database Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DATABASE_DESCRIPTION',
                        label: 'Database Description',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'DATABASE_TAGS',
                        label: 'Tags',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'hostname',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'port',
                        label: 'Port',
                        defaultValue: '1433',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'catalog',
                        label: 'Catalog',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'additional',
                        label: 'Additional Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'JDBC Url',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    // ADVANCED
                    {
                        fieldName: 'FETCH_SIZE',
                        label: 'Fetch Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_TIMEOUT',
                        label: 'Connection Timeout',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'CONNECTION_POOLING',
                        label: 'Use Connection Pooling',
                        defaultValue: false,
                        rules: { required: false },
                        options: {
                            component: 'checkbox',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MIN_SIZE',
                        label: 'Pool Min Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                    {
                        fieldName: 'POOL_MAX_SIZE',
                        label: 'Pool Max Size',
                        defaultValue: '',
                        rules: { required: false, min: 0 },
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        advanced: true,
                    },
                ],
            },
        ],
    },
    STORAGE: {
        Storage: [
            {
                name: 'Amazon S3',
                disable: false,
                icon: AMAZON_S3,
                fields: [
                    {
                        fieldName: 'STORAGE_TYPE',
                        label: 'Storage Type',
                        defaultValue: 'AMAZON_S3',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'S3_REGION',
                        label: 'Region',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'S3_ACCESS_KEY',
                        label: 'Access Key',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'S3_SECRET_KEY',
                        label: 'Secret Key',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                ],
            },
            {
                name: 'CEPH',
                disable: false,
                icon: CEPH,
                fields: [
                    {
                        fieldName: 'STORAGE_TYPE',
                        label: 'Storage Type',
                        defaultValue: 'CEPH',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'CEPH_ACCESS_KEY',
                        label: 'Access Key',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'CEPH_SECRET_KEY',
                        label: 'Secret Key',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'CEPH_ENDPOINT',
                        label: 'Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'CEPH_BUCKET',
                        label: 'Root Bucket Path',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                ],
            },
            {
                name: 'Dreamhost',
                disable: true,
                icon: DREAMHOST,
                fields: [
                    {
                        fieldName: 'STORAGE_TYPE',
                        label: 'Storage Type',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'S3_REGION',
                        label: 'S3 Region',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'S3_ACCESS_KEY',
                        label: 'S3 Access Key',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'S3_SECRET_KEY',
                        label: 'S3 Secret Key',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'S3_ENDPOINT',
                        label: 'S3 Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                ],
            },
            {
                name: 'Dropbox',
                disable: false,
                icon: DROPBOX,
                fields: [
                    {
                        fieldName: 'STORAGE_TYPE',
                        label: 'Storage Type',
                        defaultValue: 'DROPBOX',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'S3_REGION',
                        label: 'S3 Region',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'S3_ACCESS_KEY',
                        label: 'S3 Access Key',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'S3_SECRET_KEY',
                        label: 'S3 Secret Key',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'S3_ENDPOINT',
                        label: 'S3 Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                ],
            },
            {
                name: 'Google Cloud',
                disable: false,
                icon: GOOGLE_CLOUD,
                fields: [
                    {
                        fieldName: 'STORAGE_TYPE',
                        label: 'Storage Type',
                        defaultValue: 'GOOGLE_CLOUD_STORAGE',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'GCS_REGION',
                        label: 'Region',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'GCS_SERVICE_ACCOUNT_FILE',
                        label: 'Service Account File',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'GCS_BUCKET',
                        label: 'Bucket',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                ],
            },
            {
                name: 'Google Drive',
                disable: true,
                icon: GOOGLE_DRIVE,
                fields: [],
            },
            {
                name: 'Microsoft Azure Blob Storage',
                disable: false,
                icon: AZURE_BLOB,
                fields: [
                    {
                        fieldName: 'STORAGE_TYPE',
                        label: 'Storage Type',
                        defaultValue: 'MICROSOFT_AZURE_BLOB_STORAGE',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'AZ_ACCOUNT_NAME',
                        label: 'Account Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'AZ_PRIMARY_KEY',
                        label: 'Primary Key',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'AZ_CONN_STRING',
                        label: 'Connection String',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'AZ_GENERATE_DYNAMIC_SAS',
                        label: 'Generate Dynamic SAS',
                        defaultValue: 'false',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                ],
            },
            {
                name: 'Microsoft OneDrive',
                disable: true,
                icon: ONEDRIVE,
                fields: [
                    {
                        fieldName: 'STORAGE_TYPE',
                        label: 'Storage Type',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'S3_REGION',
                        label: 'S3 Region',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'S3_ACCESS_KEY',
                        label: 'S3 Access Key',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'S3_SECRET_KEY',
                        label: 'S3 Secret Key',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'S3_ENDPOINT',
                        label: 'S3 Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                ],
            },
            {
                name: 'MINIO',
                disable: false,
                icon: MINIO,
                fields: [
                    {
                        fieldName: 'STORAGE_TYPE',
                        label: 'Storage Type',
                        defaultValue: 'MINIO',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MINIO_REGION',
                        label: 'Region',
                        defaultValue: 'us-east-1',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MINIO_ACCESS_KEY',
                        label: 'Access Key',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MINIO_SECRET_KEY',
                        label: 'Secret Key',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MINIO_ENDPOINT',
                        label: 'Endpoint',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MINIO_BUCKET',
                        label: 'Root Bucket Path',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                ],
            },
            {
                name: 'SFTP',
                disable: false,
                icon: SFTP,
                fields: [
                    {
                        fieldName: 'STORAGE_TYPE',
                        label: 'Storage Type',
                        defaultValue: 'SFTP',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'HOSTNAME',
                        label: 'Host',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'PORT',
                        label: 'Port',
                        defaultValue: '22',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'USERNAME',
                        label: 'Username',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                ],
            },
        ],
        'File Uploads': [
            {
                name: 'ZIP',
                disable: false,
                icon: ZIP,
                fields: [
                    {
                        fieldName: 'ZIP',
                        label: 'Zip File',
                        defaultValue: null,
                        options: {
                            component: 'file-upload',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                ],
            },
        ],
    },
};
