import { BlockConfig } from "../../../store";
import { MermaidBlock, MermaidBlockDef } from "./MermaidBlock";
import { BLOCK_TYPE_MERMAID } from "../block-defaults.constants";

export const config: BlockConfig<MermaidBlockDef> = {
    widget: "mermaid",
    type: BLOCK_TYPE_MERMAID,
    data: {
        text: "",
    },
    listeners: {},
    slots: {},
    render: MermaidBlock,
};
