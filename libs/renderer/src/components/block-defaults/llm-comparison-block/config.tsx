import { BlockConfig } from "../../../store";
import {
    LLMComparisonBlock,
    LLMComparisonBlockDef,
} from "./LLMComparisonBlock";
import { BLOCK_TYPE_COMPARE } from "../block-defaults.constants";

export const config: BlockConfig<LLMComparisonBlockDef> = {
    widget: "llmComparison",
    type: BLOCK_TYPE_COMPARE,
    data: {
        queryId: "",
        cellId: "",
    },
    listeners: {},
    slots: {},
    render: LLMComparisonBlock,
};
