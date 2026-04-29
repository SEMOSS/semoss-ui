import CHATAI from "@/assets/img/DragDrop.png";
import { TEMPLATE_ACTION_MESSAGES } from "./action-messages";
import type { Template } from "./templates.types";

// TODO: Designs
export const NLPToGridTemplate: Template = {
	name: "NLP Query To Grid",
	description: "User text to data in a database",
	image: CHATAI,
	author: "SYSTEM",
	lastUpdatedDate: new Date().toISOString(),
	tags: [],
	state: {
		queries: {
			"nlp-query": {
				id: "nlp-query",
				cells: [
					{
						id: "1",
						widget: "text-to-sql",
						parameters: {
							databaseId: "950eb187-e352-444d-ad6a-6476ed9390af",
							userQuery: "{{input--1}}",
							frameVariableName: "FRAME_1234",
							model: "9adae906-f585-4a8a-b932-4e7237f81b8d",
							dataFrameId: "",
							dataFrameQuery: "",
							targetCell: {
								id: "",
								frameVariableName: "",
							},
						},
					},
					{
						id: "2",
						widget: "query-import",
						parameters: {
							databaseId: "950eb187-e352-444d-ad6a-6476ed9390af",
							frameType: "PY",
							frameVariableName: "FRAME_68888",
							selectQuery: "{{nlp-query--1.output.sql}}",
						},
					},
				],
			},
		},
		blocks: {
			"button--1": {
				parent: {
					id: "page-1",
					slot: "content",
				},
				slots: {},
				widget: "button",
				data: {
					color: "primary",
					variant: "contained",
					show: true,
					style: {},
					disabled: false,
					label: "Fetch Data",
					loading: "",
					type: "button",
				},
				listeners: {
					onClick: {
						type: "sync",
						order: [
							{
								payload: {
									cellId: "1",
									queryId: "nlp-query",
								},
								message: TEMPLATE_ACTION_MESSAGES.RUN_CELL,
							},
							{
								payload: {
									cellId: "2",
									queryId: "nlp-query",
								},
								message: TEMPLATE_ACTION_MESSAGES.RUN_CELL,
							},
						],
					},
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "button--1",
				communityBlockMapping: {},
			},
			"grid-dynamic-frame--1": {
				parent: {
					id: "container--1",
					slot: "children",
				},
				slots: {},
				widget: "grid-dynamic-frame",
				data: {
					view: {
						pagination: true,
					},
					columns: [],
					style: {
						flexWrap: "wrap",
						flexDirection: "row",
						display: "flex",
						width: "100%",
						height: "650px",
					},
					frame: {
						name: "FRAME_68888",
					},
					option: {},
				},
				listeners: {},
				id: "grid-dynamic-frame--1",
				communityBlockMapping: {},
			},
			"page-1": {
				slots: {
					content: {
						children: [
							"text--2",
							"text--1",
							"input--1",
							"button--1",
							"container--1",
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
						gap: "16px",
					},
					loading: "{{nlp-query.isLoading}}",
				},
				listeners: {
					onPageLoad: {
						type: "sync",
						order: [],
					},
				},
				id: "page-1",
			},
			"input--1": {
				parent: {
					id: "page-1",
					slot: "content",
				},
				slots: {
					content: {
						children: [],
						name: "content",
					},
				},
				widget: "input",
				data: {
					hint: "",
					multiline: false,
					show: "true",
					style: {
						padding: "4px",
						width: "100%",
					},
					disabled: false,
					label: "Enter user query",
					type: "text",
					rows: 3,
					loading: false,
					value: "People over the age of 50",
					required: false,
				},
				listeners: {
					onChange: {
						type: "sync",
						order: [],
					},
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "input--1",
				communityBlockMapping: {},
			},
			"text--2": {
				id: "text--2",
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
					text: "Natural Language Query to Grid",
					variant: "h1",
					show: "true",
					loading: false,
					loadType: "Skeleton",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
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
						padding: "4px",
						gap: "8px",
						flexWrap: "wrap",
						border: "0px  ",
						width: "100%",
					},
					show: "true",
					loading: false,
					loadType: "Skeleton",
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
						children: ["grid-dynamic-frame--1"],
					},
				},
				communityBlockMapping: {},
			},
			"text--1": {
				id: "text--1",
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
					text: "Ask your query on the diabetes dataset",
					variant: "p",
					show: "true",
					loading: false,
					loadType: "Skeleton",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
		},
		variables: {
			"input--1": {
				to: "input--1",
				type: "block",
			},
			"nlp-query": {
				type: "query",
				to: "nlp-query",
			},
			"nlp-query--1": {
				type: "cell",
				to: "nlp-query",
				cellId: "1",
			},
			"nlp-query--2": {
				type: "cell",
				to: "nlp-query",
				cellId: "2",
			},
		},
		executionOrder: ["nlp-query"],
		version: "1.0.0-alpha.16",
	},
};
