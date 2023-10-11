//Drag and Drop Data
import CSV from '@/assets/img/CSV.svg';
import EXCEL from '@/assets/img/EXCEL.png';
import TSV from '@/assets/img/TSV.svg';
import SQLITE from '@/assets/img/SQLITE.png';
import H2_DB from '@/assets/img/H2_DB.png';
import NEO4J from '@/assets/img/NEO4J.png';
import TINKER from '@/assets/img/TINKER.png';

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
import SFTP from '@/assets/img/SFTP.png';

//Commercial Models
import OPEN_AI from '@/assets/img/OPEN_AI.png';
import AZURE_OPEN_AI from '@/assets/img/OPEN_AI.png';
import CLAUDE from '@/assets/img/CLAUDE_AI.png';

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

//Embedded Models
import ORCA from '@/assets/img/ORCA.png';
import STABILITY_AI from '@/assets/img/STABILITY_AI.png';
import REPLIT from '@/assets/img/REPLIT_CODE.png';

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
        name: 'Upload Database',
        description: '',
        disabled: true,
        data: 'UPLOAD_DATABASE', // DOES NOT MATTER AT THE MOMENT, Tie this into one DS
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
];

// NEW CONSTRUCT --> EACH ONE WILL NEED A UNIQ ID
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
                ],
            },
            {
                name: 'Claude',
                disable: true,
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
                        fieldName: 'MODEL',
                        label: 'Model',
                        defaultValue: 'Claude',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'MODEL_TYPE',
                        label: 'Type',
                        defaultValue: 'Claude',
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
                ],
            },
            {
                name: 'NeMo',
                disable: true,
                icon: NEMO,
                fields: [],
            },
        ],
    },
    FUNCTION: {
        DEFAULT: [
            {
                name: 'function 1',
                disable: false,
                icon: BRAIN,
                fields: [],
            },
            {
                name: 'function 2',
                disable: true,
                icon: BRAIN,
                fields: [],
            },
        ],
    },
    VECTOR: {
        DEFAULT: [
            {
                name: 'FAISS',
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
                        fieldName: 'VECTOR_TYPE',
                        label: 'Type',
                        defaultValue: 'FAISS',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'CONNECTION_URL',
                        label: 'Connection URL',
                        defaultValue: '@BaseFolder@/vector/@ENGINE@/',
                        options: {
                            component: 'text-field',
                        },
                        disabled: true,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENCODER_NAME',
                        label: 'Encoder Name',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENCODER_TYPE',
                        label: 'Encoder Type',
                        defaultValue: '',
                        options: {
                            component: 'text-field',
                        },
                        disabled: false,
                        rules: { required: true },
                    },
                    {
                        fieldName: 'ENCODER_API_KEY',
                        label: 'Encoder API Key',
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
                name: 'Weaviate',
                disable: true,
                icon: BRAIN,
                fields: [],
            },
            {
                name: 'Pinecone',
                disable: true,
                icon: BRAIN,
                fields: [],
            },
            {
                name: 'pgvector',
                disable: true,
                icon: BRAIN,
                fields: [],
            },
        ],
    },
    DATABASE: {
        'Drag and Drop': [
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
                        fieldName: 'DATABASE_NAME',
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
                name: 'Athena',
                disable: false,
                icon: ATHENA,
                fields: [],
            },
            {
                name: 'BigQuery',
                disable: false,
                icon: BIGQUERY,
                fields: [],
            },
            {
                name: 'Cassandra',
                disable: false,
                icon: CASSANDRA,
                fields: [],
            },
            {
                name: 'Clickhouse',
                disable: false,
                icon: CLICKHOUSE,
                fields: [],
            },

            {
                name: 'DATABRICKS',
                disable: false,
                icon: DATABRICKS,
                fields: [],
            },

            {
                name: 'DataStax',
                disable: false,
                icon: DATASTAX,
                fields: [],
            },
            {
                name: 'DB2',
                disable: false,
                icon: DB2,
                fields: [],
            },

            {
                name: 'Derby',
                disable: false,
                icon: DERBY,
                fields: [],
            },

            {
                name: 'Elastic Search',
                disable: false,
                icon: ELASTIC_SEARCH,
                fields: [],
            },

            {
                name: 'H2',
                disable: true,
                icon: H2_DB,
                fields: [],
            },

            {
                name: 'Hive',
                disable: false,
                icon: HIVE,
                fields: [],
            },

            {
                name: 'Impala',
                disable: false,
                icon: IMPALA,
                fields: [],
            },

            {
                name: 'MariaDB',
                disable: false,
                icon: MARIA_DB,
                fields: [],
            },
            {
                name: 'MySQL',
                disable: false,
                icon: MYSQL,
                fields: [],
            },
            {
                name: 'Open Search',
                disable: false,
                icon: OPEN_SEARCH,
                fields: [],
            },
            {
                name: 'Oracle',
                disable: false,
                icon: ORACLE,
                fields: [],
            },
            {
                name: 'Phoenix',
                disable: false,
                icon: PHOENIX,
                fields: [],
            },
            {
                name: 'Postgres',
                disable: false,
                icon: POSTGRES,
                fields: [],
            },
            {
                name: 'Redshift',
                disable: false,
                icon: REDSHIFT,
                fields: [],
            },
            {
                name: 'SAP Hana',
                disable: false,
                icon: SAP_HANA,
                fields: [],
            },
            {
                name: 'SEMOSS',
                disable: false,
                icon: SEMOSS,
                fields: [],
            },
            {
                name: 'Snowflake',
                disable: false,
                icon: SNOWFLAKE,
                fields: [],
            },
            {
                name: 'SQL Server',
                disable: false,
                icon: SQL_SERVER,
                fields: [
                    {
                        fieldName: 'DATABASE_NAME',
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
                name: 'SQLITE',
                disable: true,
                icon: SQLITE,
                fields: [],
            },
            {
                name: 'Teradata',
                disable: false,
                icon: TERADATA,
                fields: [],
            },
            {
                name: 'Tibco',
                disable: false,
                icon: TIBCO,
                fields: [],
            },
            {
                name: 'Trino',
                disable: false,
                icon: TRINO,
                fields: [],
            },
        ],
    },
    STORAGE: {
        DEFAULT: [
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
    },
};
