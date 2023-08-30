import { CSVForm } from './forms/CSVForm';
import { ExcelForm } from './forms/ExcelForm';
import { TSVForm } from './forms/TSVForm';
import { SQLiteForm } from './forms/SQLiteForm';
import { H2Form } from './forms/H2Form';
import { Neo4JForm } from './forms/Neo4JForm';
import { TinkerForm } from './forms/TinkerForm';
import { AsterForm } from './forms/AsterForm';
import { AthenaForm } from './forms/AthenaForm';
import { BigQueryForm } from './forms/BigQueryForm';
import { CassandraForm } from './forms/CassandraForm';
import { ClickhouseForm } from './forms/ClickhouseForm';
import { DatabricksForm } from './forms/DatabricksForm';
import { DataStaxForm } from './forms/DataStaxForm';
import { DB2Form } from './forms/DB2Form';
import { DerbyForm } from './forms/DerbyForm';
import { ElasticSearchForm } from './forms/ElasticSearchForm';
import { HiveForm } from './forms/HiveForm';
import { ImpalaForm } from './forms/ImpalaForm';
import { MariaDBForm } from './forms/MariaDBForm';
import { MySQLForm } from './forms/MySQLForm';
import { OpenSearchForm } from './forms/OpenSearchForm';
import { OracleForm } from './forms/OracleForm';
import { PhoenixForm } from './forms/PhoenixForm';
import { PostgresForm } from './forms/PostgresForm';
import { RedshiftForm } from './forms/RedshiftForm';
import { SAPHanaForm } from './forms/SAPHanaForm';
import { SemossForm } from './forms/SemossForm';
import { SnowflakeForm } from './forms/SnowflakeForm';
import { SQLServerForm } from './forms/SQLServerForm';
import { TeradataForm } from './forms/TeradataForm';
import { TibcoForm } from './forms/TibcoForm';
import { TrinoForm } from './forms/TrinoForm';

import React from 'react';

export interface FormRoute {
    component: React.FunctionComponent;
}

export const DATABASE_FORM_ROUTES: (FormRoute & {
    name: string;
    route: string;
})[] = [
    { name: 'Aster', component: AsterForm, route: '/aster' },
    { name: 'Athena', component: AthenaForm, route: '/athena' },
    { name: 'BigQuery', component: BigQueryForm, route: '/big_query' },
    { name: 'Cassandra', component: CassandraForm, route: '/cassandra' },
    { name: 'Clickhouse', component: ClickhouseForm, route: '/clickhosue' },
    { name: 'CSV', component: CSVForm, route: '/csv' },
    { name: 'DATABRICKS', component: DatabricksForm, route: '/databricks' },
    { name: 'DataStax', component: DataStaxForm, route: '/data_stax' },
    { name: 'DB2', component: DB2Form, route: '/db2' },
    { name: 'Derby', component: DerbyForm, route: '/derby' },
    {
        name: 'Elastic Search',
        component: ElasticSearchForm,
        route: '/elastic_search',
    },
    { name: 'Excel', component: ExcelForm, route: '/excel' },
    { name: 'H2', component: H2Form, route: '/h2' },
    { name: 'Hive', component: HiveForm, route: '/hive' },
    { name: 'Impala', component: ImpalaForm, route: '/impala' },
    { name: 'MariaDB', component: MariaDBForm, route: '/mariadb' },
    { name: 'MySQL', component: MySQLForm, route: '/mysql' },
    { name: 'Neo4J', component: Neo4JForm, route: '/neo4J' },
    { name: 'Open Search', component: OpenSearchForm, route: '/open_search' },
    { name: 'Oracle', component: OracleForm, route: '/oracle' },
    { name: 'Phoenix', component: PhoenixForm, route: '/phoenix' },
    { name: 'Postgres', component: PostgresForm, route: '/postgres' },
    { name: 'Redshift', component: RedshiftForm, route: '/redshift' },
    { name: 'SAP Hana', component: SAPHanaForm, route: '/sap_hana' },
    { name: 'SEMOSS', component: SemossForm, route: '/semoss' },
    { name: 'Snowflake', component: SnowflakeForm, route: '/snowflake' },
    { name: 'SQL Server', component: SQLServerForm, route: '/sql_server' },
    { name: 'SQLITE', component: SQLiteForm, route: '/sqlite' },
    { name: 'Teradata', component: TeradataForm, route: '/teradata' },
    { name: 'Tibco', component: TibcoForm, route: '/tibco' },
    { name: 'Tinker', component: TinkerForm, route: '/tinker' },
    { name: 'Trino', component: TrinoForm, route: '/trino' },
    { name: 'TSV', component: TSVForm, route: '/tsv' },
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
        };
        disabled: boolean;
        rules: Record<string, any>; // react hook form
    }[];
}[];

