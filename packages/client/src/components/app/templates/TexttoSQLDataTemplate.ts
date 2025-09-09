import { ActionMessages } from "@semoss/renderer";
import CHATAI from "@/assets/img/query.jpeg";
import type { Template } from "./templates.types";

// TODO:
// 1. Make this a better looking intake form for a Patient
export const TexttoSQLDataTemplate: Template = {
	name: "Text to SQL Data App",
	description: "User text to data in a database",
	image: CHATAI,
	author: "SYSTEM",
	lastUpdatedDate: new Date().toISOString(),
	tags: [],
	state: {
		queries: {
			Test: {
				id: "Test",
				cells: [
					{
						id: "2",
						widget: "text-to-sql",
						parameters: {
							databaseId: "950eb187-e352-444d-ad6a-6476ed9390af",
							userQuery: "{{input--1}}",
							frameVariableName: "FRAME_6927",
							model: "4801422a-5c62-421e-a00c-05c6a9e15de8",
							dataFrameId: "",
							dataFrameQuery: "",
							targetCell: {
								id: "",
								frameVariableName: "",
							},
						},
					},
					{
						id: "5",
						widget: "query-import",
						parameters: {
							databaseId: "950eb187-e352-444d-ad6a-6476ed9390af",
							frameType: "PY",
							frameVariableName: "FRAME_14096",
							selectQuery: "{{Test--2.output.sql}}",
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
							"text--1",
							"input--1",
							"button--1",
							"grid-dynamic-frame--1",
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
				id: "input--1",
				widget: "input",
				parent: {
					id: "page-1",
					slot: "content",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "Enter user query",
					hint: "",
					type: "text",
					rows: 3,
					multiline: false,
					disabled: false,
					required: false,
					loading: false,
					show: "true",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
					onChange: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					content: {
						name: "content",
						children: [],
					},
				},
				communityBlockMapping: {},
			},
			"button--1": {
				id: "button--1",
				widget: "button",
				parent: {
					id: "page-1",
					slot: "content",
				},
				data: {
					style: {},
					label: "Fetch Data",
					loading: "{{Test--2.isLoading}}",
					disabled: false,
					variant: "contained",
					color: "primary",
					show: true,
					type: "button",
				},
				listeners: {
					onClick: {
						type: "sync",
						order: [
							{
								message: ActionMessages.RUN_CELL,
								payload: {
									queryId: "Test",
									cellId: "2",
								},
							},
							{
								message: ActionMessages.RUN_CELL,
								payload: {
									queryId: "Test",
									cellId: "5",
								},
							},
						],
					},
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
				communityBlockMapping: {},
			},
			"grid-dynamic-frame--1": {
				id: "grid-dynamic-frame--1",
				widget: "grid-dynamic-frame",
				parent: {
					id: "page-1",
					slot: "content",
				},
				data: {
					frame: {
						name: "FRAME_14096",
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
						height: "650px",
					},
				},
				listeners: {},
				slots: {},
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
					text: "Text to SQL App",
					variant: "h3",
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
			Test: {
				type: "query",
				to: "Test",
			},
			"Test--2": {
				type: "cell",
				to: "Test",
				cellId: "2",
			},
			"sql-user-input": {
				type: "string",
				value: " ",
			},
			"input--1": {
				type: "block",
				to: "input--1",
			},
			"Database list": {
				type: "database",
				value: "950eb187-e352-444d-ad6a-6476ed9390af",
			},
			"Model list": {
				type: "model",
				value: "4801422a-5c62-421e-a00c-05c6a9e15de8",
			},
			"Test--5": {
				type: "cell",
				to: "Test",
				cellId: "5",
			},
		},
		executionOrder: ["Test"],
		version: "1.0.0-alpha.16",
	},
};
