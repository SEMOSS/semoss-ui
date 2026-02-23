import { Grid3x3 } from "lucide-react";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import type { BlockSettingsConfig } from "../settings.types";

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_LAYOUT,
	icon: Grid3x3,
};
