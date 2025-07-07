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
        dataFrameId: "",
        dataFrameQuery: "",
        targetCell: {
            id: "",
            frameVariableName: "",
        },
    },
    toPixel: ({ databaseId, frameVariableName, userQuery, model, dataFrameId, dataFrameQuery }) => {
        if(dataFrameId !== ""){
            return `Frame(frame=[${dataFrameId}]) | Query("<encode>${dataFrameQuery}</encode>") | CollectAll()`;
        }
        return `NLPQuery3(command=["${userQuery}"], json=true, tokenCount=["${userQuery.length}"],  frame = [${frameVariableName}], allFrames = [""], dialect = [""], engine=["${model}"])`;
    },
};