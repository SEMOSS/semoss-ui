import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_CHART } from "../block-defaults.constants";
import {
	type EchartVisualizationBlockDef,
	VisualizationBlock,
} from "./VisualizationBlock";

export const config: BlockConfig<EchartVisualizationBlockDef> = {
	widget: "e-chart",
	type: BLOCK_TYPE_CHART,
	data: {
		style: {
			display: "flex",
			// flexDirection: 'column',
			padding: "4px",
			gap: "8px",
			// flexWrap: 'wrap',
			width: 450,
			height: 350,
		},
		option: {},
		variation: "",
		frame: {
			name: "",
		},
		columns: [],
		aggregate: {},
		contextMenu: {
			hideFilter: false,
			hideUnfilter: false,
			hideExclude: false,
		},
		show: true,
		facet: {
			facetList: [],
			facetSelected: [],
		},
	},
	listeners: {
		preProcess: {
			type: "sync",
			order: [],
		},
	},
	slots: {},
	render: VisualizationBlock,
};
