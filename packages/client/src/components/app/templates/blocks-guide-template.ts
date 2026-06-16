import LANDINGPAGE from "@/assets/img/DragDrop.png";
import { TEMPLATE_ACTION_MESSAGES } from "./action-messages";
import type { Template } from "./templates.types";

export const BlocksGuideTemplate: Template = {
	name: "Variables Guide",
	description:
		"This is an app used to help you understand the usage of our variables within our drag and drop app  builder",
	image: LANDINGPAGE,
	author: "SYSTEM",
	lastUpdatedDate: new Date().toISOString(),
	tags: [],
	state: {
		queries: {
			default: {
				id: "default",
				cells: [
					{
						id: "82164",
						widget: "code",
						parameters: {
							code: [
								'print("--------------------------")',
								"print('Engines')",
								'print("--------------------------")',
								'print("This is a LLM: " + "{{LLM}}")',
								'print("This is a Vector: " + "{{Vector}}")',
								'print("This is a DB: " + "{{DB}}")',
								'print("--------------------------")',
								"print('Data Types')",
								'print("--------------------------")',
								'print("{{string}}")',
								'print("{{date}}")',
								'print("--------------------------")',
								"print('Queries')",
								'print("--------------------------")',
								'print("This is a query: " + "{{query}}")',
								'print("This is a query output: " + "{{query.output}}")',
								'print("This is a query executed: " + "{{query.isExecuted}}")',
								'print("This is a query loading: " + "{{query.isLoading}}")',
								'print("--------------------------")',
								"print('Cells')",
								'print("--------------------------")',
								'print("This is a cell output: " + "{{cell.output}}")',
								'print("This is a cell loading: " + "{{cell.isLoading}}" )',
								'print("--------------------------")',
								"print('Blocks')",
								'print("--------------------------")',
								'print("This is a block: " + "{{block}}")',
								'print("This is a value property of the block: " + "{{block.value}}")',
								'print("This is a label property of the block: " + "{{block.label}}")',
							],
							type: "py",
						},
					},
					{
						id: "82165",
						widget: "code",
						parameters: {
							code: "",
							type: "py",
						},
					},
				],
			},
			python_code: {
				id: "python_code",
				cells: [
					{
						id: "74965",
						widget: "code",
						parameters: {
							code: ["a = 56", "b = 65", "a+b"],
							type: "py",
						},
					},
					{
						id: "74964",
						widget: "code",
						parameters: {
							code: '"Output of Query"',
							type: "py",
						},
					},
				],
			},
			"py-code": {
				id: "py-code",
				cells: [
					{
						id: "70303",
						widget: "code",
						parameters: {
							code: '"this is some python code referenced by a Notebook sheet"',
							type: "py",
						},
					},
				],
			},
		},
		blocks: {
			"text--6141": {
				parent: {
					id: "container--620",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					variant: "h1",
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: "Data Structure Variables",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--6141",
			},
			"text--8483": {
				parent: {
					id: "container--1511",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						overflow: "auto",
						textOverflow: "ellipsis",
					},
					text: "{{py_code.isExecuted}}",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--8483",
			},
			"text--9255": {
				parent: {
					id: "container--7223",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					variant: "h1",
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: "Block Variables",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--9255",
			},
			"container--9623": {
				parent: {
					id: "page-1",
					slot: "content",
				},
				slots: {
					children: {
						children: [
							"text--6115",
							"text--5619",
							"text--7984",
							"text--1",
						],
						name: "children",
					},
				},
				widget: "container",
				data: {
					style: {
						border: "2px solid ",
						padding: "4px",
						flexWrap: "wrap",
						flexDirection: "column",
						display: "flex",
						gap: "8px",
						height: "auto",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "container--9623",
			},
			"text--1": {
				parent: {
					id: "container--9623",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						overflow: "auto",
						textOverflow: "ellipsis",
					},
					text: "{{LLM}}",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--1",
			},
			"container--7223": {
				parent: {
					id: "page-1",
					slot: "content",
				},
				slots: {
					children: {
						children: [
							"text--9255",
							"input--2178",
							"text--890",
							"text--2520",
						],
						name: "children",
					},
				},
				widget: "container",
				data: {
					style: {
						border: "2px solid #0040ff",
						padding: "4px",
						flexWrap: "wrap",
						flexDirection: "column",
						display: "flex",
						gap: "8px",
						height: "auto",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "container--7223",
			},
			"text--3551": {
				parent: {
					id: "container--1511",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					variant: "h3",
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: "Cell",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--3551",
			},
			"text--2520": {
				parent: {
					id: "container--7223",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						overflow: "auto",
						textOverflow: "ellipsis",
					},
					text: "{{block}}",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--2520",
			},
			"text--9777": {
				parent: {
					id: "container--620",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						overflow: "auto",
						textOverflow: "ellipsis",
					},
					text: "{{string}}",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--9777",
			},
			"text--1176": {
				parent: {
					id: "container--1511",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					variant: "h3",
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: "Query",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--1176",
			},
			"text--1771": {
				parent: {
					id: "page-1",
					slot: "content",
				},
				slots: {},
				widget: "text",
				data: {
					variant: "h1",
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textAlign: "center",
						textDecoration: "underline",
						textOverflow: "ellipsis",
					},
					text: "Variables Example",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--1771",
			},
			"text--5619": {
				parent: {
					id: "container--9623",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						overflow: "auto",
						textOverflow: "ellipsis",
					},
					text: "{{DB}}",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--5619",
			},
			"container--1511": {
				parent: {
					id: "page-1",
					slot: "content",
				},
				slots: {
					children: {
						children: [
							"text--8976",
							"text--1176",
							"text--8076",
							"text--3551",
							"text--4832",
							"text--7385",
							"text--8483",
						],
						name: "children",
					},
				},
				widget: "container",
				data: {
					style: {
						border: "2px solid #008009",
						padding: "4px",
						flexWrap: "wrap",
						flexDirection: "column",
						display: "flex",
						gap: "8px",
						height: "auto",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "container--1511",
			},
			"page-1": {
				slots: {
					content: {
						children: [
							"text--1771",
							"text--4214",
							"container--9623",
							"container--620",
							"container--7223",
							"container--1511",
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
				},
				listeners: {
					onPageLoad: {
						type: "sync",
						order: [
							{
								payload: {
									queryId: "python_code",
								},
								message: TEMPLATE_ACTION_MESSAGES.RUN_NOTEBOOK,
							},
							{
								payload: {
									queryId: "py-code",
								},
								message: TEMPLATE_ACTION_MESSAGES.RUN_NOTEBOOK,
							},
							{
								payload: {
									queryId: "default",
								},
								message: TEMPLATE_ACTION_MESSAGES.RUN_NOTEBOOK,
							},
						],
					},
				},
				id: "page-1",
			},
			"text--8076": {
				parent: {
					id: "container--1511",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						overflow: "auto",
						textOverflow: "ellipsis",
					},
					text: "{{py_code}}",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--8076",
			},
			"text--7385": {
				parent: {
					id: "container--1511",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					variant: "h3",
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: "Query State",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--7385",
			},
			"text--7221": {
				parent: {
					id: "container--620",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						overflow: "auto",
						textOverflow: "ellipsis",
					},
					text: "{{json}}",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--7221",
			},
			"text--890": {
				parent: {
					id: "container--7223",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						overflow: "auto",
						textOverflow: "ellipsis",
					},
					text: "{{block.label}}",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--890",
			},
			"text--6115": {
				parent: {
					id: "container--9623",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					variant: "h1",
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: "Engine Variables",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--6115",
			},
			"text--8976": {
				parent: {
					id: "container--1511",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					variant: "h1",
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: "Notebook Variables",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--8976",
			},
			"text--4214": {
				parent: {
					id: "page-1",
					slot: "content",
				},
				slots: {},
				widget: "text",
				data: {
					variant: "p",
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textAlign: "center",
						textDecoration: "",
						textOverflow: "ellipsis",
					},
					text: "This is an app used to help you understand the usage of our variables within our drag and drop app  builder",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--4214",
			},
			"container--620": {
				parent: {
					id: "page-1",
					slot: "content",
				},
				slots: {
					children: {
						children: [
							"text--6141",
							"text--3669",
							"text--9777",
							"text--4898",
							"text--7221",
							"text--9903",
						],
						name: "children",
					},
				},
				widget: "container",
				data: {
					style: {
						border: "2px solid #ff0000",
						padding: "4px",
						flexWrap: "wrap",
						flexDirection: "column",
						display: "flex",
						gap: "8px",
						height: "auto",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "container--620",
			},
			"input--2178": {
				parent: {
					id: "container--7223",
					slot: "children",
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
					style: {
						padding: "4px",
						width: "100%",
					},
					disabled: false,
					label: "Name",
					type: "text",
					rows: 1,
					loading: false,
					value: "MOOSE AI",
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
				id: "input--2178",
			},
			"text--7984": {
				parent: {
					id: "container--9623",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						overflow: "auto",
						textOverflow: "ellipsis",
					},
					text: "{{Vector}}",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--7984",
			},
			"text--3669": {
				parent: {
					id: "container--620",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						overflow: "auto",
						textOverflow: "ellipsis",
					},
					text: "{{number}}",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--3669",
			},
			"text--4832": {
				parent: {
					id: "container--1511",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						overflow: "auto",
						textOverflow: "ellipsis",
					},
					text: "{{cell}}",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--4832",
			},
			"text--4898": {
				parent: {
					id: "container--620",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						overflow: "auto",
						textOverflow: "ellipsis",
					},
					text: "{{cell.isLoading}}",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--4898",
			},
			"text--9903": {
				parent: {
					id: "container--620",
					slot: "children",
				},
				slots: {},
				widget: "text",
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						overflow: "auto",
						textOverflow: "ellipsis",
					},
					text: "{{array}}",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--9903",
			},
		},
		variables: {
			date: {
				type: "date",
				value: "2024-12-31",
			},
			string: {
				type: "string",
				value: "This is a string variable",
			},
			query: {
				to: "python_code",
				type: "query",
			},
			new_var: {
				type: "model",
				value: "e338934d-bef1-4920-9136-dc0e37060dfa",
			},
			cell: {
				to: "python_code",
				type: "cell",
				cellId: "74965",
			},
			LLM: {
				type: "model",
				value: "001510f8-b86e-492e-a7f0-41299775e7d9",
			},
			number: {
				type: "number",
				value: 10,
			},
			array: {
				type: "array",
				value: [1, 2, 3],
			},
			json: {
				type: "JSON",
				value: {
					a: "this is a label for a",
				},
			},
			block: {
				to: "input--2178",
				type: "block",
			},
			Vector: {
				type: "vector",
				value: "aa72a4be-cb7a-4f7e-b384-7be5c3c081f5",
			},
			DB: {
				type: "database",
				value: "61b2d7c0-5dd4-4ea9-bc6e-9f39f2ae8d7a",
			},
			py_code: {
				to: "py-code",
				type: "query",
			},
			"default--82164": {
				type: "cell",
				to: "default",
				cellId: "82164",
			},
			"default--82165": {
				type: "cell",
				to: "default",
				cellId: "82165",
			},
			"python_code--74964": {
				type: "cell",
				to: "python_code",
				cellId: "74964",
			},
			"py-code--70303": {
				type: "cell",
				to: "py-code",
				cellId: "70303",
			},
		},
		executionOrder: ["default", "python_code", "py-code"],
		version: "1.0.0-alpha.10",
	},
};
