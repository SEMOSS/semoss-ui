import { ActionMessages } from "@semoss/renderer";
import CHATAI from "@/assets/img/query.jpeg";
import type { Template } from "./templates.types";

export const AskLLMTemplate: Template = {
	name: "Ask LLM",
	description: "Ask an LLM a question",
	image: CHATAI,
	author: "SYSTEM",
	lastUpdatedDate: new Date().toISOString(),
	tags: ["LLM"],
	state: {
		queries: {
			"ask-llm": {
				id: "ask-llm",
				cells: [
					{
						id: "cell-1",
						widget: "code",
						parameters: {
							code: 'LLM(engine=["{{model}}"], command=["{{question}}"]);',
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
						children: ["title", "description", "form", "response"],
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
			form: {
				parent: {
					id: "container",
					slot: "children",
				},
				slots: {
					children: {
						children: ["question", "submit"],
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
					value: "",
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
					loading: "{{ask-llm.isLoading}}",
				},
				listeners: {
					onClick: {
						type: "sync",
						order: [
							{
								payload: {
									queryId: "ask-llm",
								},
								message: ActionMessages.RUN_QUERY,
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
			response: {
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
						textOverflow: "ellipsis",
					},
					text: "{{ask-llm.output.response}}",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "response",
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
					text: "Ask an LLM a question",
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
					text: "Ask LLM",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "title",
			},
		},
		variables: {
			question: {
				to: "question",
				type: "block",
			},
			"ask-llm": {
				to: "ask-llm",
				type: "query",
			},
			model: {
				type: "model",
				value: "4acbe913-df40-4ac0-b28a-daa5ad91b172",
			},
			"ask-llm--cell-1": {
				type: "cell",
				to: "ask-llm",
				cellId: "cell-1",
			},
		},
		executionOrder: ["ask-llm"],
		version: "1.0.0-alpha.10",
	},
};
