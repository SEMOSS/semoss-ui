import { TableChart } from "@mui/icons-material";
import { GridBlockMenu } from "./../../settings/custom/grid-two/GridBlockMenu";
import { BLOCK_TYPE_DATA } from "../block-defaults.constants";
import type { BlockSettingsConfig } from "../settings.types";

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_DATA,
	icon: TableChart,
	menu: GridBlockMenu,
};
