/** Query language handled by the workspace */
export type DatabaseType = "SQL" | "SPARQL";

export type DatabaseTableAction = {
	/** Label of the action */
	label: string;
	/** Description of the action */
	description: string;
	/** Query dependent on if it is a TABLE action or columns action */
	query: (table: string, columns: string[]) => string;
};

export type DatabaseColumnAction = {
	/** Label of the action */
	label: string;
	/** Description of the action */
	description: string;
	/** Query dependent on if it is a TABLE action or column action */
	query: (table: string, column: string) => string;
};

/**
 * Grouped context-menu actions for a table (SQL) / concept (SPARQL).
 */
export const getTableActionGroups = (
	mode: DatabaseType,
): { label: string; actions: DatabaseTableAction[] }[] => {
	if (mode === "SPARQL") {
		return [
			{
				label: "Query",
				actions: [
					{
						label: "Select instances",
						description: "Select instances of the chosen concept.",
						query: (concept) =>
							`# Instances of "${concept}" - replace CONCEPT_URI with the concept's full URI\nSELECT ?instance\nWHERE {\n\t?instance a <CONCEPT_URI> .\n}\nLIMIT 100`,
					},
				],
			},
			{
				label: "Modify",
				actions: [
					{
						label: "Insert data",
						description:
							"Generate an INSERT DATA statement for the chosen concept.",
						query: (concept) =>
							`# Add an instance of "${concept}" - replace the placeholder URIs\nINSERT DATA {\n\t<SUBJECT_URI> a <CONCEPT_URI> .\n}`,
					},
					{
						label: "Delete instances",
						description:
							"Generate a DELETE WHERE statement for all concept instances.",
						query: (concept) =>
							`# Delete all instances of "${concept}" - replace CONCEPT_URI with the concept's full URI\nDELETE WHERE {\n\t?instance a <CONCEPT_URI> ;\n\t\t?property ?value .\n}`,
					},
				],
			},
		];
	}

	return [
		{
			label: "Query",
			actions: [
				{
					label: "Select top 100 rows",
					description:
						"Preview the first 100 rows from the chosen table.",
					query: (table) => `SELECT * FROM ${table}\nLIMIT 100;`,
				},
				{
					label: "Select all rows",
					description: "Select every row from the chosen table.",
					query: (table) => `SELECT * FROM ${table};`,
				},
				{
					label: "Count rows",
					description:
						"Count the number of rows in the chosen table.",
					query: (table) =>
						`SELECT COUNT(*) AS row_count FROM ${table};`,
				},
			],
		},
		{
			label: "Modify",
			actions: [
				{
					label: "Insert data",
					description:
						"Generate an INSERT statement for the selected table.",
					query: (table, columns) => {
						const cols = columns.length
							? columns.join(", ")
							: "column1, column2";
						const values = columns.length
							? columns.map((column) => `:${column}`).join(", ")
							: ":value1, :value2";
						return `INSERT INTO ${table} (${cols})\nVALUES (${values});`;
					},
				},
				{
					label: "Update data",
					description:
						"Generate an UPDATE statement for the selected table.",
					query: (table, columns) => {
						const firstColumn = columns[0] ?? "column_name";
						return `UPDATE ${table}\nSET ${firstColumn} = :value\nWHERE condition;`;
					},
				},
				{
					label: "Add column",
					description:
						"Generate an ALTER TABLE statement to add a new column.",
					query: (table) =>
						`ALTER TABLE ${table}\nADD COLUMN column_name datatype;`,
				},
				{
					label: "Rename table",
					description:
						"Generate an ALTER TABLE statement to rename the table.",
					query: (table) =>
						`ALTER TABLE ${table}\nRENAME TO new_table_name;`,
				},
				{
					label: "Delete data",
					description:
						"Generate a DELETE statement for rows in the selected table.",
					query: (table) => `DELETE FROM ${table}\nWHERE condition;`,
				},
				{
					label: "Delete table",
					description:
						"Generate a DROP TABLE statement for the selected table.",
					query: (table) => `DROP TABLE ${table};`,
				},
			],
		},
	];
};

/**
 * Grouped context-menu actions for a column (SQL) / property (SPARQL).
 **/
export const getColumnActionGroups = (
	mode: DatabaseType,
): { label: string; actions: DatabaseColumnAction[] }[] => {
	if (mode === "SPARQL") {
		return [
			{
				label: "Query",
				actions: [
					{
						label: "Select values",
						description:
							"Select all values for the chosen property.",
						query: (_table, property) =>
							`# Values of "${property}" - replace PROPERTY_URI with the property's full URI\nSELECT ?subject ?value\nWHERE {\n\t?subject <PROPERTY_URI> ?value .\n}\nLIMIT 100`,
					},
				],
			},
			{
				label: "Modify",
				actions: [
					{
						label: "Insert value",
						description:
							"Generate an INSERT DATA statement for the chosen property.",
						query: (_table, property) =>
							`# Add a "${property}" value - replace the placeholder URIs and value\nINSERT DATA {\n\t<SUBJECT_URI> <PROPERTY_URI> "value" .\n}`,
					},
					{
						label: "Delete values",
						description:
							"Generate a DELETE WHERE statement for the chosen property.",
						query: (_table, property) =>
							`# Delete all "${property}" values - replace PROPERTY_URI with the property's full URI\nDELETE WHERE {\n\t?subject <PROPERTY_URI> ?value .\n}`,
					},
				],
			},
		];
	}

	return [
		{
			label: "Query",
			actions: [
				{
					label: "Select column",
					description: "Select the chosen column from the table.",
					query: (table, column) => `SELECT ${column} FROM ${table};`,
				},
				{
					label: "Select distinct values",
					description:
						"Select the distinct values for the chosen column.",
					query: (table, column) =>
						`SELECT DISTINCT ${column} FROM ${table};`,
				},
			],
		},
		{
			label: "Modify",
			actions: [
				{
					label: "Rename column",
					description:
						"Generate an ALTER TABLE statement to rename the column.",
					query: (table, column) =>
						`ALTER TABLE ${table}\nRENAME COLUMN ${column} TO new_column_name;`,
				},
				{
					label: "Delete column",
					description:
						"Generate an ALTER TABLE statement to drop the column.",
					query: (table, column) =>
						`ALTER TABLE ${table}\nDROP COLUMN ${column};`,
				},
			],
		},
	];
};
