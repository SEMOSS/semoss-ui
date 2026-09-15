export const BLOCK_TYPE_ACTION = "action";
export const BLOCK_TYPE_CHART = "visualization";
export const BLOCK_TYPE_DISPLAY = "display";
export const BLOCK_TYPE_INPUT = "input";
export const BLOCK_TYPE_LAYOUT = "layout";
export const BLOCK_TYPE_DATA = "data";
export const BLOCK_TYPE_MERMAID = "mermaid";
export const BLOCK_TYPE_THEME = "theme";

export const DEFAULT_TRUE_VARIABLE = {
	true: {
		blockType: "boolean",
		display: "True",
		id: "true",
		path: undefined,
		type: "true",
		variabilized: true,
		groupAlias: "Others",
	},
};
export const DEFAULT_FALSE_VARIABLE = {
	false: {
		blockType: "boolean",
		display: "False",
		id: "false",
		path: undefined,
		type: "false",
		variabilized: true,
		groupAlias: "Others",
	},
};
