import { Code2 } from "lucide-react";
import { HTMLBlockMenu } from "../../settings/custom/html/HTMLBlockMenu";
import { BLOCK_TYPE_DISPLAY } from "../block-defaults.constants";
import type { BlockSettingsConfig } from "../settings.types";

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_DISPLAY,
	icon: Code2,
	menu: HTMLBlockMenu,
};
