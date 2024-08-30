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
import AZURE_BLOB from '@/assets/img/AZURE_BLOB.png';
import CEPH from '@/assets/img/CEPH.png';
import DREAMHOST from '@/assets/img/DREAMHOST.png';
import DROPBOX from '@/assets/img/dropbox.png';
import GOOGLE_CLOUD from '@/assets/img/GOOGLE_CLOUD_STORAGE.png';
import GOOGLE_DRIVE from '@/assets/img/GOOGLE_DRIVE.png';
import LOCAL_FILE_SYSTEM from '@/assets/img/LOCAL_FILE_SYSTEM.png';
import MINIO from '@/assets/img/MINIO.png';
import NETWORK_FILE_SYSTEM from '@/assets/img/NETWORK_FILE_SYSTEM.png';
import ONEDRIVE from '@/assets/img/ONEDRIVE.png';
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
import RESTAPI from '@/assets/img/rest-api.svg';
//Vector
import CHROMADB from '@/assets/img/CHROMADB.png';
import PINECONE from '@/assets/img/PINECONE.png';
import WEVIATE from '@/assets/img/WEVIATE.png';

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
        'Commercially Hosted': {
            OpenAI: [
                {
                    name: 'GPT-3.5',
                    disable: false,
                    icon: OPEN_AI,
                    fields: [
                        {
                            fieldName: 'NAME',
                            label: 'Catalog Name',
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
                            defaultValue: 'gpt-3.5-turbo',
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
                            disabled: true,
                            hidden: true,
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
                            fieldName: 'CHAT_TYPE',
                            label: 'Chat Type',
                            defaultValue: 'chat-completion',
                            options: {
                                component: 'select',
                                options: [
                                    {
                                        display: 'chat-completion',
                                        value: 'chat-completion',
                                    },
                                    {
                                        display: 'completion',
                                        value: 'completion',
                                    },
                                ],
                            },
                            disabled: false,
                            rules: { required: true },
                        },
                        {
                            fieldName: 'INIT_MODEL_ENGINE',
                            label: 'Init Script',
                            defaultValue:
                                "import genai_client;${VAR_NAME} = genai_client.OpenAiClient(model_name = '${MODEL}', api_key = '${OPEN_AI_KEY}', chat_type = '${CHAT_TYPE}')",
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
                    name: 'GPT-4',
                    disable: false,
                    icon: OPEN_AI,
                    fields: [
                        {
                            fieldName: 'NAME',
                            label: 'Catalog Name',
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
                            defaultValue: 'gpt-4-32k',
                            options: {
                                component: 'select',
                                options: [
                                    {
                                        display: 'gpt-4-32k',
                                        value: 'gpt-4-32k',
                                    },
                                ],
                            },
                            disabled: true,
                            hidden: true,
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
                            fieldName: 'CHAT_TYPE',
                            label: 'Chat Type',
                            defaultValue: 'chat-completion',
                            options: {
                                component: 'select',
                                options: [
                                    {
                                        display: 'chat-completion',
                                        value: 'chat-completion',
                                    },
                                    {
                                        display: 'completion',
                                        value: 'completion',
                                    },
                                ],
                            },
                            disabled: false,
                            rules: { required: true },
                        },
                        {
                            fieldName: 'INIT_MODEL_ENGINE',
                            label: 'Init Script',
                            defaultValue:
                                "import genai_client;${VAR_NAME} = genai_client.OpenAiClient(model_name = '${MODEL}', api_key = '${OPEN_AI_KEY}', chat_type = '${CHAT_TYPE}')",
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
                    name: 'Text-Davinci',
                    disable: false,
                    icon: OPEN_AI,
                    fields: [
                        {
                            fieldName: 'NAME',
                            label: 'Catalog Name',
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
                            defaultValue: 'text-davinci',
                            options: {
                                component: 'select',
                                options: [
                                    {
                                        display: 'text-davinci',
                                        value: 'text-davinci',
                                    },
                                ],
                            },
                            disabled: true,
                            hidden: true,
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
                            defaultValue:
                                "from genai_client import OpenAiEmbedder;${VAR_NAME} = OpenAiEmbedder(model_name = '${MODEL}', api_key = '${OPEN_AI_KEY}')",
                            options: {
                                component: 'text-field',
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
                    name: 'DALL E',
                    disable: false,
                    icon: OPEN_AI,
                    fields: [
                        {
                            fieldName: 'NAME',
                            label: 'Catalog Name',
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
                            defaultValue: 'dall e',
                            options: {
                                component: 'select',
                                options: [
                                    {
                                        display: 'dall e',
                                        value: 'dall e',
                                    },
                                ],
                            },
                            disabled: true,
                            hidden: true,
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
                            fieldName: 'CHAT_TYPE',
                            label: 'Chat Type',
                            defaultValue: 'chat-completion',
                            options: {
                                component: 'select',
                                options: [
                                    {
                                        display: 'chat-completion',
                                        value: 'chat-completion',
                                    },
                                    {
                                        display: 'completion',
                                        value: 'completion',
                                    },
                                ],
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
            Azure: [
                {
                    name: 'Azure Open AI',
                    disable: false,
                    icon: AZURE_OPEN_AI,
                    fields: [
                        {
                            fieldName: 'NAME',
                            label: 'Catalog Name',
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
                            fieldName: 'CHAT_TYPE',
                            label: 'Chat Type',
                            defaultValue: 'chat-completion',
                            options: {
                                component: 'select',
                                options: [
                                    {
                                        display: 'chat-completion',
                                        value: 'chat-completion',
                                    },
                                    {
                                        display: 'completion',
                                        value: 'completion',
                                    },
                                ],
                            },
                            disabled: false,
                            rules: { required: true },
                        },
                        {
                            fieldName: 'INIT_MODEL_ENGINE',
                            label: 'Init Script',
                            defaultValue:
                                "import genai_client;${VAR_NAME} = genai_client.AzureOpenAiClient(api_key = '${OPEN_AI_KEY}', endpoint = '${ENDPOINT}', model_name = '${MODEL}', chat_type = '${CHAT_TYPE}')",
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
            'AWS Bedrock': [
                {
                    name: 'Claude',
                    disable: false,
                    icon: CLAUDE,
                    fields: [
                        {
                            fieldName: 'NAME',
                            label: 'Catalog Name',
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
                            disabled: false,
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
                            fieldName: 'CHAT_TYPE',
                            label: 'Chat Type',
                            defaultValue: 'chat-completion',
                            options: {
                                component: 'select',
                                options: [
                                    {
                                        display: 'chat-completion',
                                        value: 'chat-completion',
                                    },
                                    {
                                        display: 'completion',
                                        value: 'completion',
                                    },
                                ],
                            },
                            disabled: false,
                            rules: { required: true },
                        },
                        {
                            fieldName: 'INIT_MODEL_ENGINE',
                            label: 'Init Script',
                            defaultValue:
                                "import genai_client;${VAR_NAME} = genai_client.BedrockClient(modelId = '${MODEL}', secret_key = '${AWS_SECRET_KEY}', access_key = '${AWS_ACCESS_KEY}', region='${AWS_REGION}')",
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
            'Google GCP': [
                {
                    name: 'Palm Bison',
                    disable: false,
                    icon: VERTEX,
                    fields: [
                        {
                            fieldName: 'NAME',
                            label: 'Catalog Name',
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
                            disabled: true,
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
                            fieldName: 'CHAT_TYPE',
                            label: 'Chat Type',
                            defaultValue: 'text',
                            options: {
                                component: 'select',
                                options: [
                                    {
                                        display: 'chat',
                                        value: 'chat',
                                    },
                                    {
                                        display: 'code',
                                        value: 'code',
                                    },
                                    {
                                        display: 'codechat',
                                        value: 'codechat',
                                    },
                                    {
                                        display: 'generative',
                                        value: 'generative',
                                    },
                                    {
                                        display: 'text',
                                        value: 'text',
                                    },
                                ],
                            },
                            disabled: false,
                            rules: { required: true },
                        },
                        {
                            fieldName: 'INIT_MODEL_ENGINE',
                            label: 'Init Script',
                            defaultValue:
                                "import genai_client;${VAR_NAME} = genai_client.VertexClient(model_name = '${MODEL}', service_account_key_file = '${SERVICE_ACCOUNT_FILE}', region='${GCP_REGION}', chat_type='${CHAT_TYPE}')",
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
                    name: 'Palm Chat Bison',
                    disable: false,
                    icon: VERTEX,
                    fields: [
                        {
                            fieldName: 'NAME',
                            label: 'Catalog Name',
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
                            disabled: true,
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
                            fieldName: 'CHAT_TYPE',
                            label: 'Chat Type',
                            defaultValue: 'text',
                            options: {
                                component: 'select',
                                options: [
                                    {
                                        display: 'chat',
                                        value: 'chat',
                                    },
                                    {
                                        display: 'code',
                                        value: 'code',
                                    },
                                    {
                                        display: 'codechat',
                                        value: 'codechat',
                                    },
                                    {
                                        display: 'generative',
                                        value: 'generative',
                                    },
                                    {
                                        display: 'text',
                                        value: 'text',
                                    },
                                ],
                            },
                            disabled: false,
                            rules: { required: true },
                        },
                        {
                            fieldName: 'INIT_MODEL_ENGINE',
                            label: 'Init Script',
                            defaultValue:
                                "import genai_client;${VAR_NAME} = genai_client.VertexClient(model_name = '${MODEL}', service_account_key_file = '${SERVICE_ACCOUNT_FILE}', region='${GCP_REGION}', chat_type='${CHAT_TYPE}')",
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
                    name: 'Palm Code Bison',
                    disable: false,
                    icon: VERTEX,
                    fields: [
                        {
                            fieldName: 'NAME',
                            label: 'Catalog Name',
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
                            disabled: true,
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
                            fieldName: 'CHAT_TYPE',
                            label: 'Chat Type',
                            defaultValue: 'text',
                            options: {
                                component: 'select',
                                options: [
                                    {
                                        display: 'chat',
                                        value: 'chat',
                                    },
                                    {
                                        display: 'code',
                                        value: 'code',
                                    },
                                    {
                                        display: 'codechat',
                                        value: 'codechat',
                                    },
                                    {
                                        display: 'generative',
                                        value: 'generative',
                                    },
                                    {
                                        display: 'text',
                                        value: 'text',
                                    },
                                ],
                            },
                            disabled: false,
                            rules: { required: true },
                        },
                        {
                            fieldName: 'INIT_MODEL_ENGINE',
                            label: 'Init Script',
                            defaultValue:
                                "import genai_client;${VAR_NAME} = genai_client.VertexClient(model_name = '${MODEL}', service_account_key_file = '${SERVICE_ACCOUNT_FILE}', region='${GCP_REGION}', chat_type='${CHAT_TYPE}')",
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
            'NVIDIA NIM Models': [
                {
                    name: 'embed-qa-4',
                    disable: false,
                    icon: NEMO,
                    fields: [
                        {
                            fieldName: 'NAME',
                            label: 'Catalog Name',
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
                            defaultValue:
                                'mistralai/mixtral-8x7b-instruct-v0.1',
                            options: {
                                component: 'select',
                                options: [
                                    {
                                        display:
                                            'mistralai/mixtral-8x7b-instruct-v0.1',
                                        value: 'mistralai/mixtral-8x7b-instruct-v0.1',
                                    },
                                ],
                            },
                            disabled: true,
                            hidden: true,
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
                            fieldName: 'CHAT_TYPE',
                            label: 'Chat Type',
                            defaultValue: 'chat-completion',
                            options: {
                                component: 'select',
                                options: [
                                    {
                                        display: 'chat-completion',
                                        value: 'chat-completion',
                                    },
                                    {
                                        display: 'completion',
                                        value: 'completion',
                                    },
                                ],
                            },
                            disabled: false,
                            rules: { required: true },
                        },
                        {
                            fieldName: 'INIT_MODEL_ENGINE',
                            label: 'Init Script',
                            defaultValue:
                                "import genai_client;${VAR_NAME} = genai_client.OpenAiClient(endpoint = 'https://integrate.api.nvidia.com/v1', model_name='${MODEL_TYPE}', chat_type = '${CHAT_TYPE}', api_key='${OPEN_AI_KEY}', template={ \"mixtral.default.nocontext\":\"[INST] $question [/INST]\"},  template_name='mixtral.default.nocontext')",
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
                    name: 'rerank-qa-mistral-4b',
                    disable: false,
                    icon: NEMO,
                    fields: [
                        {
                            fieldName: 'NAME',
                            label: 'Catalog Name',
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
                            defaultValue:
                                'mistralai/mixtral-8x7b-instruct-v0.1',
                            options: {
                                component: 'select',
                                options: [
                                    {
                                        display:
                                            'mistralai/mixtral-8x7b-instruct-v0.1',
                                        value: 'mistralai/mixtral-8x7b-instruct-v0.1',
                                    },
                                ],
                            },
                            disabled: true,
                            hidden: true,
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
                            fieldName: 'CHAT_TYPE',
                            label: 'Chat Type',
                            defaultValue: 'chat-completion',
                            options: {
                                component: 'select',
                                options: [
                                    {
                                        display: 'chat-completion',
                                        value: 'chat-completion',
                                    },
                                    {
                                        display: 'completion',
                                        value: 'completion',
                                    },
                                ],
                            },
                            disabled: false,
                            rules: { required: true },
                        },
                        {
                            fieldName: 'INIT_MODEL_ENGINE',
                            label: 'Init Script',
                            defaultValue:
                                "import genai_client;${VAR_NAME} = genai_client.OpenAiClient(endpoint = 'https://integrate.api.nvidia.com/v1', model_name='${MODEL_TYPE}', chat_type = '${CHAT_TYPE}', api_key='${OPEN_AI_KEY}', template={ \"mixtral.default.nocontext\":\"[INST] $question [/INST]\"},  template_name='mixtral.default.nocontext')",
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
        },
        'Locally Hosted': [
            {
                name: 'Bert',
                disable: false,
                icon: BERT,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Catalog Name',
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
                        disabled: false,
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
                        fieldName: 'CHAT_TYPE',
                        label: 'Chat Type',
                        defaultValue: 'chat-completion',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'chat-completion',
                                    value: 'chat-completion',
                                },
                                {
                                    display: 'completion',
                                    value: 'completion',
                                },
                            ],
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
                        label: 'Catalog Name',
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
                        disabled: false,
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
                        fieldName: 'CHAT_TYPE',
                        label: 'Chat Type',
                        defaultValue: 'chat-completion',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'chat-completion',
                                    value: 'chat-completion',
                                },
                                {
                                    display: 'completion',
                                    value: 'completion',
                                },
                            ],
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
                        label: 'Catalog Name',
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
                        disabled: false,
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
                        fieldName: 'CHAT_TYPE',
                        label: 'Chat Type',
                        defaultValue: 'chat-completion',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'chat-completion',
                                    value: 'chat-completion',
                                },
                                {
                                    display: 'completion',
                                    value: 'completion',
                                },
                            ],
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
                        label: 'Catalog Name',
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
                        disabled: false,
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
                        fieldName: 'CHAT_TYPE',
                        label: 'Chat Type',
                        defaultValue: 'chat-completion',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'chat-completion',
                                    value: 'chat-completion',
                                },
                                {
                                    display: 'completion',
                                    value: 'completion',
                                },
                            ],
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
                        label: 'Catalog Name',
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
                        disabled: false,
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
                        fieldName: 'CHAT_TYPE',
                        label: 'Chat Type',
                        defaultValue: 'chat-completion',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'chat-completion',
                                    value: 'chat-completion',
                                },
                                {
                                    display: 'completion',
                                    value: 'completion',
                                },
                            ],
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
                        label: 'Catalog Name',
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
                        disabled: false,
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
                        fieldName: 'CHAT_TYPE',
                        label: 'Chat Type',
                        defaultValue: 'chat-completion',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'chat-completion',
                                    value: 'chat-completion',
                                },
                                {
                                    display: 'completion',
                                    value: 'completion',
                                },
                            ],
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
                        label: 'Catalog Name',
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
                        disabled: false,
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
                        fieldName: 'CHAT_TYPE',
                        label: 'Chat Type',
                        defaultValue: 'chat-completion',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'chat-completion',
                                    value: 'chat-completion',
                                },
                                {
                                    display: 'completion',
                                    value: 'completion',
                                },
                            ],
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
                        label: 'Catalog Name',
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
                        defaultValue: 'meta-llama/Llama-2-7b',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
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
                        fieldName: 'CHAT_TYPE',
                        label: 'Chat Type',
                        defaultValue: 'chat-completion',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'chat-completion',
                                    value: 'chat-completion',
                                },
                                {
                                    display: 'completion',
                                    value: 'completion',
                                },
                            ],
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
                        label: 'Catalog Name',
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
                        defaultValue: 'meta-llama/Llama-2-13b',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
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
                        fieldName: 'CHAT_TYPE',
                        label: 'Chat Type',
                        defaultValue: 'chat-completion',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'chat-completion',
                                    value: 'chat-completion',
                                },
                                {
                                    display: 'completion',
                                    value: 'completion',
                                },
                            ],
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
                        label: 'Catalog Name',
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
                        defaultValue: 'meta-llama/Llama-2-70b',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
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
                        fieldName: 'CHAT_TYPE',
                        label: 'Chat Type',
                        defaultValue: 'chat-completion',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'chat-completion',
                                    value: 'chat-completion',
                                },
                                {
                                    display: 'completion',
                                    value: 'completion',
                                },
                            ],
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
                        label: 'Catalog Name',
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
                        disabled: false,
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
                        fieldName: 'CHAT_TYPE',
                        label: 'Chat Type',
                        defaultValue: 'chat-completion',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'chat-completion',
                                    value: 'chat-completion',
                                },
                                {
                                    display: 'completion',
                                    value: 'completion',
                                },
                            ],
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
            {
                name: 'Replit code model – 3b',
                disable: false,
                icon: REPLIT,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Catalog Name',
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
                        disabled: false,
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
                        fieldName: 'CHAT_TYPE',
                        label: 'Chat Type',
                        defaultValue: 'chat-completion',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'chat-completion',
                                    value: 'chat-completion',
                                },
                                {
                                    display: 'completion',
                                    value: 'completion',
                                },
                            ],
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
                        label: 'Catalog Name',
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
                        disabled: false,
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
                        fieldName: 'CHAT_TYPE',
                        label: 'Chat Type',
                        defaultValue: 'chat-completion',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'chat-completion',
                                    value: 'chat-completion',
                                },
                                {
                                    display: 'completion',
                                    value: 'completion',
                                },
                            ],
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
                        label: 'Catalog Name',
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
                        disabled: false,
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
                        fieldName: 'CHAT_TYPE',
                        label: 'Chat Type',
                        defaultValue: 'chat-completion',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'chat-completion',
                                    value: 'chat-completion',
                                },
                                {
                                    display: 'completion',
                                    value: 'completion',
                                },
                            ],
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
                name: 'Wizard 13B',
                disable: false,
                icon: BRAIN,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Catalog Name',
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
                        disabled: false,
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
                        fieldName: 'CHAT_TYPE',
                        label: 'Chat Type',
                        defaultValue: 'chat-completion',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'chat-completion',
                                    value: 'chat-completion',
                                },
                                {
                                    display: 'completion',
                                    value: 'completion',
                                },
                            ],
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
                        label: 'Catalog Name',
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
                        disabled: false,
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
                        fieldName: 'CHAT_TYPE',
                        label: 'Chat Type',
                        defaultValue: 'chat-completion',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'chat-completion',
                                    value: 'chat-completion',
                                },
                                {
                                    display: 'completion',
                                    value: 'completion',
                                },
                            ],
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
        Embedded: [
            {
                name: 'NeMo',
                disable: true,
                icon: NEMO,
                fields: [],
            },
            {
                name: 'Orca',
                disable: false,
                icon: ORCA,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Catalog Name',
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
                        fieldName: 'CHAT_TYPE',
                        label: 'Chat Type',
                        defaultValue: 'chat-completion',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'chat-completion',
                                    value: 'chat-completion',
                                },
                                {
                                    display: 'completion',
                                    value: 'completion',
                                },
                            ],
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
                        label: 'Catalog Name',
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
                        fieldName: 'CHAT_TYPE',
                        label: 'Chat Type',
                        defaultValue: 'chat-completion',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'chat-completion',
                                    value: 'chat-completion',
                                },
                                {
                                    display: 'completion',
                                    value: 'completion',
                                },
                            ],
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
                        label: 'Catalog Name',
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
                        fieldName: 'CHAT_TYPE',
                        label: 'Chat Type',
                        defaultValue: 'chat-completion',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'chat-completion',
                                    value: 'chat-completion',
                                },
                                {
                                    display: 'completion',
                                    value: 'completion',
                                },
                            ],
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
                        label: 'Catalog Name',
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
                                    display: 'HEAD',
                                    value: 'HEAD',
                                },
                                {
                                    display: 'POST',
                                    value: 'POST',
                                },
                                {
                                    display: 'PUT',
                                    value: 'PUT',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'CONTENT_TYPE',
                        label: 'POST Message Body Type',
                        defaultValue: 'json',
                        options: {
                            component: 'select',
                            options: [
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
                        fieldName: 'HEADERS',
                        label: 'Http Headers',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'FUNCTION_PARAMETERS',
                        label: 'Function Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'FUNCTION_REQUIRED_PARAMETERS',
                        label: 'Function Required Parameters',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
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
                ],
            },
            {
                name: 'AZUREOCR',
                disable: false,
                icon: RESTAPI,
                fields: [
                    {
                        fieldName: 'FUNCTION_TYPE',
                        label: 'Function Type',
                        defaultValue: 'AZUREOCR',
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
                        fieldName: 'API_KEY',
                        label: 'API Key',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
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
                        fieldName: 'requiredParameters',
                        label: 'Function Required Parameters',
                        defaultValue: 'filePath',
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
                name: 'Chroma',
                disable: false,
                icon: CHROMADB,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Catalog Name',
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
                        defaultValue: 'CHROMA',
                        options: {
                            component: 'text-field',
                        },
                        hidden: true,
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'EMBEDDER_ENGINE_ID',
                        label: 'Embedder',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [],
                            pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
                            optionDisplay: 'database_name',
                            optionValue: 'database_id',
                        },
                        disabled: false,
                        rules: { required: true },
                        helperText:
                            'The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.',
                    },
                    {
                        fieldName: 'INDEX_CLASSES',
                        label: 'Index Classes',
                        defaultValue: 'default',
                        options: {
                            component: 'text-field',
                        },
                        hidden: true,
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'CONTENT_LENGTH',
                        label: 'Content Length',
                        defaultValue: '512',
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: true, min: 0 },
                        helperText:
                            "The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
                    },
                    {
                        fieldName: 'CONTENT_OVERLAP',
                        label: 'Content Overlap',
                        defaultValue: '20',
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: true, min: 0 },
                        helperText:
                            'The number of tokens from prior chunks that are carried over into the current chunk when processing content.',
                    },
                    {
                        fieldName: 'HOSTNAME',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'API_KEY',
                        label: 'API Key',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                    },
                    {
                        fieldName: 'CHROMA_COLLECTION_NAME',
                        label: 'Collection Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
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
                    {
                        fieldName: 'DISTANCE_METHOD',
                        label: 'Distance Method',
                        defaultValue: 'cosine',
                        options: {
                            component: 'select',
                            options: [
                                {
                                    display: 'Cosine similarity',
                                    value: 'cosine',
                                },
                                {
                                    display: 'Squared L2',
                                    value: 'l2',
                                },
                                {
                                    display: 'Inner product',
                                    value: 'ip',
                                },
                            ],
                        },
                        disabled: false,
                        rules: { required: false },
                        advanced: true,
                        helperText: '',
                    },
                ],
            },
            {
                name: 'FAISS',
                disable: false,
                icon: META,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Catalog Name',
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
                        fieldName: 'EMBEDDER_ENGINE_ID',
                        label: 'Embedder',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [],
                            pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
                            optionDisplay: 'database_name',
                            optionValue: 'database_id',
                        },
                        disabled: false,
                        rules: { required: true },
                        helperText:
                            'The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.',
                    },
                    {
                        fieldName: 'INDEX_CLASSES',
                        label: 'Index Classes',
                        defaultValue: 'default',
                        options: {
                            component: 'text-field',
                        },
                        hidden: true,
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'CONTENT_LENGTH',
                        label: 'Content Length',
                        defaultValue: '512',
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: true, min: 0 },
                        helperText:
                            "The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
                    },
                    {
                        fieldName: 'CONTENT_OVERLAP',
                        label: 'Content Overlap',
                        defaultValue: '20',
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: true, min: 0 },
                        helperText:
                            'The number of tokens from prior chunks that are carried over into the current chunk when processing content.',
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
                    {
                        fieldName: 'DISTANCE_METHOD',
                        label: 'Distance Method',
                        defaultValue: 'Squared Euclidean (L2) distance',
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
                ],
            },
            {
                name: 'PGVector',
                disable: false,
                icon: POSTGRES,
                fields: [
                    {
                        fieldName: 'VECTOR_TYPE',
                        label: 'Type',
                        defaultValue: 'PGVECTOR',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        hidden: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'RDBMS_TYPE',
                        label: 'Driver Name',
                        defaultValue: 'POSTGRES',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        hidden: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Catalog Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
                    },
                    {
                        fieldName: 'database',
                        label: 'Database',
                        defaultValue: 'postgres',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: 'public',
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
                    {
                        fieldName: 'EMBEDDER_ENGINE_ID',
                        label: 'Embedder',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [],
                            pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
                            optionDisplay: 'database_name',
                            optionValue: 'database_id',
                        },
                        disabled: false,
                        rules: { required: true },
                        helperText:
                            'The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.',
                    },
                    {
                        fieldName: 'PGVECTOR_TABLE_NAME',
                        label: 'PGVector Table Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'CONTENT_LENGTH',
                        label: 'Content Length',
                        defaultValue: '512',
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: true, min: 0 },
                        helperText:
                            "The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
                    },
                    {
                        fieldName: 'CONTENT_OVERLAP',
                        label: 'Content Overlap',
                        defaultValue: '20',
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: true, min: 0 },
                        helperText:
                            'The number of tokens from prior chunks that are carried over into the current chunk when processing content.',
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
                    {
                        fieldName: 'DISTANCE_METHOD',
                        label: 'Distance Method',
                        defaultValue: 'Squared Euclidean (L2) distance',
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
                name: 'Pinecone',
                disable: false,
                icon: PINECONE,
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
                        defaultValue: 'PINECONE',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        hidden: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'EMBEDDER_ENGINE_ID',
                        label: 'Embedder',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [],
                            pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
                            optionDisplay: 'database_name',
                            optionValue: 'database_id',
                        },
                        disabled: false,
                        rules: { required: true },
                        helperText:
                            'The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.',
                    },
                    {
                        fieldName: 'INDEX_CLASSES',
                        label: 'Index Classes',
                        defaultValue: 'default',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        hidden: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'CONTENT_LENGTH',
                        label: 'Content Length',
                        defaultValue: '512',
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: true, min: 0 },
                        helperText:
                            "The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
                    },
                    {
                        fieldName: 'CONTENT_OVERLAP',
                        label: 'Content Overlap',
                        defaultValue: '20',
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: true, min: 0 },
                        helperText:
                            'The number of tokens from prior chunks that are carried over into the current chunk when processing content.',
                    },
                    {
                        fieldName: 'HOSTNAME',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'API_KEY',
                        label: 'API Key',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAMESPACE',
                        label: 'Namespace',
                        defaultValue: null,
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'VECTORS',
                        label: 'Vector',
                        defaultValue: null,
                        options: {
                            component: 'text-field',
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
                    {
                        fieldName: 'DISTANCE_METHOD',
                        label: 'Distance Method',
                        defaultValue: 'Squared Euclidean (L2) distance',
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
                        fieldName: 'AZUREOCRENGINEID',
                        label: 'AZURE OCR Function Engine Id',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                        advanced: true,
                    }
                ],
            },
            {
                name: 'Open Search',
                disable: false,
                icon: OPEN_SEARCH,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Catalog Name',
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
                        defaultValue: 'OPEN_SEARCH',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        hidden: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'EMBEDDER_ENGINE_ID',
                        label: 'Embedder',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [],
                            pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
                            optionDisplay: 'database_name',
                            optionValue: 'database_id',
                        },
                        disabled: false,
                        rules: { required: true },
                        helperText:
                            'The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.',
                    },
                    {
                        fieldName: 'INDEX_CLASSES',
                        label: 'Index Classes',
                        defaultValue: 'default',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        hidden: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'CONTENT_LENGTH',
                        label: 'Content Length',
                        defaultValue: '512',
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: true, min: 0 },
                        helperText:
                            "The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
                    },
                    {
                        fieldName: 'CONTENT_OVERLAP',
                        label: 'Content Overlap',
                        defaultValue: '20',
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: true, min: 0 },
                        helperText:
                            'The number of tokens from prior chunks that are carried over into the current chunk when processing content.',
                    },
                    {
                        fieldName: 'HOSTNAME',
                        label: 'Host Name',
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
                        rules: { required: true },
                    },
                    {
                        fieldName: 'PASSWORD',
                        label: 'Password',
                        defaultValue: '',
                        options: {
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'INDEX_NAME',
                        label: 'Index Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'DIMENSION_SIZE',
                        label: 'Embedding Dimension Size',
                        defaultValue: '1024',
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: true, min: 0 },
                    },
                    {
                        fieldName: 'METHOD_NAME',
                        label: 'Method Name',
                        defaultValue: 'hnsw',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                        advanced: true,
                    },
                    {
                        fieldName: 'SPACE_TYPE',
                        label: 'Space Type',
                        defaultValue: 'l2',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                        advanced: true,
                    },
                    {
                        fieldName: 'INDEX_ENGINE',
                        label: 'Index Engine',
                        defaultValue: 'lucene',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                        advanced: true,
                    },
                    {
                        fieldName: 'EF_CONSTRUCTION',
                        label: 'EF Construction',
                        defaultValue: '128',
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: true, min: 0 },
                        advanced: true,
                    },
                    {
                        fieldName: 'M_VALUE',
                        label: 'M Value',
                        defaultValue: '24',
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: true, min: 0 },
                        advanced: true,
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
                disable: false,
                icon: WEVIATE,
                fields: [
                    {
                        fieldName: 'NAME',
                        label: 'Catalog Name',
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
                        defaultValue: 'WEAVIATE',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        hidden: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'EMBEDDER_ENGINE_ID',
                        label: 'Embedder',
                        defaultValue: '',
                        options: {
                            component: 'select',
                            options: [],
                            pixel: `MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "embeddings" }] , engineTypes = [ 'MODEL' ] ) ;`,
                            optionDisplay: 'database_name',
                            optionValue: 'database_id',
                        },
                        disabled: false,
                        rules: { required: true },
                        helperText:
                            'The registered model engine responsible for converting input strings into fixed-size vectors, known as embeddings, capturing semantic information for downstream machine learning and natural language processing tasks.',
                    },
                    {
                        fieldName: 'INDEX_CLASSES',
                        label: 'Index Classes',
                        defaultValue: 'default',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        hidden: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'CONTENT_LENGTH',
                        label: 'Content Length',
                        defaultValue: '512',
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: true, min: 0 },
                        helperText:
                            "The content length represents the upper limit of tokens within a chunk, as determined by the embedder's tokenizer.",
                    },
                    {
                        fieldName: 'CONTENT_OVERLAP',
                        label: 'Content Overlap',
                        defaultValue: '20',
                        options: {
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: true, min: 0 },
                        helperText:
                            'The number of tokens from prior chunks that are carried over into the current chunk when processing content.',
                    },
                    {
                        fieldName: 'DISTANCE_METHOD',
                        label: 'Distance Method',
                        defaultValue: 'Squared Euclidean (L2) distance',
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
                        fieldName: 'HOSTNAME',
                        label: 'Host Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'API_KEY',
                        label: 'API Key',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'WEAVIATE_CLASSNAME',
                        label: 'Weaviate Classname',
                        defaultValue: 'Vector_Table',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'AUTOCUT_DEFAULT',
                        label: 'Autocut default',
                        defaultValue: '1',
                        options: {
                            component: 'text-field',
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
                    {
                        fieldName: 'AZUREOCRENGINEID',
                        label: 'AZURE OCR Function Engine Id',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: false },
                        advanced: true,
                    }
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
                disable: false,
                icon: CSV,
                fields: [
                    // baseUpload
                    // PredictDataTypes
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
                    },
                    {
                        fieldName: 'database',
                        label: 'Database',
                        defaultValue: 'postgres',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'schema',
                        label: 'Schema',
                        defaultValue: 'public',
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: false, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: true, min: 0 },
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
                        fieldName: 'RDBMS_TYPE',
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
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: true, min: 0 },
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
                        hidden: true,
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Catalog Name',
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
                        hidden: true,
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Catalog Name',
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
                        hidden: true,
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Catalog Name',
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
                        hidden: true,
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Catalog Name',
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
                        hidden: true,
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Catalog Name',
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
                name: 'Local File System',
                disable: false,
                icon: LOCAL_FILE_SYSTEM,
                fields: [
                    {
                        fieldName: 'STORAGE_TYPE',
                        label: 'Storage Type',
                        defaultValue: 'LOCAL_FILE_SYSTEM',
                        hidden: true,
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Catalog Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'PATH_PREFIX',
                        label: 'Local Path Prefix',
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
                name: 'Microsoft Azure Blob Storage',
                disable: false,
                icon: AZURE_BLOB,
                fields: [
                    {
                        fieldName: 'STORAGE_TYPE',
                        label: 'Storage Type',
                        defaultValue: 'MICROSOFT_AZURE_BLOB_STORAGE',
                        hidden: true,
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Catalog Name',
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
                        label: 'Catalog Name',
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
                name: 'MinIO',
                disable: false,
                icon: MINIO,
                fields: [
                    {
                        fieldName: 'STORAGE_TYPE',
                        label: 'Storage Type',
                        defaultValue: 'MINIO',
                        hidden: true,
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Catalog Name',
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
                name: 'Network File System',
                disable: false,
                icon: NETWORK_FILE_SYSTEM,
                fields: [
                    {
                        fieldName: 'STORAGE_TYPE',
                        label: 'Storage Type',
                        defaultValue: 'SMB_CIFS',
                        hidden: true,
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Catalog Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NETWORK_DOMAIN',
                        label: 'Network Domain',
                        defaultValue: 'US',
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
                            component: 'password',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'PATH_PREFIX',
                        label: 'Network Path Prefix',
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
                        hidden: true,
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'NAME',
                        label: 'Catalog Name',
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
                            component: 'number',
                        },
                        disabled: false,
                        rules: { required: true, min: 0 },
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

export const ENGINE_IMAGES = {
    MODEL: [
        {
            name: 'OPEN_AI',
            icon: OPEN_AI,
        },
        {
            name: 'GPT-3.5',
            icon: OPEN_AI,
        },
        {
            name: 'GPT-4',
            icon: OPEN_AI,
        },
        {
            name: 'Text-Davinci',
            icon: OPEN_AI,
        },
        {
            name: 'DALL E',
            icon: OPEN_AI,
        },
        {
            name: 'Azure Open AI',

            icon: AZURE_OPEN_AI,
        },
        {
            name: 'Claude',
            icon: CLAUDE,
        },
        {
            name: 'Palm Bison',
            icon: VERTEX,
        },
        {
            name: 'Palm Chat Bison',
            icon: VERTEX,
        },
        {
            name: 'Palm Code Bison',
            icon: VERTEX,
        },
        {
            name: 'Wizard 13B',
            icon: BRAIN,
        },
        {
            name: 'Llama2 7B',
            icon: META,
        },
        {
            name: 'Llama2 13B',
            icon: META,
        },
        {
            name: 'Llama2 70B',
            icon: META,
        },
        {
            name: 'Falcon',
            icon: FALCON,
        },
        {
            name: 'StableBeluga2',
            icon: BRAIN,
        },
        {
            name: 'Guanaco',
            icon: BRAIN,
        },
        {
            name: 'Vicuna',
            icon: VICUNA,
        },
        {
            name: 'Mosaic ML',
            icon: MOSAIC,
        },
        {
            name: 'Dolly',
            icon: DOLLY,
        },
        {
            name: 'Replit code model – 3b',
            icon: REPLIT,
        },
        {
            name: 'Flan T5 Large',
            icon: FLAN,
        },
        {
            name: 'Flan T5 XXL',
            icon: FLAN,
        },
        {
            name: 'Bert',
            icon: BERT,
        },
        {
            name: 'Eleuther GPTJ',
            icon: ELEUTHER,
        },
        {
            name: 'Wizard Coder',
            icon: BRAIN,
        },
        {
            name: 'NeMo',
            icon: NEMO,
        },
        {
            name: 'Orca',
            icon: ORCA,
        },
        {
            name: 'Stablity AI',
            icon: STABILITY_AI,
        },
        {
            name: 'Replit Code Model',
            icon: REPLIT,
        },
        {
            name: 'NeMo',
            icon: NEMO,
        },
        {
            name: 'ZIP',
            icon: ZIP,
        },
    ],
    FUNCTION: [
        {
            name: 'REST',
            icon: RESTAPI,
        },
        {
            name: 'ZIP',
            icon: ZIP,
        },
        {
            name: 'AZUREOCR',
            icon: RESTAPI,
        },
    ],
    VECTOR: [
        {
            name: 'FAISS',
            icon: META,
        },
        {
            name: 'WEAVIATE',
            icon: WEVIATE,
        },
        {
            name: 'PINECONE',
            icon: PINECONE,
        },
        {
            name: 'PGVECTOR',
            icon: POSTGRES,
        },
        {
            name: 'OPEN_SEARCH',
            icon: OPEN_SEARCH,
        },
        {
            name: 'ZIP',
            icon: ZIP,
        },
    ],
    DATABASE: [
        {
            name: 'ZIP',
            icon: ZIP,
        },
        {
            name: 'CSV',
            icon: CSV,
        },
        {
            name: 'EXCEL',
            icon: EXCEL,
        },
        {
            name: 'TSV',
            icon: TSV,
        },
        {
            name: 'SQLITE',
            icon: SQLITE,
        },
        {
            name: 'H2_DB',
            icon: H2_DB,
        },
        {
            name: 'NEO4J',
            icon: NEO4J,
        },
        {
            name: 'TINKER',
            icon: TINKER,
        },
        {
            name: 'ASTER_DB',
            icon: ASTER,
        },
        {
            name: 'ATHENA',
            icon: ATHENA,
        },
        {
            name: 'BIG_QUERY',
            icon: BIGQUERY,
        },
        {
            name: 'CASSANDRA',
            icon: CASSANDRA,
        },
        {
            name: 'CLICKHOUSE',
            icon: CLICKHOUSE,
        },
        {
            name: 'DATABRICKS',
            icon: DATABRICKS,
        },
        {
            name: 'DATASTAX',
            icon: DATASTAX,
        },
        {
            name: 'DB2',
            icon: DB2,
        },
        {
            name: 'DERBY',
            icon: DERBY,
        },
        {
            name: 'ELASTIC_SEARCH',
            icon: ELASTIC_SEARCH,
        },
        {
            name: 'H2',
            icon: H2_DB,
        },
        {
            name: 'HIVE',
            icon: HIVE,
        },
        {
            name: 'IMPALA',
            icon: IMPALA,
        },
        {
            name: 'MARIA_DB',
            icon: MARIA_DB,
        },
        {
            name: 'MYSQL',
            icon: MYSQL,
        },
        {
            name: 'OPEN_SEARCH',
            icon: OPEN_SEARCH,
        },
        {
            name: 'ORACLE',
            icon: ORACLE,
        },
        {
            name: 'PHOENIX',
            icon: PHOENIX,
        },
        {
            name: 'POSTGRES',
            icon: POSTGRES,
        },
        {
            name: 'REDSHIFT',
            icon: REDSHIFT,
        },
        {
            name: 'SAP_HANA',
            icon: SAP_HANA,
        },
        {
            name: 'SEMOSS',
            icon: SEMOSS,
        },
        {
            name: 'SNOWFLAKE',
            icon: SNOWFLAKE,
        },
        {
            name: 'SQL_SERVER',
            icon: SQL_SERVER,
        },
        {
            name: 'SQLITE',
            icon: SQLITE,
        },
        {
            name: 'TERADATA',
            icon: TERADATA,
        },
        {
            name: 'TIBCO',
            icon: TIBCO,
        },
        {
            name: 'TRINO',
            icon: TRINO,
        },
    ],
    STORAGE: [
        {
            name: 'AMAZON_S3',
            icon: AMAZON_S3,
        },
        {
            name: 'CEPH',
            icon: CEPH,
        },
        {
            name: 'DREAMHOST',
            icon: DREAMHOST,
        },
        {
            name: 'DROPBOX',
            icon: DROPBOX,
        },
        {
            name: 'GOOGLE_CLOUD_STORAGE',
            icon: GOOGLE_CLOUD,
        },
        {
            name: 'GOOGLE_DRIVE_STORAGE',
            icon: GOOGLE_DRIVE,
        },
        {
            name: 'LOCAL_FILE_SYSTEM',
            icon: LOCAL_FILE_SYSTEM,
        },
        {
            name: 'MICROSOFT_AZURE_BLOB_STORAGE',
            icon: AZURE_BLOB,
        },
        {
            name: 'MICROSOFT_ONEDRIVE',
            icon: ONEDRIVE,
        },
        {
            name: 'NETWORK_FILE_SYSTEM',
            icon: NETWORK_FILE_SYSTEM,
        },
        {
            name: 'MINIO',
            icon: MINIO,
        },
        {
            name: 'SFTP',
            icon: SFTP,
        },
        {
            name: 'ZIP',
            icon: ZIP,
        },
    ],
};