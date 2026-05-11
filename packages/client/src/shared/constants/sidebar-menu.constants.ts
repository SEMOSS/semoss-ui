import { Terminal } from "lucide-react";
import BLOCKS from "@/assets/img/BLOCKS.svg";
import BLOCKS_SELECTED from "@/assets/img/BLOCKS_SELECTED.svg";
import FILES from "@/assets/img/FILES.svg";
import FILES_SELECTED from "@/assets/img/FILES_SELECTED.svg";
import LAYERS from "@/assets/img/LAYERS.svg";
import LAYERS_SELECTED from "@/assets/img/LAYERS_SELECTED.svg";
import NOTEBOOK from "@/assets/img/NOTEBOOK.svg";
import NOTEBOOK_SELECTED from "@/assets/img/NOTEBOOK_SELECTED.svg";
import SETTINGS_SELECTED from "@/assets/img/SETTING_SELECTED.svg";
import SETTINGS from "@/assets/img/SETTINGS.svg";
import VARIABLES from "@/assets/img/VARIABLE.svg";
import VARIABLES_SELECTED from "@/assets/img/VARIABLES_SELECTED.svg";

export const SIDEBAR_MENU = {
	MENU: [
		{
			name: "Settings",
			icon: { default: SETTINGS, active: SETTINGS_SELECTED },
		},
		{
			name: "Notebooks",
			icon: { default: NOTEBOOK, active: NOTEBOOK_SELECTED },
		},
		{
			name: "Files",
			icon: { default: FILES, active: FILES_SELECTED },
		},
		{
			name: "Variables",
			icon: { default: VARIABLES, active: VARIABLES_SELECTED },
		},
		{
			name: "Blocks",
			icon: { default: BLOCKS, active: BLOCKS_SELECTED },
		},
		{
			name: "Layers",
			icon: { default: LAYERS, active: LAYERS_SELECTED },
		},
		{
			name: "Terminal",
			icon: {
				default: NOTEBOOK,
				active: NOTEBOOK_SELECTED,
				component: Terminal,
				tooltip: "Terminal",
			},
		},
	],
};
