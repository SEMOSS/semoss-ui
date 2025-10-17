import ASTER from "@/assets/img/ASTER.png";
import ATHENA from "@/assets/img/ATHENA.png";
import BIGQUERY from "@/assets/img/BIGQUERY.png";
import CASSANDRA from "@/assets/img/CASSANDRA.png";
import CLICKHOUSE from "@/assets/img/CLICKHOUSE.png";
import CSV from "@/assets/img/CSV.svg";
import DATABRICKS from "@/assets/img/DATABRICKS.png";
import DATASTAX from "@/assets/img/DATASTAX.png";
import DB2 from "@/assets/img/DB2.png";
import DERBY from "@/assets/img/DERBY.png";
import ELASTIC_SEARCH from "@/assets/img/ELASTIC_SEARCH.svg";
import EXCEL from "@/assets/img/EXCEL.png";
import FILE_EXCEL from '@/assets/img/file-excel.svg';
import H2_DB from "@/assets/img/H2_DB.png";
import HIVE from "@/assets/img/HIVE.jpg";
import IMPALA from "@/assets/img/IMPALA.png";
import MARIA_DB from "@/assets/img/MARIA_DB.png";
import MYSQL from "@/assets/img/MYSQL.png";
import NEO4J from "@/assets/img/NEO4J.png";
import OPEN_SEARCH from "@/assets/img/OPEN_SEARCH.png";
import ORACLE from "@/assets/img/ORACLE.png";
import PHOENIX from "@/assets/img/PHOENIX.png";
import POSTGRES from "@/assets/img/POSTGRES.png";
import REDSHIFT from "@/assets/img/REDSHIFT.png";
import SAP_HANA from "@/assets/img/SAP_HANA.png";
import SEMOSS from "@/assets/img/SEMOSS_BLUE_LOGO.svg";
import SNOWFLAKE from "@/assets/img/SNOWFLAKE.png";
import SQL_SERVER from "@/assets/img/SQL_SERVER.png";
import SQLITE from "@/assets/img/SQLITE.png";
import TERADATA from "@/assets/img/TERADATA.png";
import TIBCO from "@/assets/img/TIBCO.png";
import TINKER from "@/assets/img/TINKER.png";
import TRINO from "@/assets/img/TRINO.jpg";
import TSV from "@/assets/img/TSV.svg";
import ZIP from "@/assets/img/ZIP.png";

