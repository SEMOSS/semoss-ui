export interface DataImportDatabase {
	engine_id: string;
	engine_name: string;
	engine_type: string;
	engine_subtype?: string;
}

const firstText = (...values: unknown[]): string | undefined =>
	values.find(
		(value): value is string =>
			typeof value === "string" && value.trim().length > 0,
	);

/** GetDatabaseList still returns legacy aliases on some servers. Normalize only
 * the API response; saved databaseId fields and query expressions stay intact. */
export const getDataImportDatabases = (data: unknown): DataImportDatabase[] => {
	if (!Array.isArray(data)) return [];

	const databases = new Map<string, DataImportDatabase>();
	for (const row of data) {
		if (!row || typeof row !== "object") continue;
		const id = firstText(row.engine_id, row.database_id, row.app_id);
		if (!id || databases.has(id)) continue;
		databases.set(id, {
			engine_id: id,
			engine_name:
				firstText(
					row.engine_display_name,
					row.engine_name,
					row.database_name,
					row.app_name,
				) ?? id,
			engine_type:
				firstText(row.engine_type, row.database_type, row.app_type) ??
				"DATABASE",
			engine_subtype: firstText(
				row.engine_subtype,
				row.database_subtype,
				row.app_subtype,
			),
		});
	}
	return [...databases.values()];
};
