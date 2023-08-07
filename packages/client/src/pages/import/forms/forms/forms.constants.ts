import * as Forms from './';
import { CSVForm } from './CSVForm';
import { ExcelForm } from './ExcelForm';
import { TSVForm } from './TSVForm';
import { SQLiteForm } from './SQLiteForm';
import { H2Form } from './H2Form';
import { Neo4JForm } from './Neo4JForm';
import { TinkerForm } from './TinkerForm';
import { AsterForm } from './AsterForm';
import { AthenaForm } from './AthenaForm';
import { BigQueryForm } from './BigQueryForm';
import { CassandraForm } from './CassandraForm';
import { ClickhouseForm } from './ClickhouseForm';
import { DatabricksForm } from './DatabricksForm';
import { DataStaxForm } from './DataStaxForm';
import { DB2Form } from './DB2Form';
import { DerbyForm } from './DerbyForm';
import { ElasticSearchForm } from './ElasticSearchForm';
import { HiveForm } from './HiveForm';
import { ImpalaForm } from './ImpalaForm';
import { MariaDBForm } from './MariaDBForm';
import { MySQLForm } from './MySQLForm';
import { OpenSearchForm } from './OpenSearchForm';
import { OracleForm } from './OracleForm';
import { PhoenixForm } from './PhoenixForm';
import { PostgresForm } from './PostgresForm';
import { RedshiftForm } from './RedshiftForm';
import { SAPHanaForm } from './SAPHanaForm';
import { SemossForm } from './SemossForm';
import { SnowflakeForm } from './SnowflakeForm';
import { SQLServerForm } from './SQLServerForm';
import { TeradataForm } from './TeradataForm';
import { TibcoForm } from './TibcoForm';
import { TrinoForm } from './TrinoForm';

import React from 'react';

export interface FormRoute {
    component: React.FunctionComponent;
}

export const FORM_ROUTES: (FormRoute & {
    name: string;
})[] = [
    { name: 'Aster', component: AsterForm },
    { name: 'Athena', component: AthenaForm },
    { name: 'BigQuery', component: BigQueryForm },
    { name: 'Cassandra', component: CassandraForm },
    { name: 'Clickhouse', component: ClickhouseForm },
    { name: 'CSV', component: CSVForm },
    { name: 'DATABRICKS', component: DatabricksForm },
    { name: 'DataStax', component: DataStaxForm },
    { name: 'DB2', component: DB2Form },
    { name: 'Derby', component: DerbyForm },
    { name: 'Elastic Search', component: ElasticSearchForm },
    { name: 'Excel', component: ExcelForm },
    { name: 'H2', component: H2Form },
    { name: 'Hive', component: HiveForm },
    { name: 'Impala', component: ImpalaForm },
    { name: 'MariaDB', component: MariaDBForm },
    { name: 'MySQL', component: MySQLForm },
    { name: 'Neo4J', component: Neo4JForm },
    { name: 'Open Search', component: OpenSearchForm },
    { name: 'Oracle', component: OracleForm },
    { name: 'Phoenix', component: PhoenixForm },
    { name: 'Postgres', component: PostgresForm },
    { name: 'Redshift', component: RedshiftForm },
    { name: 'SAP Hana', component: SAPHanaForm },
    { name: 'SEMOSS', component: SemossForm },
    { name: 'Snowflake', component: SnowflakeForm },
    { name: 'SQL Server', component: SQLServerForm },
    { name: 'SQLITE', component: SQLiteForm },
    { name: 'Teradata', component: TeradataForm },
    { name: 'Tibco', component: TibcoForm },
    { name: 'Tinker', component: TinkerForm },
    { name: 'Trino', component: TrinoForm },
    { name: 'TSV', component: TSVForm },
];
