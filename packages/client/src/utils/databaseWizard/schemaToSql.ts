export type WizardColumn = {
	type: string;
	description?: string;
};

export type WizardForeignKey = {
	references: string;
	on: string;
};

export type WizardTable = {
	columns: Record<string, WizardColumn>;
	primary_key?: string;
	foreign_keys?: Record<string, WizardForeignKey>;
};

export type WizardSchema = {
	schema: Record<string, WizardTable>;
	sample_data?: Record<string, Array<Record<string, unknown>>> | null;
};

const quoteIdentifier = (value: string) => {
	const safe = value.replace(/"/g, '""');
	return `"${safe}"`;
};

const formatValue = (value: unknown) => {
	if (value === null || value === undefined) {
		return "NULL";
	}

	if (typeof value === "number") {
		return String(value);
	}

	if (typeof value === "boolean") {
		return value ? "TRUE" : "FALSE";
	}

	const safe = String(value).replace(/'/g, "''");
	return `'${safe}'`;
};

export const schemaToSql = (
	wizardSchema: WizardSchema,
	includeSampleData = true,
) => {
	const statements: string[] = [];

	Object.entries(wizardSchema.schema).forEach(([tableName, table]) => {
		const columnNames = Object.keys(table.columns || {});
		const columnLines = columnNames.map((columnName) => {
			const column = table.columns[columnName];
			return `${quoteIdentifier(columnName)} ${column?.type || "TEXT"}`;
		});

		const primaryKey = table.primary_key
			? `PRIMARY KEY (${quoteIdentifier(table.primary_key)})`
			: null;

		const foreignKeys = Object.entries(table.foreign_keys || {}).map(
			([columnName, fk]) => {
				return `FOREIGN KEY (${quoteIdentifier(columnName)}) REFERENCES ${quoteIdentifier(fk.references)} (${quoteIdentifier(fk.on)})`;
			},
		);

		const allLines = [
			...columnLines,
			...(primaryKey ? [primaryKey] : []),
			...foreignKeys,
		];

		statements.push(
			`CREATE TABLE ${quoteIdentifier(tableName)} (\n  ${allLines.join(",\n  ")}\n);`,
		);

		const sampleRows = wizardSchema.sample_data?.[tableName];
		if (includeSampleData && sampleRows?.length) {
			const columnsSql = columnNames.map(quoteIdentifier).join(", ");

			sampleRows.forEach((row) => {
				const values = columnNames.map((name) =>
					formatValue(row[name]),
				);
				statements.push(
					`INSERT INTO ${quoteIdentifier(tableName)} (${columnsSql}) VALUES (${values.join(", ")});`,
				);
			});
		}
	});

	return statements.join("\n\n");
};
