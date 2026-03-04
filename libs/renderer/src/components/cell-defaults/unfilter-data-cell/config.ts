import type { CellConfig } from "../../../store";
import { UnFilterDataCell, type UnFilterDataCellDef } from "./UnFilterDataCell";

export const UnFilterDataCellConfig: CellConfig<UnFilterDataCellDef> = {
	name: "UnFilterData",
	widget: "unfilter-data",
	view: UnFilterDataCell,
	parameters: {
		frameName: "",
		unfilterQuery: "",
		targetCell: {
			id: "",
			frameVariableName: "",
		},
	},
	toPixel: ({ frameName, unfilterQuery }) => {
		console.log("FilterDataCellConfig toPixel", unfilterQuery);
		return `META | UnfilterFrame(${frameName});`;
	},
};
