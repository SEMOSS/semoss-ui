import { ActionMessages } from "@semoss/renderer";
import CHATAI from "@/assets/img/query.jpeg";
import type { Template } from "./templates.types";

export const CustomFrameToVisualizationTemplate: Template = {
	name: "Custom Frame to Visualization",
	description:
		"This is simply a guide to show you how to create a pandas data frame and use that frame to show a visualization.  Use imagination to build more useful app use cases.",
	image: CHATAI,
	author: "SYSTEM",
	lastUpdatedDate: new Date().toISOString(),
	tags: ["Pandas", "Data Frame"],
	state: {
		queries: {
			"create-pandas-frame": {
				id: "create-pandas-frame",
				cells: [
					{
						id: "1",
						widget: "code",
						parameters: {
							code: "## Create Pandas Frame and visualize data",
							type: "markdown",
							marked: true,
						},
					},
					{
						id: "2",
						widget: "code",
						parameters: {
							type: "py",
							code: [
								"# create json data",
								"data = {",
								"    'Name': ['Alice', 'Bob', 'Charlie'],",
								"    'Age': [25, 30, 22],",
								"    'City': ['New York', 'Los Angeles', 'Chicago']",
								"}",
								"print(data)",
							],
						},
					},
					{
						id: "3",
						widget: "code",
						parameters: {
							type: "py",
							code: [
								"import pandas as pd",
								"# Initialize Pandas",
								"DATA_FRAME_123 = pd.DataFrame(data, columns=['Name', 'Age', 'City'])",
							],
						},
					},
					{
						id: "4",
						widget: "code",
						parameters: {
							type: "pixel",
							code: 'GenerateFrameFromPyVariable("DATA_FRAME_123")',
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
							"text--2",
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
						gap: "8px",
					},
				},
				listeners: {
					onPageLoad: {
						type: "sync",
						order: [
							{
								message: ActionMessages.RUN_QUERY,
								payload: {
									queryId: "create-pandas-frame",
								},
							},
						],
					},
				},
				id: "page-1",
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
						name: "DATA_FRAME_123",
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
						width: "450px",
						height: "350px",
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
					text: "Create Pandas Frame Help Guide",
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
					text: "This is simply an app that shows you how to create a custom pandas frame in notebook.  Use this as inspiration for the cool visualizations you can build off of this.  Ask the LLM to create JSON out of data, manually import database engine data and construct a custom pandas frame off of that data (use imagination on how to interact that pulled data with the LLM).",
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
				communityBlockMapping: {},
			},
		},
		variables: {
			"create-pandas-frame": {
				type: "query",
				to: "create-pandas-frame",
			},
			"create-pandas-frame--1": {
				type: "cell",
				to: "create-pandas-frame",
				cellId: "1",
			},
			"create-pandas-frame--2": {
				type: "cell",
				to: "create-pandas-frame",
				cellId: "2",
			},
			"create-pandas-frame--3": {
				type: "cell",
				to: "create-pandas-frame",
				cellId: "3",
			},
			"create-pandas-frame--4": {
				type: "cell",
				to: "create-pandas-frame",
				cellId: "4",
			},
		},
		executionOrder: ["create-pandas-frame"],
		version: "1.0.0-alpha.13",
	},
};
