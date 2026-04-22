import { Link2 } from "lucide-react";
import { VisualizationFilterMenu } from "../../settings/custom/visualization-filter/VisualizationFilterMenu";
import { BLOCK_TYPE_CHART } from "../block-defaults.constants";
import type { BlockSettingsConfig } from "../settings.types";

export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_CHART,
	icon: Link2,
	menu: VisualizationFilterMenu,
};
