import QUERY from "@/assets/img/DragDrop.png";
import { TEMPLATE_ACTION_MESSAGES } from "./action-messages";
import type { Template } from "./templates.types";

export const AskCSVTemplate: Template = {
	name: "Ask CSV",
	description: "Query a CSV, generate SQL, and see results",
	image: QUERY,
	author: "SYSTEM",
	lastUpdatedDate: new Date().toISOString(),
	tags: ["NLP", "SQL", "LLM"],
	state: {
		queries: {
			"ask-model": {
				id: "ask-model",
				cells: [
					{
						id: "file-read",
						widget: "code",
						parameters: {
							code: 'FileRead ( filePath = ["{{file}}"], delimiter=",") | Import ( frame = [ CreateFrame ( frameType = [ PY ] , override = [ true ] ) .as ( [ "NLP_FRAME" ] ) ] );',
							type: "pixel",
						},
					},
					{
						id: "py-query-function",
						widget: "code",
						parameters: {
							code: 'NLPQuery2(engine=["{{model}}"], command=["{{question}}"]);',
							type: "pixel",
						},
					},
				],
			},
		},
		blocks: {
			container: {
				parent: {
					id: "page-1",
					slot: "content",
				},
				slots: {
					children: {
						children: ["title", "description", "form"],
						name: "children",
					},
				},
				widget: "container",
				data: {
					style: {
						padding: "4px",
						flexWrap: "wrap",
						flexDirection: "column",
						display: "flex",
						gap: "8px",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "container",
			},
			file: {
				parent: {
					id: "form",
					slot: "children",
				},
				slots: {},
				widget: "upload",
				data: {
					style: {
						padding: "4px",
						width: "100%",
					},
					label: "Upload",
					required: true,
					value: "\\diabetes.csv",
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
				id: "file",
			},
			form: {
				parent: {
					id: "container",
					slot: "children",
				},
				slots: {
					children: {
						children: [
							"file",
							"question",
							"submit",
							"container--2124",
						],
						name: "children",
					},
				},
				widget: "container",
				data: {
					style: {
						padding: "4px",
						flexWrap: "wrap",
						flexDirection: "column",
						display: "flex",
						gap: "8px",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "form",
			},
			question: {
				parent: {
					id: "form",
					slot: "children",
				},
				slots: {},
				widget: "input",
				data: {
					style: {
						padding: "4px",
						width: "100%",
					},
					label: "Question",
					rows: 3,
					type: "text",
					required: true,
				},
				listeners: {
					onClick: {
						type: "sync",
						order: [],
					},
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "question",
			},
			submit: {
				parent: {
					id: "form",
					slot: "children",
				},
				slots: {},
				widget: "button",
				data: {
					variant: "contained",
					style: {},
					label: "Ask",
					loading: "{{ask-model.isLoading}}",
				},
				listeners: {
					onClick: {
						type: "sync",
						order: [
							{
								payload: {
									queryId: "ask-model",
								},
								message: TEMPLATE_ACTION_MESSAGES.RUN_NOTEBOOK,
							},
						],
					},
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "submit",
			},
			"page-1": {
				slots: {
					content: {
						children: ["container"],
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
				},
				listeners: {
					onPageLoad: {
						type: "sync",
						order: [],
					},
				},
				id: "page-1",
			},
			description: {
				parent: {
					id: "container",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						fontSize: "1.25rem",
						textOverflow: "ellipsis",
					},
					text: "Upload a csv file and ask a question",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "description",
			},
			title: {
				parent: {
					id: "container",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						fontSize: "1.5rem",
						textOverflow: "ellipsis",
					},
					text: "CSV Query",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "title",
			},
			"container--2124": {
				id: "container--2124",
				widget: "container",
				parent: {
					id: "form",
					slot: "children",
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
						blurRadius: "10px",
						spreadRadius: "0px",
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
						children: ["grid-dynamic-frame--537"],
					},
				},
			},
			"grid-dynamic-frame--537": {
				id: "grid-dynamic-frame--537",
				widget: "grid-dynamic-frame",
				parent: {
					id: "container--2124",
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
						height: "auto%",
					},
				},
				listeners: {},
				slots: {},
			},
		},
		variables: {
			file: {
				to: "file",
				type: "block",
			},
			question: {
				to: "question",
				type: "block",
			},
			"ask-model--py-query-function": {
				to: "ask-model",
				type: "cell",
				cellId: "py-query-function",
			},
			model: {
				type: "model",
				value: "4acbe913-df40-4ac0-b28a-daa5ad91b172",
			},
			"ask-model": {
				to: "ask-model",
				type: "query",
			},
			"ask-model--file-read": {
				to: "ask-model",
				type: "cell",
				cellId: "file-read",
			},
		},
		executionOrder: ["ask-model"],
		version: "1.0.0-alpha.11",
	},
};
