import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_MERMAID } from "../block-defaults.constants";
import { MermaidBlock, type MermaidBlockDef } from "./MermaidBlock";

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
