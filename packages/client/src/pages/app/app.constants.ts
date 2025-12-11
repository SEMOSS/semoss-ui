import type { Block } from "@semoss/renderer";

export const BASE_PAGE_BLOCKS: Record<string, Block> = {
	"page-1": {
		id: "page-1",
		widget: "page",
		parent: null,
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
				padding: "24px",
				gap: "8px",
				fontFamily: "roboto",
			},
			route: "",
		},
		listeners: {
			onPageLoad: {
				type: "sync",
				order: [],
			},
		},
		slots: {
			content: {
				name: "content",
				children: ["container--1"],
			},
		},
	},
	"container--1": {
		id: "container--1",
		widget: "container",
		parent: {
			id: "page-1",
			slot: "content",
		},
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
				flexWrap: "wrap",
				padding: "4px",
				gap: "8px",
				overflow: "hidden",
			},
		},
		listeners: {
			preProcess: {
				type: "sync",
				order: [],
			},
		},
		slots: {
			children: {
				name: "children",
				children: ["text--1"],
			},
		},
	},
	"text--1": {
		id: "text--1",
		widget: "text",
		parent: {
			id: "container--1",
			slot: "children",
		},
		data: {
			style: {
				padding: "4px",
				whiteSpace: "pre-line",
				textOverflow: "ellipsis",
				overflow: "auto",
			},
			text: "Welcome to the UI Builder! Drag and drop blocks to use in your app.",
		},
		listeners: {
			preProcess: {
				type: "sync",
				order: [],
			},
		},
		slots: {},
	},
};

export const BASE_APP_QUERIES = {
	mcp_driver: {
		id: "mcp_driver",
		cells: [
			{
				id: "1",
				widget: "code",
				parameters: {
					code: "",
					type: "pixel",
				},
			},
		],
	},
};

export const BASE_APP_VARIABLES = {
	mcp_driver: {
		type: "query",
		to: "mcp_driver",
	},
	"mcp_driver--1": {
		type: "cell",
		to: "mcp_driver",
		cellId: "1",
	},
};

export const MCP_FILE_NAMES = ["mcp_driver.py"];

export const MCP_JSON_FILE_NAMES = ["py_mcp.json", "pixel_mcp.json"];

export const MCP_NOTEBOOK_NAME = "mcp_driver";
