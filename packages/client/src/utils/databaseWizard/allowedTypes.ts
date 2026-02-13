export const ALLOWED_SQL_TYPES = [
	"INTEGER",
	"VARCHAR(255)",
	"TEXT",
	"DATE",
	"TIMESTAMP",
	"BOOLEAN",
	"DOUBLE",
	"FLOAT",
	"DECIMAL(10,2)",
] as const;

export type AllowedSqlType = (typeof ALLOWED_SQL_TYPES)[number];

const normalizedMap: Record<string, AllowedSqlType> = {
	INT: "INTEGER",
	INTEGER: "INTEGER",
	BIGINT: "INTEGER",
	SMALLINT: "INTEGER",
	VARCHAR: "VARCHAR(255)",
	"VARCHAR(255)": "VARCHAR(255)",
	TEXT: "TEXT",
	DATE: "DATE",
	DATETIME: "TIMESTAMP",
	TIMESTAMP: "TIMESTAMP",
	BOOL: "BOOLEAN",
	BOOLEAN: "BOOLEAN",
	DOUBLE: "DOUBLE",
	FLOAT: "FLOAT",
	DECIMAL: "DECIMAL(10,2)",
	"DECIMAL(10,2)": "DECIMAL(10,2)",
	NUMERIC: "DECIMAL(10,2)",
};

export const normalizeSqlType = (value: string): AllowedSqlType => {
	const normalized = value.trim().toUpperCase();
	if (normalizedMap[normalized]) {
		return normalizedMap[normalized];
	}
	if (normalized.startsWith("VARCHAR")) {
		return "VARCHAR(255)";
	}
	if (normalized.startsWith("DECIMAL")) {
		return "DECIMAL(10,2)";
	}
	return "TEXT";
};
