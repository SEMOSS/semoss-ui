import * as Forms from './Forms';

import React from 'react';

export interface FormRoute {
    component: React.FunctionComponent;
}

export const FORM_ROUTES: (FormRoute & {
    name: string;
})[] = [
    { name: 'Aster', component: Forms.AsterForm },
    { name: 'Athena', component: Forms.AthenaForm },
    { name: 'BigQuery', component: Forms.BigQueryForm },
    { name: 'Cassandra', component: Forms.BigQueryForm },
    { name: 'Clickhouse', component: Forms.ClickhouseForm },
    { name: 'CSV', component: Forms.CSVForm },
    { name: 'DATABRICKS', component: Forms.DatabricksForm },
    { name: 'DataStax', component: Forms.DataStaxForm },
    { name: 'DB2', component: Forms.DB2Form },
    { name: 'Derby', component: Forms.DerbyForm },
    { name: 'Elastic Search', component: Forms.ElasticSearchForm },
    { name: 'Excel', component: Forms.ElasticSearchForm },
    { name: 'Excel', component: Forms.ExcelForm },
    { name: 'H2', component: Forms.H2Form },
    { name: 'Hive', component: Forms.HiveForm },
    { name: 'Impala', component: Forms.ImpalaForm },
    { name: 'MariaDB', component: Forms.MariaDBForm },
    { name: 'MySQL', component: Forms.MySQLForm },
    { name: 'Neo4J', component: Forms.Neo4JForm },
    { name: 'Open Search', component: Forms.OpenSearchForm },
    { name: 'Oracle', component: Forms.OracleForm },
    { name: 'Phoenix', component: Forms.PhoenixForm },
    { name: 'Postgres', component: Forms.PostgresForm },
    { name: 'Redshift', component: Forms.RedshiftForm },
    { name: 'SAP Hana', component: Forms.SAPHanaForm },
    { name: 'SEMOSS', component: Forms.SemossForm },
    { name: 'Snowflake', component: Forms.SnowflakeForm },
    { name: 'SQL Server', component: Forms.SQLServerForm },
    { name: 'SQLITE', component: Forms.SQLLiteForm },
    { name: 'Teradata', component: Forms.TeradataForm },
    { name: 'Tibco', component: Forms.TibcoForm },
    { name: 'Tinker', component: Forms.TinkerForm },
    { name: 'Trino', component: Forms.TrinoForm },
    { name: 'TSV', component: Forms.TSVForm },
];
