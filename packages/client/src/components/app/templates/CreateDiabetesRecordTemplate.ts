import CHATAI from "@/assets/img/DragDrop.png";
import { TEMPLATE_ACTION_MESSAGES } from "./action-messages";
import type { Template } from "./templates.types";

// TODO:
// 1. Make this a better looking intake form for a Patient
export const CreateDiabetesRecordTemplate: Template = {
	name: "Create Diabetes Record",
	description: "Create a new diabetes record",
	image: CHATAI,
	author: "SYSTEM",
	lastUpdatedDate: new Date().toISOString(),
	tags: [],
	state: {
		queries: {
			"insert-diabetes-record": {
				id: "insert-diabetes-record",
				cells: [
					{
						id: "81571",
						widget: "query-import",
						parameters: {
							frameVariableName: "FRAME_33516",
							frameType: "PY",
							databaseId: "950eb187-e352-444d-ad6a-6476ed9390af",
							selectQuery: "SELECT * FROM diabetes",
						},
					},
					{
						id: "81570",
						widget: "code",
						parameters: {
							code: 'from gaas_gpt_database import DatabaseEngine;databaseEngine = DatabaseEngine(engine_id = "950eb187-e352-444d-ad6a-6476ed9390af", insight_id = \'${i}\');a = FRAME_33516.columns.to_list();a.remove("DIABETES_UNIQUE_ROW_ID");col_string = ", ".join(a);inputValues = ["{{DRUG}}","{{LOCATION}}",float({{GLYHB}}),float({{BP_1D}}),float({{BP_2D}}),float({{WAIST}}),float({{RATIO}}),float({{HEIGHT}}),"{{FRAME}}",float({{HIP}}),float({{HDL}}),float({{BP_1S}}),float({{BP_2S}}),float({{STAB_GLU}}),"{{GENDER}}",float({{ID}}),float({{TIME_PPN}}),float({{WEIGHT}}),float({{CHOL}}),float({{AGE}})];filtered_columns = [];filtered_values = [];filtered_columns, filtered_values = zip(*[(col, f"{val}") if isinstance(val, str) and val else (col, val) for col, val in zip(a, inputValues) if isinstance(val,(str,float)) and val]);filtered_columns = ", ".join(filtered_columns);filtered_values = str(filtered_values);QS = f\'INSERT INTO diabetes({filtered_columns}) VALUES {filtered_values}\';',
							type: "py",
						},
					},
					{
						id: "81572",
						widget: "code",
						parameters: {
							code: "databaseEngine.insertData(query =QS )",
							type: "py",
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
						children: [
							"description",
							"input--2410",
							"input--5402",
							"input--1170",
							"input--6259",
							"input--1140",
							"input--965",
							"input--4210",
							"input--6205",
							"input--9801",
							"input--4335",
							"input--1592",
							"input--8650",
							"input--282",
							"input--9548",
							"input--635",
							"input--5427",
							"input--5626",
							"input--3394",
							"input--4379",
							"input--1541",
							"input--2836",
							"submit",
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
				id: "container",
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
					label: "Add record",
					loading: "{{db-response.isLoading}}",
				},
				listeners: {
					onClick: {
						type: "sync",
						order: [
							{
								payload: {
									queryId: "insert-diabetes-record",
								},
								message: TEMPLATE_ACTION_MESSAGES.RUN_QUERY,
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
						fontSize: "24px",
						textOverflow: "ellipsis",
					},
					text: "Create Diabetes Record",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "description",
			},
			"text--4905": {
				parent: {
					id: "page-1",
					slot: "content",
				},
				slots: {},
				widget: "text",
				data: {
					route: "text--4905",
					variant: "p",
					style: {
						padding: "4px",
						whiteSpace: "pre-line",
						textOverflow: "ellipsis",
					},
					text: " {{db-response.output}} ",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "text--4905",
			},
			"page-1": {
				parent: {
					id: "parent-id",
					slot: "parent-slot",
				},
				slots: {
					content: {
						children: ["container", "text--4905"],
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
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				id: "page-1",
			},
			"input--5402": {
				id: "input--5402",
				widget: "input",
				parent: {
					id: "container",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "AGE",
					hint: "",
					type: "number",
					rows: 1,
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
			},
			"input--1170": {
				id: "input--1170",
				widget: "input",
				parent: {
					id: "container",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "LOCATION",
					hint: "",
					type: "text",
					rows: 1,
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
			},
			"input--2410": {
				id: "input--2410",
				widget: "input",
				parent: {
					id: "container",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "ID",
					hint: "",
					type: "number",
					rows: 1,
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
			},
			"input--6259": {
				id: "input--6259",
				widget: "input",
				parent: {
					id: "container",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "GLYHB",
					hint: "",
					type: "number",
					rows: 1,
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
			},
			"input--1140": {
				id: "input--1140",
				widget: "input",
				parent: {
					id: "container",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "BP_1D",
					hint: "",
					type: "number",
					rows: 1,
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
			},
			"input--965": {
				id: "input--965",
				widget: "input",
				parent: {
					id: "container",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "BP_2D",
					hint: "",
					type: "number",
					rows: 1,
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
			},
			"input--4210": {
				id: "input--4210",
				widget: "input",
				parent: {
					id: "container",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "WAIST",
					hint: "",
					type: "number",
					rows: 1,
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
			},
			"input--6205": {
				id: "input--6205",
				widget: "input",
				parent: {
					id: "container",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "RATIO",
					hint: "",
					type: "number",
					rows: 1,
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
			},
			"input--9801": {
				id: "input--9801",
				widget: "input",
				parent: {
					id: "container",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "HEIGHT",
					hint: "",
					type: "number",
					rows: 1,
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
			},
			"input--4335": {
				id: "input--4335",
				widget: "input",
				parent: {
					id: "container",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "FRAME",
					hint: "",
					type: "text",
					rows: 1,
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
			},
			"input--635": {
				id: "input--635",
				widget: "input",
				parent: {
					id: "container",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "STAB_GLU",
					hint: "",
					type: "number",
					rows: 1,
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
			},
			"input--1592": {
				id: "input--1592",
				widget: "input",
				parent: {
					id: "container",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "HIP",
					hint: "",
					type: "number",
					rows: 1,
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
			},
			"input--8650": {
				id: "input--8650",
				widget: "input",
				parent: {
					id: "container",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "HDL",
					hint: "",
					type: "number",
					rows: 1,
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
			},
			"input--282": {
				id: "input--282",
				widget: "input",
				parent: {
					id: "container",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "BP_1S",
					hint: "",
					type: "number",
					rows: 1,
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
			},
			"input--9548": {
				id: "input--9548",
				widget: "input",
				parent: {
					id: "container",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "BP_2S",
					hint: "",
					type: "number",
					rows: 1,
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
			},
			"input--5427": {
				id: "input--5427",
				widget: "input",
				parent: {
					id: "container",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "GENDER",
					hint: "",
					type: "text",
					rows: 1,
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
			},
			"input--5626": {
				id: "input--5626",
				widget: "input",
				parent: {
					id: "container",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "TIME_PPN",
					hint: "",
					type: "number",
					rows: 1,
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
			},
			"input--3394": {
				id: "input--3394",
				widget: "input",
				parent: {
					id: "container",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "WEIGHT",
					hint: "",
					type: "number",
					rows: 1,
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
			},
			"input--4379": {
				id: "input--4379",
				widget: "input",
				parent: {
					id: "container",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "CHOL",
					hint: "",
					type: "number",
					rows: 1,
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
			},
			"input--1541": {
				id: "input--1541",
				widget: "input",
				parent: {
					id: "container",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "DRUG",
					hint: "",
					type: "text",
					rows: 1,
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
			},
			"input--2836": {
				id: "input--2836",
				widget: "input",
				parent: {
					id: "container",
					slot: "children",
				},
				data: {
					style: {
						width: "100%",
						padding: "4px",
					},
					value: "",
					label: "dtype",
					hint: "",
					type: "text",
					rows: 1,
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
			},
		},
		variables: {
			"db-response": {
				to: "insert-diabetes-record",
				type: "query",
			},
			response: {
				to: "insert-diabetes-record",
				type: "cell",
				cellId: "81570",
			},
			model: {
				type: "model",
				value: "4acbe913-df40-4ac0-b28a-daa5ad91b172",
			},
			"insert-diabetes-record--81571": {
				type: "cell",
				to: "insert-diabetes-record",
				cellId: "81571",
			},
			"insert-diabetes-record--81572": {
				type: "cell",
				to: "insert-diabetes-record",
				cellId: "81572",
			},
			ID: {
				type: "block",
				to: "input--2410",
			},
			AGE: {
				type: "block",
				to: "input--5402",
			},
			LOCATION: {
				type: "block",
				to: "input--1170",
			},
			GLYHB: {
				type: "block",
				to: "input--6259",
			},
			BP_1D: {
				type: "block",
				to: "input--1140",
			},
			BP_2D: {
				type: "block",
				to: "input--965",
			},
			WAIST: {
				type: "block",
				to: "input--4210",
			},
			RATIO: {
				type: "block",
				to: "input--6205",
			},
			HEIGHT: {
				type: "block",
				to: "input--9801",
			},
			FRAME: {
				type: "block",
				to: "input--4335",
			},
			HIP: {
				type: "block",
				to: "input--1592",
			},
			HDL: {
				type: "block",
				to: "input--8650",
			},
			BP_1S: {
				type: "block",
				to: "input--282",
			},
			BP_2S: {
				type: "block",
				to: "input--9548",
			},
			STAB_GLU: {
				type: "block",
				to: "input--635",
			},
			GENDER: {
				type: "block",
				to: "input--5427",
			},
			TIME_PPN: {
				type: "block",
				to: "input--5626",
			},
			WEIGHT: {
				type: "block",
				to: "input--3394",
			},
			CHOL: {
				type: "block",
				to: "input--4379",
			},
			DRUG: {
				type: "block",
				to: "input--1541",
			},
			dtype: {
				type: "block",
				to: "input--2836",
			},
		},
		executionOrder: ["insert-diabetes-record"],
		version: "1.0.0-alpha.10",
	},
};