export const MODEL_FORMS: EngineFields = [
    {
        name: 'Open AI',
        fields: [
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
                fieldName: 'OPEN_AI_KEY',
                label: 'Open AI Key',
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
                fieldName: 'KEEP_CONTEXT',
                label: 'Keep Context',
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
        name: 'Claude',
        fields: [
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
                fieldName: 'KEEP_CONTEXT',
                label: 'Keep Context',
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
        name: 'Wizard 13B',
        fields: [
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
                            display: 'Text Generation',
                            value: 'TEXT_GENERATION',
                        },
                    ],
                },
                disabled: false,
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
                fieldName: 'KEEP_CONTEXT',
                label: 'Keep Context',
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
        name: 'Llama2 7B',
        fields: [
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
                fieldName: 'KEEP_CONTEXT',
                label: 'Keep Context',
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
        name: 'Llama2 13B',
        fields: [
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
                            display: 'Text Generation',
                            value: 'TEXT_GENERATION',
                        },
                    ],
                },
                disabled: false,
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
                fieldName: 'KEEP_CONTEXT',
                label: 'Keep Context',
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
        name: 'Llama2 70B',
        fields: [
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
                            display: 'Text Generation',
                            value: 'TEXT_GENERATION',
                        },
                    ],
                },
                disabled: false,
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
                fieldName: 'KEEP_CONTEXT',
                label: 'Keep Context',
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
        name: 'Falcon',
        fields: [
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
                            display: 'Text Generation',
                            value: 'TEXT_GENERATION',
                        },
                    ],
                },
                disabled: false,
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
                fieldName: 'KEEP_CONTEXT',
                label: 'Keep Context',
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
        name: 'StableBeluga2',
        fields: [
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
                            display: 'Text Generation',
                            value: 'TEXT_GENERATION',
                        },
                    ],
                },
                disabled: false,
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
                fieldName: 'KEEP_CONTEXT',
                label: 'Keep Context',
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
        name: 'Guanaco',
        fields: [
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
                            display: 'Text Generation',
                            value: 'TEXT_GENERATION',
                        },
                    ],
                },
                disabled: false,
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
                fieldName: 'KEEP_CONTEXT',
                label: 'Keep Context',
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
        name: 'Vicuna',
        fields: [
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
                            display: 'Text Generation',
                            value: 'TEXT_GENERATION',
                        },
                    ],
                },
                disabled: false,
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
                fieldName: 'KEEP_CONTEXT',
                label: 'Keep Context',
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
        name: 'Mosaic ML',
        fields: [
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
                            display: 'Text Generation',
                            value: 'TEXT_GENERATION',
                        },
                    ],
                },
                disabled: false,
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
                fieldName: 'KEEP_CONTEXT',
                label: 'Keep Context',
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
        name: 'Dolly',
        fields: [
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
                            display: 'Text Generation',
                            value: 'TEXT_GENERATION',
                        },
                    ],
                },
                disabled: false,
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
                fieldName: 'KEEP_CONTEXT',
                label: 'Keep Context',
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
        name: 'Replit code model – 3b',
        fields: [
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
                            display: 'Text Generation',
                            value: 'TEXT_GENERATION',
                        },
                    ],
                },
                disabled: false,
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
                fieldName: 'KEEP_CONTEXT',
                label: 'Keep Context',
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
        name: 'Flan T5 Large',
        fields: [
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
                            display: 'Text Generation',
                            value: 'TEXT_GENERATION',
                        },
                    ],
                },
                disabled: false,
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
                fieldName: 'KEEP_CONTEXT',
                label: 'Keep Context',
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
        name: 'Flan T5 XXL',
        fields: [
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
                            display: 'Text Generation',
                            value: 'TEXT_GENERATION',
                        },
                    ],
                },
                disabled: false,
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
                fieldName: 'KEEP_CONTEXT',
                label: 'Keep Context',
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
        name: 'Bert',
        fields: [
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
                            display: 'Text Generation',
                            value: 'TEXT_GENERATION',
                        },
                    ],
                },
                disabled: false,
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
                fieldName: 'KEEP_CONTEXT',
                label: 'Keep Context',
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
        name: 'Eleuther GPTJ',
        fields: [
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
                            display: 'Text Generation',
                            value: 'TEXT_GENERATION',
                        },
                    ],
                },
                disabled: false,
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
                fieldName: 'KEEP_CONTEXT',
                label: 'Keep Context',
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
        name: 'Wizard Coder',
        fields: [
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
                fieldName: 'KEEP_CONTEXT',
                label: 'Keep Context',
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
        name: 'Orca',
        fields: [
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
                fieldName: 'KEEP_CONTEXT',
                label: 'Keep Context',
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
        name: 'Stablity AI',
        fields: [
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
                fieldName: 'KEEP_CONTEXT',
                label: 'Keep Context',
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
        name: 'Replit Code Model',
        fields: [
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
                fieldName: 'KEEP_CONTEXT',
                label: 'Keep Context',
                defaultValue: 'false',
                options: {
                    component: 'text-field',
                },
                disabled: false,
                rules: { required: true },
            },
        ],
    },
];

export const STORAGE_FORMS: EngineFields = [
    {
        name: 'Amazon S3',
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
                    component: 'text-field',
                },
                disabled: false,
                rules: { required: false },
            },
        ],
    },
    {
        name: 'Dreamhost',
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
                    component: 'text-field',
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
                    component: 'text-field',
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
        name: 'Microsoft Azure Blob Storage',
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
                defaultValue: 'need',
                options: {
                    component: 'text-field',
                },
                disabled: false,
                rules: { required: true },
            },
            {
                fieldName: 'S3_ACCESS_KEY',
                label: 'S3 Access Key',
                defaultValue: 'need',
                options: {
                    component: 'text-field',
                },
                disabled: false,
                rules: { required: true },
            },
            {
                fieldName: 'S3_SECRET_KEY',
                label: 'S3 Secret Key',
                defaultValue: 'need',
                options: {
                    component: 'text-field',
                },
                disabled: false,
                rules: { required: true },
            },
            {
                fieldName: 'S3_ENDPOINT',
                label: 'S3 Endpoint',
                defaultValue: 'need',
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
                    component: 'text-field',
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
];
