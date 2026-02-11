export type WizardColumn = {
	name: string;
	type: string;
};

export type WizardForeignKey = {
	column: string;
	references: string;
};

export type WizardTable = {
	table: string;
	columns: WizardColumn[];
	foreign_keys?: WizardForeignKey[];
	sample_data?: Array<Record<string, unknown>>;
};

export type WizardSchema = {
	schema: WizardTable[];
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

	wizardSchema.schema.forEach((table) => {
		const columnLines = table.columns.map(
			(column) =>
				`${quoteIdentifier(column.name)} ${column.type || "TEXT"}`,
		);

		const foreignKeys = (table.foreign_keys || []).map((fk) => {
			return `FOREIGN KEY (${quoteIdentifier(fk.column)}) REFERENCES ${fk.references}`;
		});

		const allLines = [...columnLines, ...foreignKeys];

		statements.push(
			`CREATE TABLE ${quoteIdentifier(table.table)} (\n  ${allLines.join(",\n  ")}\n);`,
		);

		if (includeSampleData && table.sample_data?.length) {
			const columnNames = table.columns.map((column) => column.name);
			const columnsSql = columnNames.map(quoteIdentifier).join(", ");

			table.sample_data.forEach((row) => {
				const values = columnNames.map((name) =>
					formatValue(row[name]),
				);
				statements.push(
					`INSERT INTO ${quoteIdentifier(table.table)} (${columnsSql}) VALUES (${values.join(", ")});`,
				);
			});
		}
	});

	return statements.join("\n\n");
};
