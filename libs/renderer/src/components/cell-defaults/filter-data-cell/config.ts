import type { CellConfig } from "../../../store";
import { FilterDataCell, type FilterDataCellDef } from "./filter-data-cell";

export const FilterDataCellConfig: CellConfig<FilterDataCellDef> = {
	name: "FilterData",
	widget: "filter-data",
	view: FilterDataCell,
	parameters: {
		frameName: "",
		filterQuery: "",
		targetCell: {
			id: "",
			frameVariableName: "",
		},
	},
	toPixel: ({ frameName, filterQuery }) => {
		console.log("FilterDataCellConfig toPixel", filterQuery);
		return `META | ${frameName} | SetFrameFilter( ${filterQuery});`;
	},
};
