import type { CellConfig } from "../../../store";
import { DataImportCell, type DataImportCellDef } from "./data-import-cell";

export const DataImportCellConfig: CellConfig<DataImportCellDef> = {
	name: "Query Builder",
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
		// TODO add filters and summaries
		// filters: [],
		// summaries: [],
	},
	toPixel: ({ frameType, frameVariableName, selectQuery }) => {
		const queryWithoutSemicolon = selectQuery.trim().replace(/;$/, "");

		return (
			queryWithoutSemicolon +
			` | Import ( frame = [ CreateFrame ( frameType = [ ${frameType} ] , override = [ true ] ) .as ( [ "${frameVariableName}" ] ) ] ) ; `
		);
	},
};
