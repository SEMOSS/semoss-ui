import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_CHART } from "../block-defaults.constants";
import {
	VegaVisualizationBlock,
	type VegaVisualizationBlockDef,
} from "./VegaVisualizationBlock";

export const config: BlockConfig<VegaVisualizationBlockDef> = {
	widget: "vega",
	type: BLOCK_TYPE_CHART,
	data: {
		specJson: "",
		variation: undefined,
	},
	listeners: {},
	slots: {},
	render: VegaVisualizationBlock,
};
