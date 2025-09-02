import { Schema } from "@mui/icons-material";
import { MermaidBlockMenu } from "../../settings/custom/mermaid/MermaidBlockMenu";
import { BLOCK_TYPE_MERMAID } from "../block-defaults.constants";
import type { BlockSettingsConfig } from "../settings.types";

export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_MERMAID,
	icon: Schema,
	menu: MermaidBlockMenu,
};
