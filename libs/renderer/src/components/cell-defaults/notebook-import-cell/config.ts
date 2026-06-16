import type { CellConfig } from "../../../store";
import {
	NotebookImportCell,
	type NotebookImportCellDef,
} from "./notebook-import-cell";

export const NotebookImportCellConfig: CellConfig<NotebookImportCellDef> = {
	name: "Custom Query",
	widget: "query-import",
	view: NotebookImportCell,
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
