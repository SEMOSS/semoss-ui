import { ActionMessages } from "@semoss/renderer";
import QUERY from "@/assets/img/query.jpeg";
import type { Template } from "./templates.types";

export const VisualizeCSVTemplate: Template = {
	name: "Visualize CSV",
	description: "Upload CSV, and visualize data via grid",
	image: QUERY,
	author: "SYSTEM",
	lastUpdatedDate: new Date().toISOString(),
	tags: ["CSV"],
	state: {
		queries: {
			"pull-data-from-upload": {
				id: "pull-data-from-upload",
				cells: [
					{
						id: "1",
						widget: "code",
						parameters: {
							code: 'FileRead ( filePath = ["{{file}}"], delimiter=",") | Import ( frame = [ CreateFrame ( frameType = [ PY ] , override = [ true ] ) .as ( [ "NLP_FRAME" ] ) ] );',
							type: "pixel",
						},
					},
				],
			},
		},
		blocks: {
			"page-1": {
				slots: {
					content: {
						children: [
							"text--5334",
							"text--6511",
							"divider--1603",
							"container--3347",
							"container--9973",
							"container--7056",
						],
						name: "content",
					},
				},
				widget: "page",
				data: {
					route: "",
					style: {
						padding: "24px",
						fontFamily: "roboto",
						flexDirection: "column",
						display: "flex",
						gap: "8px",
					},
					loading: "{{pull-data-from-upload.isLoading}}",
				},
				listeners: {
					onPageLoad: {
						type: "sync",
						order: [],
					},
				},
				id: "page-1",
			},
			"container--3347": {
				id: "container--3347",
				widget: "container",
				parent: {
					id: "page-1",
					slot: "content",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "column",
						padding: "4px",
						gap: "8px",
						flexWrap: "wrap",
					},
					show: "true",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "",
						spreadRadius: "",
						color: "",
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
						children: ["upload--5885", "divider--4292"],
					},
				},
			},
			"upload--5885": {
				id: "upload--5885",
				widget: "upload",
				parent: {
					id: "container--3347",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "Example Input",
					hint: "",
					loading: false,
					disabled: false,
					required: false,
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
					onChange: {
						type: "sync",
						order: [
							{
								message: ActionMessages.RUN_QUERY,
								payload: {
									queryId: "pull-data-from-upload",
								},
							},
						],
					},
				},
				slots: {
					content: {
						name: "content",
						children: [],
					},
				},
			},
			"divider--4292": {
				id: "divider--4292",
				widget: "divider",
				parent: {
					id: "container--3347",
					slot: "children",
				},
				data: {
					style: {
						padding: "0px",
						width: "100%",
					},
					variant: "fullWidth",
					orientation: "horizontal",
					textAlign: "center",
					flexItem: false,
					light: false,
					text: "",
					showText: false,
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
			},
			"text--5334": {
				id: "text--5334",
				widget: "text",
				parent: {
					id: "page-1",
					slot: "content",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: "Visualize data from upload",
					variant: "h1",
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
			},
			"text--6511": {
				id: "text--6511",
				widget: "text",
				parent: {
					id: "page-1",
					slot: "content",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: "This app allows you to upload a CSV file shows data from it in our dynamic data grid",
					variant: "h5",
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
			},
			"divider--1603": {
				id: "divider--1603",
				widget: "divider",
				parent: {
					id: "page-1",
					slot: "content",
				},
				data: {
					style: {
						padding: "0px",
						width: "100%",
					},
					variant: "fullWidth",
					orientation: "horizontal",
					textAlign: "center",
					flexItem: false,
					light: false,
					text: "",
					showText: false,
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
			},
			"text--7057": {
				id: "text--7057",
				widget: "text",
				parent: {
					id: "container--9973",
					slot: "children",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: "Aliased as:",
					variant: "p",
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
			},
			"container--9973": {
				id: "container--9973",
				widget: "container",
				parent: {
					id: "page-1",
					slot: "content",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "row",
						padding: "4px",
						gap: "8px",
						flexWrap: "wrap",
					},
					show: "true",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "",
						spreadRadius: "",
						color: "",
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
						children: ["text--7057", "text--6981"],
					},
				},
			},
			"text--6981": {
				id: "text--6981",
				widget: "text",
				parent: {
					id: "container--9973",
					slot: "children",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
						fontWeight: "bold",
					},
					text: "NLP_FRAME",
					variant: "p",
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
			},
			"container--7056": {
				id: "container--7056",
				widget: "container",
				parent: {
					id: "page-1",
					slot: "content",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "column",
						padding: "4px",
						gap: "8px",
						flexWrap: "wrap",
						border: "0px  ",
						height: "px",
					},
					show: "true",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "10px",
						spreadRadius: "",
						color: "#d0d5fc",
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
						children: ["grid-dynamic-frame--9627"],
					},
				},
			},
			"grid-dynamic-frame--9627": {
				id: "grid-dynamic-frame--9627",
				widget: "grid-dynamic-frame",
				parent: {
					id: "container--7056",
					slot: "children",
				},
				data: {
					frame: {
						name: "NLP_FRAME",
					},
					option: {},
					columns: [],
					view: {
						pagination: true,
					},
					style: {
						display: "flex",
						flexDirection: "row",
						flexWrap: "wrap",
						width: "100%",
						height: "350px",
					},
				},
				listeners: {},
				slots: {},
			},
		},
		variables: {
			"pull-data-from-upload": {
				type: "query",
				to: "pull-data-from-upload",
			},
			"pull-data-from-upload--1": {
				type: "cell",
				to: "pull-data-from-upload",
				cellId: "1",
			},
			file: {
				type: "block",
				to: "upload--5885",
			},
		},
		executionOrder: ["pull-data-from-upload"],
		version: "1.0.0-alpha.11",
	},
};
