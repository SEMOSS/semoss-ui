import { Link } from "@mui/icons-material";
import { VisualizationFilterMenu } from "../../settings/custom/visualization-filter/VisualizationFilterMenu";
import { BLOCK_TYPE_CHART } from "../block-defaults.constants";
import type { BlockSettingsConfig } from "../settings.types";

export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_CHART,
	icon: Link,
	menu: VisualizationFilterMenu,
};
