import type { CellConfig } from "../../../store";
import TextToSqlCell, { type TextToSqlCellDef } from "./TextToSqlCell";

const sanitizeQuery = (query: string): string => {
    return query
        .replace(/<script.*?>.*?<\/script>/gi, "") // Remove script tags and encode angle brackets
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, '\\"');
};

export const TextToSqlCellConfig: CellConfig<TextToSqlCellDef> = {
    name: "TexttoSQL",
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
    toPixel: ({
        frameVariableName,
        userQuery,
        model,
    }) => {
        const userQuerySanitized = sanitizeQuery(userQuery);
        return `NLPQuery3(command=["${userQuerySanitized}"], json=true, tokenCount=["${userQuerySanitized.length}"],  frame = [${frameVariableName}], allFrames = [""], dialect = [""], engine=["${model}"])`;
    },
};
