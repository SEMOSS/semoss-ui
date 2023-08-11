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
