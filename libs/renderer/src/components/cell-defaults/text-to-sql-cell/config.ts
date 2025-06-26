import { CellConfig } from "../../../store";
import TextToSqlCell, { TextToSqlCellDef } from "./TextToSqlCell";

export const TextToSqlCellConfig: CellConfig<TextToSqlCellDef> = {
    name: "FilterData",
    widget: "text-to-sql",
    view: TextToSqlCell,
    parameters: {
        databaseId: "",
        userQuery: "",
        frameVariableName: "",
        model: "",
        targetCell: {
            id: "",
            frameVariableName: "",
        },
    },
    toPixel: ({ frameVariableName, userQuery, model }) => {
        // console.log("FilterDataCellConfig toPixel", filterQuery);
        return `NLPQuery3(command='${userQuery}', tokenÇount=${userQuery.length}, frame='${frameVariableName}', engine='${model}');`;
    },
};