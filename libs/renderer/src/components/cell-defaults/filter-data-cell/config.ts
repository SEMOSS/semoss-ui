import { CellConfig } from "../../../store";
import { FilterDataCell, FilterDataCellDef } from "./FilterDataCell";

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
