import { TrendingUp } from "lucide-react";
import { VegaVisualizationBlockMenu } from "../../settings/custom/vega/VegaVisualizationBlockMenu";
import { BLOCK_TYPE_CHART } from "../block-defaults.constants";
import type { BlockSettingsConfig } from "../settings.types";

export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_CHART,
	icon: TrendingUp,
	menu: VegaVisualizationBlockMenu,
};
