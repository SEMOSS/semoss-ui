import type { CellConfig } from "../../../store";
import { DataImportCell, type DataImportCellDef } from "./DataImportCell";

export const DataImportCellConfig: CellConfig<DataImportCellDef> = {
	name: "Data Import",
	widget: "data-import",
	view: DataImportCell,
	parameters: {
		frameVariableName: "",
		selectQuery: "",
		databaseId: "",
		frameType: "PY",
		rootTable: "",
		selectedColumns: [],
		columnAliases: [],
		tableNames: [],
		joins: [],
		dataLimit: null,
		enableBatching: false,
		batchSize: 100,
		currentOffset: 0,
		// TODO add filters and summaries
		// filters: [],
		// summaries: [],
	},
	toPixel: ({
		frameType,
		frameVariableName,
		selectQuery,
		enableBatching,
		batchSize,
		currentOffset,
	}) => {
		let modifiedQuery = selectQuery;

		// If batching is enabled, add Offset and Limit reactors
		if (
			enableBatching &&
			batchSize !== undefined &&
			currentOffset !== undefined
		) {
			// Remove the trailing semicolon if present
			const trimmedQuery = selectQuery.trim().replace(/;$/, "");

			// Remove any existing Limit reactor
			const queryWithoutLimit = trimmedQuery.replace(
				/\s*\|\s*Limit\s*\(\s*[^)]*\s*\)/,
				"",
			);

			// Add Offset and Limit reactors
			// Pattern: | Offset(currentOffset) | Limit(batchSize)
			modifiedQuery = `${queryWithoutLimit} | Offset ( ${currentOffset} ) | Limit ( ${batchSize} )`;
		}

		// Remove trailing semicolon for concatenation
		const queryWithoutSemicolon = modifiedQuery.trim().replace(/;$/, "");

		return (
			queryWithoutSemicolon +
			` | Import ( frame = [ CreateFrame ( frameType = [ ${frameType} ] , override = [ true ] ) .as ( [ "${frameVariableName}" ] ) ] ) ; `
		);
	},
};
