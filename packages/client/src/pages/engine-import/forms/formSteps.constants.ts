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
import PHEONIX from '@/assets/img/PHOENIX.png';
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
import dropbox from '@/assets/img/dropbox.png';
import GOOGLE_CLOUD from '@/assets/img/GOOGLE_CLOUD_STORAGE.png';
import GOOGLE_DRIVE from '@/assets/img/GOOGLE_DRIVE.png';
import ONEDRIVE from '@/assets/img/ONEDRIVE.png';
import AZURE_BLOB from '@/assets/img/AZURE_BLOB.png';
import MINIO from '@/assets/img/MINIO.png';

//Commercial Models
import OPEN_AI from '@/assets/img/OPEN_AI.png';
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

//Embedded Models
import ORCA from '@/assets/img/ORCA.png';
import STABILITY_AI from '@/assets/img/STABILITY_AI.png';
import REPLIT from '@/assets/img/REPLIT_CODE.png';

export const stepsOne = [
    {
        name: 'Connect to Database',
        description:
            "In today's data-driven world, the ability to effortlessly establish connections with various database types is pivotal for unlocking the full potential of your applications and analytical processes. Whether you're a developer, data analyst, or business professional, this page serves as your gateway to understanding the array of database options at your disposal.",
    },
    {
        name: 'Upload Database',
        description: '',
    },
    {
        name: 'Upload Database',
        description: '',
    },
    {
        name: 'Build Database',
        description: '',
    },
    {
        name: 'Connect to Model',
        description:
            "In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of database options available within the LLM landscape.",
    },
    {
        name: 'Connect to Storage',
        description: '',
    },
];

export const stepsTwo = {
    ['Drag and Drop Data']: [
        'CSV',
        'Excel',
        'TSV',
        'SQLite',
        'H2',
        'Neo4J',
        'Tinker',
    ],
    ['Connect to an External Database']: [
        'Aster',
        'Athena',
        'BigQuery',
        'Cassandra',
        'Clickhouse',
        'DATABRICKS',
        'DataStax',
        'DB2',
        'Derby',
        'Elastic Search',
        'H2',
        'Hive',
        'Impala',
        'MariaDB',
        'MySQL',
        'Open Search',
        'Oracle',
        'Phoenix',
        'Postgres',
        'Redshift',
        'SAP Hana',
        'SEMOSS',
        'Snowflake',
        'SQL Server',
        'SQLITE',
        'Teradata',
        'Tibco',
        'Trino',
    ],
    ['Add Storage']: [
        'Amazon S3',
        'Dreamhost',
        'Dropbox',
        'Google Cloud Storage',
        'Google Drive',
        'Microsoft Azure Blob Storage',
        'Microsoft OneDrive',
        'MINIO',
    ],
    ['Commercial Models']: ['Open AI', 'Claude'],
    ['Local Models']: [
        'Wizard 13B',
        'Llama2 13',
        'Llama2 40',
        'Llama2 70',
        'Falcon',
        'FreeWilly2',
        'Guanaco',
        'Vicuna',
        'Mosaic ML',
        'Dolly',
        'Replit code model – 3b',
        'Flan T5 Large',
        'Flan T5 XXL',
        'Bert',
        'Eleuther GPTJ',
        'Wizard Coder',
    ],
    ['Embedded Models']: ['Orca', 'Stablity AI', 'Replit Code Model'],
};

export const IconDBMapper = {
    CSV: CSV,
    Excel: EXCEL,
    TSV: TSV,
    SQLite: SQLITE,
    H2: H2_DB,
    Neo4J: NEO4J,
    Tinker: TINKER,

    Aster: ASTER,
    Athena: ATHENA,
    BigQuery: BIGQUERY,
    Cassandra: CASSANDRA,
    Clickhouse: CLICKHOUSE,
    DATABRICKS: DATABRICKS,
    DataStax: DATASTAX,
    DB2: DB2,
    Derby: DERBY,
    'Elastic Search': ELASTIC_SEARCH,
    Hive: HIVE,
    Impala: IMPALA,
    MariaDB: MARIA_DB,
    MySQL: MYSQL,
    'Open Search': OPEN_SEARCH,
    Oracle: ORACLE,
    Phoenix: PHEONIX,
    Postgres: POSTGRES,
    Redshift: REDSHIFT,
    'SAP Hana': SAP_HANA,
    SEMOSS: SEMOSS,
    Snowflake: SNOWFLAKE,
    'SQL Server': SQL_SERVER,
    SQLITE: SQLITE,
    Teradata: TERADATA,
    Tibco: TIBCO,
    Trino: TRINO,

    'Amazon S3': AMAZON_S3,
    Dreamhost: DREAMHOST,
    Dropbox: dropbox,
    'Google Cloud Storage': GOOGLE_CLOUD,
    'Google Drive': GOOGLE_DRIVE,
    'Microsoft Azure Blob Storage': AZURE_BLOB,
    'Microsoft OneDrive': ONEDRIVE,
    MINIO: MINIO,

    'Open AI': OPEN_AI,
    Claude: CLAUDE,

    'Wizard 13B': BRAIN,
    'Llama2 13': META,
    'Llama2 40': META,
    'Llama2 70': META,
    Falcon: FALCON,
    FreeWilly2: BRAIN,
    Guanaco: BRAIN,
    Vicuna: VICUNA,
    'Mosaic ML': MOSAIC,
    Dolly: DOLLY,
    'Replit code model – 3b': REPLIT,
    'Flan T5 Large': FLAN,
    'Flan T5 XXL': FLAN,
    Bert: BERT,
    'Eleuther GPTJ': ELEUTHER,
    'Wizard Coder': BRAIN,

    Orca: ORCA,
    'Stablity AI': STABILITY_AI,
    'Replit Code Model': REPLIT,
};
