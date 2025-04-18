import { ActionMessages } from "./state.actions";

export const INPUT_BLOCK_TYPES = [
    "audio-input",
    "input",
    "select",
    "upload",
    "checkbox",
    "toggle-button",
    "radio",
    "slider",
    "ratings",
    "switch",
    "timepicker",
];

export const VARIABLE_TYPES = [
    "block",
    "cell",
    "query",
    "database",
    "model",
    "vector",
    "storage",
    "function",
    "string",
    "number",
    "date",
    "array",
    "JSON",
    // 'LLM Comparison',
];

export const ACTIONS_DISPLAY = {
    [ActionMessages.RUN_QUERY]: "Run Query",
    [ActionMessages.DISPATCH_EVENT]: "Dispatch Event",
    [ActionMessages.DISPATCH_OUTPUTS_EVENT]: "Dispatch App Outputs"
};
