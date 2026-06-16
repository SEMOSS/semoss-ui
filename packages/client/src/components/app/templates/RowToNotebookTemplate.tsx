import LANDINGPAGE from "@/assets/img/DragDrop.png";
import { TEMPLATE_ACTION_MESSAGES } from "./action-messages";
import type { Template } from "./templates.types";

export const RowToNotebookTemplate: Template = {
	name: "Row To Notebook",
	description:
		"This is an app used to help you understand how to interact with row data.",
	image: LANDINGPAGE,
	author: "SYSTEM",
	lastUpdatedDate: new Date().toISOString(),
	tags: [],
	state: {
		queries: {
			data: {
				id: "data",
				cells: [
					{
						id: "1",
						widget: "code",
						parameters: {
							code: "MyEngines(limit=5)",
							type: "pixel",
						},
					},
					{
						id: "2",
						widget: "code",
						parameters: {
							type: "py",
							code: '"SUBMITTED ROW DATA"',
						},
					},
					{
						id: "3",
						widget: "code",
						parameters: {
							type: "py",
							code: '"Deleting {{row-id}}"',
						},
					},
				],
			},
			modal: {
				id: "modal",
				cells: [
					{
						id: "1",
						widget: "code",
						parameters: {
							code: "open = 0",
							type: "py",
						},
					},
					{
						id: "2",
						widget: "code",
						parameters: {
							type: "py",
							code: "if(open == 0):\r\n    open = 1\r\nelse:\r\n    open = 0",
						},
					},
					{
						id: "3",
						widget: "code",
						parameters: {
							type: "py",
							code: "open",
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
							"modal--1",
							"text--1",
							"text--2",
							"text--7",
							"iteration--1",
							"text--8",
							"container--3",
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
					loading: "{{data--1.isLoading}}",
				},
				listeners: {
					onPageLoad: {
						type: "async",
						order: [
							{
								message: TEMPLATE_ACTION_MESSAGES.RUN_CELL,
								payload: {
									queryId: "data",
									cellId: "1",
								},
							},
							{
								message: TEMPLATE_ACTION_MESSAGES.RUN_CELL,
								payload: {
									queryId: "modal",
									cellId: "1",
								},
							},
							{
								message: TEMPLATE_ACTION_MESSAGES.RUN_CELL,
								payload: {
									queryId: "modal",
									cellId: "3",
								},
							},
						],
					},
				},
				id: "page-1",
			},
			"container--1": {
				parent: {
					id: "iteration--1",
					slot: "children",
				},
				slots: {
					children: {
						children: [
							"text--3",
							"text--4",
							"text--5",
							"button--1",
							"button--2",
						],
						name: "children",
					},
				},
				widget: "container",
				data: {
					style: {
						padding: "4px",
						overflow: "hidden",
						flexWrap: "wrap",
						flexDirection: "row",
						display: "flex",
						gap: "8px",
						border: "1px solid #646464",
						alignItems: "center",
					},
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "container--1",
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
					text: "Interact with Row Data",
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
					text: "This app is meant to show you how to interact with row data via the iterator and the notebook.",
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
			"iteration--1": {
				id: "iteration--1",
				widget: "iteration",
				parent: {
					id: "page-1",
					slot: "content",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "column",
					},
					source: " {{data--1}} ",
					child: {
						parent: {
							id: "iteration--1",
							slot: "children",
						},
						slots: {
							children: {
								children: ["text--3", "text--4", "text--5"],
								name: "children",
							},
						},
						widget: "container",
						data: {
							style: {
								padding: "4px",
								overflow: "hidden",
								flexWrap: "wrap",
								flexDirection: "row",
								display: "flex",
								gap: "8px",
								border: "1px solid #646464",
							},
						},
						listeners: {
							preProcess: {
								type: "sync",
								order: [],
							},
						},
						id: "container--1",
					},
					show: "true",
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
						children: ["container--1"],
					},
				},
				communityBlockMapping: {},
			},
			"text--3": {
				id: "text--3",
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
					},
					text: "$data--1.engine_name",
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
			"text--4": {
				id: "text--4",
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
					},
					text: "$data--1.engine_id",
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
			"text--5": {
				id: "text--5",
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
					},
					text: "$data--1.engine_subtype",
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
			"button--1": {
				id: "button--1",
				widget: "button",
				parent: {
					id: "container--1",
					slot: "children",
				},
				data: {
					style: {},
					label: "Show Row Data",
					loading: false,
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
								message: TEMPLATE_ACTION_MESSAGES.RUN_CELL,
								payload: {
									queryId: "modal",
									cellId: "2",
								},
							},
							{
								message: TEMPLATE_ACTION_MESSAGES.RUN_CELL,
								payload: {
									queryId: "modal",
									cellId: "3",
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
			"button--2": {
				id: "button--2",
				widget: "button",
				parent: {
					id: "container--1",
					slot: "children",
				},
				data: {
					style: {},
					label: "Delete Row ",
					loading: false,
					disabled: false,
					variant: "contained",
					color: "error",
					show: true,
					type: "button",
				},
				listeners: {
					onClick: {
						type: "sync",
						order: [
							{
								message:
									TEMPLATE_ACTION_MESSAGES.MODIFY_VARIABLE,
								payload: {
									variable: "row-id",
									value: "$data--1.engine_name",
									blockId: "button--2",
								},
							},
							{
								message: TEMPLATE_ACTION_MESSAGES.RUN_CELL,
								payload: {
									queryId: "data",
									cellId: "3",
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
			"modal--1": {
				id: "modal--1",
				widget: "modal",
				parent: {
					id: "page-1",
					slot: "content",
				},
				data: {
					style: {},
					title: "Show Data",
					open: " {{modal--3}} ",
					fullWidth: true,
					maxWidth: "sm",
					minWidth: "sm",
					designMode: false,
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
					onClose: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					content: {
						name: "content",
						children: ["text--6"],
					},
					footer: {
						name: "footer",
						children: ["container--2"],
					},
				},
				communityBlockMapping: {},
			},
			"text--6": {
				id: "text--6",
				widget: "text",
				parent: {
					id: "modal--1",
					slot: "content",
				},
				data: {
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: "This is a modal where we will show row data",
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
			"button--3": {
				id: "button--3",
				widget: "button",
				parent: {
					id: "container--2",
					slot: "children",
				},
				data: {
					style: {},
					label: "Call Reactor",
					loading: false,
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
								message: TEMPLATE_ACTION_MESSAGES.RUN_CELL,
								payload: {
									queryId: "data",
									cellId: "2",
								},
							},
							{
								message: TEMPLATE_ACTION_MESSAGES.RUN_CELL,
								payload: {
									queryId: "modal",
									cellId: "2",
								},
							},
							{
								message: TEMPLATE_ACTION_MESSAGES.RUN_CELL,
								payload: {
									queryId: "modal",
									cellId: "3",
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
			"button--4": {
				id: "button--4",
				widget: "button",
				parent: {
					id: "container--2",
					slot: "children",
				},
				data: {
					style: {},
					label: "Cancel",
					loading: false,
					disabled: false,
					variant: "outlined",
					color: "warning",
					show: true,
					type: "button",
				},
				listeners: {
					onClick: {
						type: "sync",
						order: [
							{
								message: TEMPLATE_ACTION_MESSAGES.RUN_CELL,
								payload: {
									queryId: "modal",
									cellId: "2",
								},
							},
							{
								message: TEMPLATE_ACTION_MESSAGES.RUN_CELL,
								payload: {
									queryId: "modal",
									cellId: "3",
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
			"container--2": {
				id: "container--2",
				widget: "container",
				parent: {
					id: "modal--1",
					slot: "footer",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "row",
						padding: "4px",
						gap: "8px",
						flexWrap: "wrap",
						justifyContent: "flex-end",
						alignItems: "center",
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
						children: ["button--4", "button--3"],
					},
				},
				communityBlockMapping: {},
			},
			"text--7": {
				id: "text--7",
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
					text: "{{data--2}}",
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
			"divider--1": {
				id: "divider--1",
				widget: "divider",
				parent: {
					id: "container--3",
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
				communityBlockMapping: {},
			},
			"divider--2": {
				id: "divider--2",
				widget: "divider",
				parent: {
					id: "container--3",
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
				communityBlockMapping: {},
			},
			"markdown--1": {
				id: "markdown--1",
				widget: "markdown",
				parent: {
					id: "container--3",
					slot: "children",
				},
				data: {
					style: {
						padding: "4px",
					},
					markdown:
						"We need to add a way for our iterated row data to interact with our API (notebook) layer.    \n<br /> \nThe way i see it, is we can do this through our variables.  We have an issue with state management anyways, and were using the notebooks to handle state changes.  But we need an intermediary\n\n<br />\n\nIf you look at our modal here we do the same thing.\n<br />\n<br />\n\nBut its coincidental that we need this same functionality to communicate changes to the notebook.\n\n<br />\n\nA. add new event that allows you to reset variable values. (you should be able to do this only for traditional data types\n<br />\nB. ability to call notebooks and pass params",
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
			"container--3": {
				id: "container--3",
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
						children: [
							"divider--1",
							"divider--4",
							"markdown--1",
							"divider--2",
							"divider--3",
							"markdown--2",
						],
					},
				},
				communityBlockMapping: {},
			},
			"text--8": {
				id: "text--8",
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
					text: "{{row-id}}",
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
			"markdown--2": {
				id: "markdown--2",
				widget: "markdown",
				parent: {
					id: "container--3",
					slot: "children",
				},
				data: {
					style: {
						padding: "4px",
					},
					markdown:
						"I have a challenge, update this template and put a PR in for this task to add this to Template App Page\n\n\n1. Populate row data in the modal that gets opened\n2. Manage modal through state",
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
			"divider--3": {
				id: "divider--3",
				widget: "divider",
				parent: {
					id: "container--3",
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
					text: "Challenge",
					showText: true,
					show: "true",
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
			"divider--4": {
				id: "divider--4",
				widget: "divider",
				parent: {
					id: "container--3",
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
					text: "Problem Statement",
					showText: true,
					show: "true",
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
			data: {
				type: "query",
				to: "data",
			},
			"data--1": {
				type: "cell",
				to: "data",
				cellId: "1",
			},
			modal: {
				type: "query",
				to: "modal",
			},
			"modal--1": {
				type: "cell",
				to: "modal",
				cellId: "1",
			},
			"modal--2": {
				type: "cell",
				to: "modal",
				cellId: "2",
			},
			"modal--3": {
				type: "cell",
				to: "modal",
				cellId: "3",
			},
			"data--2": {
				type: "cell",
				to: "data",
				cellId: "2",
			},
			"row-id": {
				type: "string",
				value: '""',
			},
			"data--3": {
				type: "cell",
				to: "data",
				cellId: "3",
			},
		},
		executionOrder: ["data", "modal"],
		version: "1.0.0-alpha.14",
	},
};
