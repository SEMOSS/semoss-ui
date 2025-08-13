import type { BlockConfig } from "../../../store";
import { BLOCK_TYPE_CHART } from "../block-defaults.constants";
import {
	VisualizationFilterBlock,
	type VisualizationFilterBlockDef,
} from "./VisualizationFilterBlock";

export const config: BlockConfig<VisualizationFilterBlockDef> = {
	widget: "visualization-filter",
	type: BLOCK_TYPE_CHART,
	data: {
		style: {
			padding: "4px",
			whiteSpace: "pre-line",
			textOverflow: "ellipsis",
		},
		displayType: "",
		frame: "",
		column: "",
		showPanelTitle: false,
		searchable: false,
		multipleSelection: false,
		show: "true",
		filterLabel: "",
		sliderSensitivity: 0,
		listOptions: [],
		selectedValues: [],
		color: "secondary",
		size: "medium",
	},
	listeners: {
		preProcess: {
			type: "sync",
			order: [],
		},
	},
	slots: {},
	render: VisualizationFilterBlock,
};
