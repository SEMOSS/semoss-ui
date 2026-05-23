import type { CellConfig } from "../../../store";
import { QueryImportCell, type QueryImportCellDef } from "./query-import-cell";

export const QueryImportCellConfig: CellConfig<QueryImportCellDef> = {
	name: "Custom Query",
	widget: "query-import",
	view: QueryImportCell,
	parameters: {
		databaseId: "",
		frameType: "PY",
		frameVariableName: "",
		selectQuery: "",
	},
	toPixel: ({ databaseId, frameType, frameVariableName, selectQuery }) => {
		return `Database( database=["${databaseId}"] ) | Query("<encode>${selectQuery}</encode>") | Import(frame=[CreateFrame(frameType=[${frameType}], override=[true]).as(["${frameVariableName}"])]);`;
	},
};