export const DATABASE_CONNECTION = {
  DATABASE: {
    "File Uploads": [
      {
        name: "ZIP",
        description: "Drop a zip file",
        disable: false,
        icon: ZIP,
        fields: [
          {
            fieldName: "ZIP",
            label: "Zip File",
            defaultValue: null,
            options: {
              component: "file-upload",
            },
            disabled: false,
            rules: { required: true },
          },
        ],
      },
      {
        name: "CSV",
        disable: false,
        icon: CSV,
        fields: [
          {
            fieldName: "DATABASE_NAME",
            label: "Enter Database Name",
            defaultValue: "",
            section: "general",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Enter Database Description",
            defaultValue: "",
            section: "general",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "DATABASE_TAG",
            label: "Enter Database Tag",
            defaultValue: "",
            section: "general",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "DELIMITER",
            label: "Enter Delimiter",
            defaultValue: ",",
            section: "Database",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TYPE",
            label: "Enter Database Type",
            defaultValue: "",
            section: "Database",
            options: {
              component: "select",
              options: [
                { display: "H2", value: "h2" },
                { display: "R", value: "r" },
              ],
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "METAMODEL_TYPE",
            label: "Enter Metamodel Type",
            defaultValue: "",
            section: "Database",
            options: {
              component: "select",
              options: [
                {
                  display: "As Flat Table",
                  value: "asFlatTable",
                },
                {
                  display: "As Suggested Metamodel",
                  value: "asSuggestedMetaModel",
                },
                {
                  display: "From Scratch",
                  value: "fromScratch",
                },
                {
                  display: "From Prop File",
                  value: "frompropFile",
                },
              ],
            },
            disabled: false,
            rules: {
              required: true,
              conditionalOptions: [
                {
                  whenField: "DATABASE_TYPE",
                  whenValue: "r",
                  allowedValues: ["asFlatTable"],
                  restrictOtherValues: true,
                },
              ],
            },
          },
          {
            fieldName: "FILE_UPLOAD",
            label: "File Upload",
            defaultValue: null,
            options: {
              component: "file-upload",
              extensions:[".csv"]
            },
            disabled: false,
            rules: {
              required: {
                value: true,
                message: "Please upload file / files.",
              },
            },
          },
        ],
      },
      {
        name: "Excel",
        disable: false,
        icon: EXCEL,
        fields: [
          {
            fieldName: "DATABASE_NAME",
            label: "Enter Database Name",
            defaultValue: "",
            section: "general",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Enter Database Description",
            defaultValue: "",
            section: "general",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "DATABASE_TAG",
            label: "Enter Database Tag",
            defaultValue: "",
            section: "general",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "DATABASE_TYPE",
            label: "Enter Database Type",
            defaultValue: "",
            section: "Database",
            options: {
              component: "select",
              options: [
                { display: "H2", value: "h2" },
                { display: "R", value: "r" },
              ],
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "METAMODEL_TYPE",
            label: "Enter Metamodel Type",
            defaultValue: "",
            section: "Database",
            options: {
              component: "select",
              options: [
                {
                  display: "As Flat Table",
                  value: "asFlatTable",
                },
              ],
            },
            disabled: false,
            rules: {
              required: true,
              conditionalOptions: [
                {
                  whenField: "DATABASE_TYPE",
                  whenValue: "r",
                  allowedValues: ["asFlatTable"],
                  restrictOtherValues: true,
                },
              ],
            },
          },
          {
            fieldName: "FILE_UPLOAD",
            label: "File Upload",
            defaultValue: null,
            options: {
              component: "file-upload",
              extensions:[".xlsx", ".xls",".xlsm"]
            },
            disabled: false,
            rules: {
              required: {
                value: true,
                message: "Please upload file / files.",
              },
            },
          },
        ],
      },
      {
        name: "TSV",
        disable: true,
        icon: TSV,
        fields: [],
      },
      {
        name: "SQLite",
        disable: true,
        icon: SQLITE,
        fields: [],
      },
      {
        name: "H2",
        disable: true,
        icon: H2_DB,
        fields: [],
      },
      {
        name: "Neo4J",
        disable: true,
        icon: NEO4J,
        fields: [],
      },
      {
        name: "Tinker",
        disable: true,
        icon: TINKER,
        fields: [],
      },
    ],
    Connections: [
      {
        name: "Aster",
        disable: false,
        icon: ASTER,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "ASTER_DB",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },
      {
        name: "Athena",
        disable: false,
        icon: ATHENA,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "ATHENA",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "region",
            label: "Region",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "accessKey",
            label: "Access Key",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "secretKey",
            label: "Secret Key",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "output",
            label: "Output",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },

          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },
      {
        name: "BigQuery",
        disable: false,
        icon: BIGQUERY,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "BIG_QUERY",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "https://www.googleapis.com/bigquery/v2",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "projectId",
            label: "Project",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "oauthType",
            label: "OAuth Type",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "oauthServiceAcctEmail",
            label: "OAuth Service Account",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "oauthPvtKeyPath",
            label: "OAuth Service Account Key",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
        ],
      },
      {
        name: "Cassandra",
        disable: false,
        icon: CASSANDRA,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "CASSANDRA",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "9042",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },

          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },
      {
        name: "Clickhouse",
        disable: false,
        icon: CLICKHOUSE,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "CLICKHOUSE",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "9042",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "database",
            label: "Database",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },

          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },
      {
        name: "DATABRICKS",
        disable: false,
        icon: DATABRICKS,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "DATABRICKS",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "httpPath",
            label: "HTTP Path",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "UID",
            label: "UID",
            defaultValue: "token",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "PWD",
            label: "Personal Access Token",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "database",
            label: "Database",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },

          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },
      {
        name: "DataStax",
        disable: true,
        icon: DATASTAX,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "DATASTAX",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "graph",
            label: "GRAPH",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "token",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "token",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
        ],
      },
      {
        name: "DB2",
        disable: false,
        icon: DB2,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "DB2",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "446",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },

      {
        name: "Derby",
        disable: false,
        icon: DERBY,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "DERBY",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "1527",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },

          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },

      {
        name: "Elastic Search",
        disable: false,
        icon: ELASTIC_SEARCH,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "ELASTIC_SEARCH",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "9200",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "httpType",
            label: "HTTP Type",
            defaultValue: "https",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
        ],
      },
      {
        name: "H2",
        disable: false,
        icon: H2_DB,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "H2_DB",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "1000",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },

          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },

      {
        name: "Hive",
        disable: false,
        icon: HIVE,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "HIVE",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "1000",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },

          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },

      {
        name: "Impala",
        disable: false,
        icon: IMPALA,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "IMPALA",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "21050",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },

          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },
      {
        name: "MariaDB",
        disable: false,
        icon: MARIA_DB,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "MARIA_DB",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "3306",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },

          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },
      {
        name: "MySQL",
        disable: false,
        icon: MYSQL,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "MYSQL",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "3306",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },
      {
        name: "Open Search",
        disable: false,
        icon: OPEN_SEARCH,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "OPEN_SEARCH",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "9200",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "httpPath",
            label: "HTTP Path",
            defaultValue: "https",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
        ],
      },
      {
        name: "Oracle",
        disable: false,
        icon: ORACLE,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "ORACLE",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "service",
            label: "SID Service",
            defaultValue: "1521",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },

          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },
      {
        name: "Phoenix",
        disable: false,
        icon: PHOENIX,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "PHOENIX",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "8765",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },

          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },
      {
        name: "Postgres",
        disable: false,
        icon: POSTGRES,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "POSTGRES",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "5432",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "database",
            label: "Database",
            defaultValue: "postgres",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "public",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },

          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },
      {
        name: "Redshift",
        disable: false,
        icon: REDSHIFT,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "REDSHIFT",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "5439",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "database",
            label: "Database",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },

          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },
      {
        name: "SAP Hana",
        disable: false,
        icon: SAP_HANA,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "SAP_HANA",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]" ) ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "30015",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },

          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },
      {
        name: "SEMOSS",
        disable: false,
        icon: SEMOSS,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "SEMOSS",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "443",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "project",
            label: "Project Id",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "insight",
            label: "Insight Id",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "endpoint",
            label: "Endpoint",
            defaultValue: "Monolith",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "protocol",
            label: "Protocol",
            defaultValue: "https",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "sub_url",
            label: "Sub URL",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },

          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },
      {
        name: "Snowflake",
        disable: false,
        icon: SNOWFLAKE,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "SNOWFLAKE",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "443",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "warehouse",
            label: "Warehouse",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "role",
            label: "Role",
            defaultValue: "PUBLIC",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "database",
            label: "Database",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },

          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },

          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },
      {
        name: "SQL Server",
        disable: false,
        icon: SQL_SERVER,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "SQL_SERVER",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "1433",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "database",
            label: "Database",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "dbo",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },

          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },

      {
        name: "SQLITE",
        disable: false,
        icon: SQLITE,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "SQLITE",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "1000",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: false, min: 0 },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },

          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },
      {
        name: "Teradata",
        disable: false,
        icon: TERADATA,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "TERADATA",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "database",
            label: "Database",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },

          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },
      {
        name: "Tibco",
        disable: false,
        icon: TIBCO,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "TIBCO",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "1433",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
          },
          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },

          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },
      {
        name: "Trino",
        disable: false,
        icon: TRINO,
        fields: [
          {
            fieldName: "RDBMS_TYPE",
            label: "Driver Name",
            defaultValue: "TRINO",
            options: {
              component: "text-field",
            },
            disabled: true,
            rules: { required: true },
            hidden: true,
          },
          {
            fieldName: "NAME",
            label: "Catalog Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: {
              required: true,
              pattern: {
                value: /^[\w\-\s]+$/,
                message:
                  "Catalog names can only contain alphanumeric characters and dashes.",
              },
              custom: {
                value: 'CheckEngineName ( "[VALUE]") ;',
                message:
                  "This Catalog name has already been used, please try another.",
              },
            },
          },
          {
            fieldName: "DATABASE_DESCRIPTION",
            label: "Database Description",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "DATABASE_TAGS",
            label: "Tags",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "hostname",
            label: "Host Name",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "port",
            label: "Port",
            defaultValue: "1433",
            options: {
              component: "number",
            },
            disabled: false,
            rules: { required: true, min: 0 },
          },
          {
            fieldName: "catalog",
            label: "Catalog",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "schema",
            label: "Schema",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: true },
          },
          {
            fieldName: "USERNAME",
            label: "Username",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "PASSWORD",
            label: "Password",
            defaultValue: "",
            options: {
              component: "password",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "additional",
            label: "Additional Parameters",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "CONNECTION_URL",
            label: "JDBC Url",
            defaultValue: "",
            options: {
              component: "text-field",
            },
            disabled: false,
            rules: { required: false },
          },
          {
            fieldName: "FETCH_SIZE",
            label: "Fetch Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "CONNECTION_TIMEOUT",
            label: "Connection Timeout",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "USE_CONNECTION_POOLING",
            label: "Use Connection Pooling",
            defaultValue: false,
            rules: { required: false },
            options: {
              component: "checkbox",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MIN_SIZE",
            label: "Pool Min Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
          {
            fieldName: "POOL_MAX_SIZE",
            label: "Pool Max Size",
            defaultValue: "",
            rules: { required: false, min: 0 },
            options: {
              component: "number",
            },
            disabled: false,
            advanced: true,
          },
        ],
      },
    ],
  },
};
export const ENGINE_IMAGES = {
  DATABASE: [
    {
      name: "ZIP",
      icon: ZIP,
    },
    {
      name: "CSV",
      icon: CSV,
    },
    {
      name: "EXCEL",
      icon: EXCEL,
    },
    {
      name: "TSV",
      icon: TSV,
    },
    {
      name: "SQLITE",
      icon: SQLITE,
    },
    {
      name: "H2_DB",
      icon: H2_DB,
    },
    {
      name: "NEO4J",
      icon: NEO4J,
    },
    {
      name: "TINKER",
      icon: TINKER,
    },
    {
      name: "ASTER_DB",
      icon: ASTER,
    },
    {
      name: "ATHENA",
      icon: ATHENA,
    },
    {
      name: "BIG_QUERY",
      icon: BIGQUERY,
    },
    {
      name: "CASSANDRA",
      icon: CASSANDRA,
    },
    {
      name: "CLICKHOUSE",
      icon: CLICKHOUSE,
    },
    {
      name: "DATABRICKS",
      icon: DATABRICKS,
    },
    {
      name: "DATASTAX",
      icon: DATASTAX,
    },
    {
      name: "DB2",
      icon: DB2,
    },
    {
      name: "DERBY",
      icon: DERBY,
    },
    {
      name: "ELASTIC_SEARCH",
      icon: ELASTIC_SEARCH,
    },
    {
      name: "H2",
      icon: H2_DB,
    },
    {
      name: "HIVE",
      icon: HIVE,
    },
    {
      name: "IMPALA",
      icon: IMPALA,
    },
    {
      name: "MARIA_DB",
      icon: MARIA_DB,
    },
    {
      name: "MYSQL",
      icon: MYSQL,
    },
    {
      name: "OPEN_SEARCH",
      icon: OPEN_SEARCH,
    },
    {
      name: "ORACLE",
      icon: ORACLE,
    },
    {
      name: "PHOENIX",
      icon: PHOENIX,
    },
    {
      name: "POSTGRES",
      icon: POSTGRES,
    },
    {
      name: "REDSHIFT",
      icon: REDSHIFT,
    },
    {
      name: "SAP_HANA",
      icon: SAP_HANA,
    },
    {
      name: "SEMOSS",
      icon: SEMOSS,
    },
    {
      name: "SNOWFLAKE",
      icon: SNOWFLAKE,
    },
    {
      name: "SQL_SERVER",
      icon: SQL_SERVER,
    },
    {
      name: "SQLITE",
      icon: SQLITE,
    },
    {
      name: "TERADATA",
      icon: TERADATA,
    },
    {
      name: "TIBCO",
      icon: TIBCO,
    },
    {
      name: "TRINO",
      icon: TRINO,
    },
  ],
};

export const CSV_UPLOAD_ICONS = {
  FILE_EXCEL,
};
