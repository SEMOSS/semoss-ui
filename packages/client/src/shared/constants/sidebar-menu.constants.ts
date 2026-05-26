import {
	Blocks,
	Braces,
	Folder,
	Layers,
	Notebook,
	Settings,
	Terminal,
} from "lucide-react";

export const SIDEBAR_MENU = {
	MENU: [
		{
			name: "Settings",
			icon: {
				component: Settings,
				tooltip: "Settings",
			},
		},
		{
			name: "Notebooks",
			icon: {
				component: Notebook,
				tooltip: "Notebooks",
			},
		},
		{
			name: "Files",
			icon: {
				component: Folder,
				tooltip: "Files",
			},
		},
		{
			name: "Variables",
			icon: {
				component: Braces,
				tooltip: "Variables",
			},
		},
		{
			name: "Blocks",
			icon: {
				component: Blocks,
				tooltip: "Blocks",
			},
		},
		{
			name: "Layers",
			icon: {
				component: Layers,
				tooltip: "Layers",
			},
		},
		{
			name: "Terminal",
			icon: {
				component: Terminal,
				tooltip: "Terminal",
			},
		},
	],
};
