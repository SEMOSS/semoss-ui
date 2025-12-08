import type { CellConfig } from "../../../store";
import { QueryImportCell, type QueryImportCellDef } from "./QueryImportCell";

export const QueryImportCellConfig: CellConfig<QueryImportCellDef> = {
	name: "Import",
	widget: "query-import",
	view: QueryImportCell,
	parameters: {
		databaseId: "",
		frameType: "PY",
		frameVariableName: "",
		selectQuery: "",
		enableBatching: false,
		batchSize: 100,
		currentOffset: 0,
	},
	toPixel: ({
		databaseId,
		frameType,
		frameVariableName,
		selectQuery,
		enableBatching,
		batchSize,
		currentOffset,
	}) => {
		let query = selectQuery;

		// If batching is enabled, inject LIMIT and OFFSET into the SQL query
		if (
			enableBatching &&
			batchSize !== undefined &&
			currentOffset !== undefined
		) {
			// Ensure the query has ORDER BY for consistent pagination
			const trimmedQuery = selectQuery.trim();
			const hasOrderBy = /ORDER\s+BY/i.test(trimmedQuery);

			if (!hasOrderBy) {
				console.warn(
					"[QueryImportCell] Query lacks ORDER BY clause - pagination results may be inconsistent",
				);
			}

			query = `${trimmedQuery} LIMIT ${batchSize} OFFSET ${currentOffset}`;
		}

		// Always import with override=true - GridBlock handles client-side accumulation
		return `Database( database=["${databaseId}"] ) | Query("<encode>${query}</encode>") | Import(frame=[CreateFrame(frameType=[${frameType}], override=[true]).as(["${frameVariableName}"])]);`;
	},
};
