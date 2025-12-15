import type { BlockJSON } from "@semoss/renderer";
import type { DesignerMenuItem } from "../blocks-workspace/menus/menu-types";

const SECTION_ELEMENT = "Element";
const SECTION_INPUT = "Input";
const SECTION_LAYOUT = "Layout";
const SECTION_TEXT = "Text";

export const SECTION_ORDER = [
	SECTION_LAYOUT,
	SECTION_TEXT,
	SECTION_INPUT,
	SECTION_ELEMENT,
];

const DEV_BLOCKS = [];
if (import.meta.env.DEV) {
	console.warn("PUSH DEV ENV BLOCKS");
}

export const DEFAULT_MENU: DesignerMenuItem[] = [
	// TODO: You will still be able to drop configs on the UI.  Beta version of blocks
	...DEV_BLOCKS,
	// -------------------------------------------------------------
	// PROD BLOCKS START
	// ----------------------------------------------------------
	{
		section: SECTION_LAYOUT,
		name: "Tab",
		helperText: "Show content in tabular manner",
		json: {
			widget: "tab",
			data: {
				style: {},
				triggerBgColor: "",
				contentBgColor: "",
				showExpandIcon: false,
				activeTab: 1,
				show: "true",
				tabLabels: ["Tab 1", "Tab 2"],
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
				"1": [],
				"2": [],
			},
		},
	},
	{
		section: SECTION_LAYOUT,
		name: "Accordion",
		helperText: "Click to expand and collapse sections for more details",
		json: {
			widget: "accordion",
			data: {
				style: {
					padding: "20px",
				},
				triggerBgColor: "",
				contentBgColor: "",
				showExpandIcon: false,
				show: "true",
			},
			listeners: {
				preProcess: {
					type: "sync",
					order: [],
				},
			},
			slots: {
				header: [],
				content: [],
			},
		},
	},
	{
		section: SECTION_LAYOUT,
		name: "Popover",
		helperText: "Click or Hover to show the popover",
		json: {
			widget: "popover",
			data: {
				style: {},
				open: false,
				designMode: true,
				openTrigger: "click",
				contentBgColor: "",
			},
			listeners: {
				onOpen: {
					type: "sync",
					order: [],
				},
				onClose: {
					type: "sync",
					order: [],
				},
			},
			slots: {
				header: [],
				content: [],
			},
		},
	},
	{
		section: SECTION_INPUT,
		name: "Audio Player",
		helperText: "Play back audio responses or other files",
		json: {
			widget: "audio-player",
			data: {
				label: "Audio Player",
				autoplay: false,
				controls: true,
				loop: false,
				source: "",
				show: "true",
			},
			listeners: {
				preProcess: {
					type: "sync",
					order: [],
				},
			},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_ELEMENT,
		name: "Divider",
		helperText: "Separate content with a horizontal line",
		json: {
			widget: "divider",
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
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_ELEMENT,
		name: "Ratings ",
		helperText: "Add an rating to your layout",
		json: {
			widget: "ratings",
			data: {
				style: {},
				size: "small",
				type: "star",
				value: 2,
				max: 5,
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
			slots: {
				children: [],
			},
		},
	},
	{
		section: SECTION_INPUT,
		name: "Switch",
		helperText: "Switch between multiple options",
		json: {
			widget: "switch",
			data: {
				style: {
					width: "fit-content",
					padding: "4px",
				},
				label: "Toggle Switch",
				value: false,
				disabled: false,
				color: "primary",
				size: "medium",
				helperText: "",
				required: false,
				labelPlacement: "end",
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
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_INPUT,
		name: "Time Picker",
		helperText: "Select a time from a time picker",
		json: {
			widget: "timepicker",
			data: {
				style: {
					width: "25%",
					padding: "4px",
				},
				label: "Select Time",
				value: "",
				variant: "picker",
				ampm: true,
				format: "hh:mm a",
				disabled: false,
				required: false,
				fullWidth: false,
				placeholder: "",
				clearable: true,
				size: "small",
				views: ["hours", "minutes"],
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
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_INPUT,
		name: "Button",
		helperText: "Creates a click event",
		json: {
			widget: "button",
			data: {
				style: {},
				label: "Submit",
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
					order: [],
				},
				preProcess: { type: "sync", order: [] },
			},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_INPUT,
		name: "Checkbox",
		helperText: "Add a checkbox for user selection",
		json: {
			widget: "checkbox",
			data: {
				style: {
					padding: "none",
				},
				label: "Example Checkbox",
				required: false,
				disabled: false,
				value: false,
				show: "true",
			},
			listeners: {
				onChange: { type: "sync", order: [] },
				preProcess: { type: "sync", order: [] },
			},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_INPUT,
		name: "Radio",
		helperText: "User select between multiple items",
		json: {
			widget: "radio",
			data: {
				style: {
					padding: "4px",
				},
				value: "no_value",
				label: "Radio Input",
				isGroup: false,
				options: [{ label: "Default", value: "no_value" }],
				size: "medium",
				direction: "column",
				color: "primary",
				labelPlacement: "end",
				required: false,
				disabled: false,
				show: "true",
			},
			listeners: {
				onChange: { type: "sync", order: [] },
				preProcess: { type: "sync", order: [] },
			},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_LAYOUT,
		name: "Modal",
		helperText: "Overlay to show more info or action to user",
		json: {
			widget: "modal",
			data: {
				style: {},
				title: "Modal Title",
				open: false,
				fullWidth: true,
				maxWidth: "sm",
				minWidth: "sm",
				designMode: true,
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
				onClose: { type: "sync", order: [] },
			},
			slots: {
				content: [],
				footer: [],
			},
		},
	},
	{
		section: SECTION_INPUT,
		name: "Input",
		helperText: "Add an input box for typing text",
		json: {
			widget: "input",
			data: {
				style: {
					width: "100%",
					padding: "4px",
				},
				value: "",
				label: "Example Input",
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
				preProcess: { type: "sync", order: [] },
				onChange: { type: "sync", order: [] },
			},
			slots: {
				content: [],
			},
		},
	},
	{
		section: SECTION_INPUT,
		name: "Audio Input",
		helperText: "Input audio from the user",
		json: {
			widget: "audio-input",
			data: {
				style: {
					width: "50px",
					height: "60px",
				},
				loading: false,
				disabled: false,
				variant: "contained",
				color: "primary",
				value: "",
				mode: "transcribe",
				show: "true",
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
				onComplete: { type: "sync", order: [] },
			},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_INPUT,
		name: "Select",
		helperText: "Choose an option from a dropdown list",
		json: {
			widget: "select",
			data: {
				style: {
					padding: "4px",
				},
				value: "",
				label: "Example Select Input",
				hint: "",
				options: [],
				required: false,
				disabled: false,
				loading: false,
				show: "true",
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
				onChange: { type: "sync", order: [] },
				onOpen: { type: "sync", order: [] },
			},
			slots: {
				content: [],
			},
		},
	},
	{
		section: SECTION_INPUT,
		name: "Upload",
		helperText: "Upload files like documents or images",
		json: {
			widget: "upload",
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
				preProcess: { type: "sync", order: [] },
				onChange: { type: "sync", order: [] },
			},
			slots: {
				content: [],
			},
		},
	},
	{
		section: SECTION_LAYOUT,
		name: "Container",
		helperText: "Create a layout element for custom design",
		json: {
			widget: "container",
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
				preProcess: { type: "sync", order: [] },
			},
			slots: {
				children: [],
			},
		},
	},
	{
		section: SECTION_LAYOUT,
		name: "Form",
		helperText: "Create a layout element for custom design",
		json: {
			widget: "form",
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
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
				onSubmit: { type: "sync", order: [] },
			},
			slots: {
				children: [],
			},
		},
	},
	{
		section: SECTION_LAYOUT,
		name: "Flip Card",
		helperText: "Flip content on hover or click to reveal more information",
		json: {
			widget: "flip-card",
			data: {
				style: {
					display: "flex",
					flexDirection: "column",
					padding: "4px",
					gap: "8px",
				},
				frontBgColor: "#ffffff",
				backBgColor: "#ffffff",
				isFlipped: false,
				show: "true",
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
			},
			slots: {
				front: [],
				back: [],
			},
		},
	},
	{
		section: SECTION_ELEMENT,
		name: "Progress",
		helperText: "Display progress tracking or status",
		json: {
			widget: "progress",
			data: {
				type: "linear",
				value: 50,
				includeLabel: true,
				size: "300px",
				show: "true",
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
			},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_ELEMENT,
		name: "Iframe",
		helperText: "Embed a webpage using a source link",
		json: {
			widget: "iframe",
			data: {
				style: {},
				src: "",
				title: "",
				enableFrameInteractions: true,
				show: "true",
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
			},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_ELEMENT,
		name: "PDF Viewer",
		helperText: "Embed a PDF for viewing",
		json: {
			widget: "pdfViewer",
			data: {
				style: {
					width: "100%",
					height: "82%",
					padding: "8px",
				},
				selectedPdf: null,
				engineId: "",
				show: "true",
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
			},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_ELEMENT,
		name: "Image",
		helperText: "Add an image to your layout",
		json: {
			widget: "image",
			data: {
				style: {
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					width: "100%",
					height: "200px",
					backgroundSize: "contain",
					backgroundRepeat: "no-repeat",
					backgroundPosition: "center center",
				},
				src: "",
				title: "",
				show: "true",
				unavailable: "",
				placeholderText: "",
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
			},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_ELEMENT,
		name: "Icon",
		helperText: "Add an icon to your layout",
		json: {
			widget: "icon",
			data: {
				style: {
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					width: "50px",
					height: "50px",
					backgroundSize: "contain",
					backgroundRepeat: "no-repeat",
					backgroundPosition: "center center",
					show: "true",
				},

				icon: "Home",
				src: "",
				title: "",
				show: "true",
				badgeContent: 0,
				color: "default",
				showBadge: false,
			},
			listeners: {},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_TEXT,
		name: "Logs",
		helperText: "Show logs from the notebook",
		json: {
			widget: "logs",
			data: {
				style: {},
				queryId: "",
				show: "true",
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
			},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_LAYOUT,
		name: "Iterator",
		helperText: "Render a template for each item in a list/array",
		isBeta: true,
		json: {
			widget: "iteration",
			data: {
				style: {
					display: "flex",
					flexDirection: "column",
				},
				source: "",
				child: null,
				show: "true",
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
			},
			slots: {
				children: [],
			},
		},
	},
	{
		section: SECTION_ELEMENT,
		name: "Chip",
		json: {
			widget: "chip",
			data: {
				style: {
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					width: "100%",
					height: "200px",
				},
				src: "",
				title: "",
				show: "true",
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
			},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_INPUT,
		name: "Toggle Button",
		helperText: "Switch between multiple options",
		json: {
			widget: "toggle-button",
			data: {
				disabled: false,
				color: "primary",
				size: "small",
				options: [
					{
						display: "on",
						value: "on",
					},
					{
						display: "off",
						value: "off",
					},
				],
				value: null,
				mandatory: true,
				multiple: false,
				show: "true",
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
				onChange: { type: "sync", order: [] },
			},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_TEXT,
		name: "Link",
		helperText: "Access a webpage through a clickable URL",
		json: {
			widget: "link",
			data: {
				style: {
					padding: "4px",
					whiteSpace: "pre-line",
					textOverflow: "ellipsis",
				},
				href: "",
				text: "Insert text",
				show: "true",
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
			},
			slots: {},
		},
	},
	{
		section: SECTION_TEXT,
		name: "Markdown",
		helperText: "Show text in markdown format",
		json: {
			widget: "markdown",
			data: {
				style: {
					padding: "4px",
				},
				markdown: "**Hello world**",
				show: "true",
				loading: false,
				loadType: "Skeleton",
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
			},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_ELEMENT,
		name: "HTML",
		helperText: "Write custom HTML manually or with AI assistance",
		json: {
			widget: "html",
			data: {
				style: {
					padding: "4px",
				},
				html: "<html>\r\n    <style>\r\n        html {\r\n            font-family: Roboto;\r\n            text-align: center;\r\n            overflow: hidden;\r\n        }\r\n    </style>\r\n    <body>\r\n        <h2>HTML Block</h2>\r\n    </body>\r\n</html>",
				show: "true",
			},
			listeners: {},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_TEXT,
		name: "Text (h1)",
		helperText: "Display Text in header 1",
		json: {
			widget: "text",
			data: {
				style: {
					padding: "4px",
					whiteSpace: "pre-line",
					textOverflow: "ellipsis",
				},
				text: "Hello world",
				variant: "h1",
				show: "true",
				loading: false,
				loadType: "Skeleton",
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
			},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_TEXT,
		name: "Text (h2)",
		helperText: "Display Text in header 2",
		json: {
			widget: "text",
			data: {
				style: {
					padding: "4px",
					whiteSpace: "pre-line",
					textOverflow: "ellipsis",
				},
				text: "Hello world",
				variant: "h2",
				show: "true",
				loading: false,
				loadType: "Skeleton",
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
			},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_TEXT,
		name: "Text (h3)",
		helperText: "Display Text in header 3",
		json: {
			widget: "text",
			data: {
				style: {
					padding: "4px",
					whiteSpace: "pre-line",
					textOverflow: "ellipsis",
				},
				text: "Hello world",
				variant: "h3",
				show: "true",
				loading: false,
				loadType: "Skeleton",
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
			},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_TEXT,
		name: "Text (h4)",
		helperText: "Display Text in header 4",
		json: {
			widget: "text",
			data: {
				style: {
					padding: "4px",
					whiteSpace: "pre-line",
					textOverflow: "ellipsis",
				},
				text: "Hello world",
				variant: "h4",
				show: "true",
				loading: false,
				loadType: "Skeleton",
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
			},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_TEXT,
		name: "Text (h5)",
		helperText: "Display Text in header 5",
		json: {
			widget: "text",
			data: {
				style: {
					padding: "4px",
					whiteSpace: "pre-line",
					textOverflow: "ellipsis",
				},
				text: "Hello world",
				variant: "h5",
				show: "true",
				loading: false,
				loadType: "Skeleton",
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
			},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_TEXT,
		name: "Text (h6)",
		helperText: "Display Text in header 6",
		json: {
			widget: "text",
			data: {
				style: {
					padding: "4px",
					whiteSpace: "pre-line",
					textOverflow: "ellipsis",
				},
				text: "Hello world",
				variant: "h6",
				show: "true",
				loading: false,
				loadType: "Skeleton",
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
			},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_TEXT,
		name: "Text",
		helperText: "Show text in a regular paragraph style",
		json: {
			widget: "text",
			data: {
				style: {
					padding: "4px",
					whiteSpace: "pre-line",
					textOverflow: "ellipsis",
				},
				text: "Hello world",
				variant: "p",
				show: "true",
				loading: false,
				loadType: "Skeleton",
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
			},
			slots: {} as BlockJSON["slots"],
		},
	},
	{
		section: SECTION_LAYOUT,
		name: "Sidebar-Menu",
		helperText:
			"Use the sidebar to navigate between the tools and components",
		json: {
			widget: "sidebar",
			data: {
				style: {
					width: "240px",
					height: "100%",
				},
				open: false,
				anchor: "left",
				designMode: true,
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
				postProcess: { type: "sync", order: [] },
			},
			slots: {
				content: [],
			},
		},
	},
	{
		section: SECTION_INPUT,
		name: "Slider",
		helperText: "Allows user to select a value from a specified range",
		json: {
			widget: "slider",
			data: {
				type: "continuous",
				style: {
					color: "primary",
				},
				marks: [],
				steps: 1,
				value: 0,
				min: 0,
				max: 100,
				size: "300px",
			},
			listeners: {
				preProcess: { type: "sync", order: [] },
				onChange: { type: "sync", order: [] },
			},
			slots: {} as BlockJSON["slots"],
		},
	},
];

const MENU_FOR_PROMPT = DEFAULT_MENU.map((item) => ({
	section: item.section,
	name: item.name,
	json: item.json,
}));

const DIABETES_TEMPLATE = {
	queries: {
		mcp_driver: {
			id: "mcp_driver",
			cells: [
				{
					id: "1",
					widget: "code",
					parameters: {
						code: "",
						type: "py",
					},
				},
			],
		},
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
				loading: false,
				loadType: "Skeleton",
			},
			listeners: {
				preProcess: {
					type: "sync",
					order: [],
				},
			},
			id: "container",
		},
		"input--3394": {
			parent: {
				id: "container",
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
				show: "true",
				style: {
					padding: "4px",
					width: "100%",
				},
				disabled: false,
				label: "WEIGHT",
				type: "number",
				rows: 1,
				loading: false,
				value: "",
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
			id: "input--3394",
		},
		"input--1592": {
			parent: {
				id: "container",
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
				show: "true",
				style: {
					padding: "4px",
					width: "100%",
				},
				disabled: false,
				label: "HIP",
				type: "number",
				rows: 1,
				loading: false,
				value: "",
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
			id: "input--1592",
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
				type: "button",
			},
			listeners: {
				onClick: {
					type: "sync",
					order: [
						{
							payload: {
								queryId: "insert-diabetes-record",
							},
							message: "RUN_QUERY",
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
		"input--1170": {
			parent: {
				id: "container",
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
				show: "true",
				style: {
					padding: "4px",
					width: "100%",
				},
				disabled: false,
				label: "LOCATION",
				type: "text",
				rows: 1,
				loading: false,
				value: "",
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
			id: "input--1170",
		},
		"input--282": {
			parent: {
				id: "container",
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
				show: "true",
				style: {
					padding: "4px",
					width: "100%",
				},
				disabled: false,
				label: "BP_1S",
				type: "number",
				rows: 1,
				loading: false,
				value: "",
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
			id: "input--282",
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
				loading: false,
				loadType: "Skeleton",
			},
			listeners: {
				preProcess: {
					type: "sync",
					order: [],
				},
			},
			id: "description",
		},
		"input--965": {
			parent: {
				id: "container",
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
				show: "true",
				style: {
					padding: "4px",
					width: "100%",
				},
				disabled: false,
				label: "BP_2D",
				type: "number",
				rows: 1,
				loading: false,
				value: "",
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
			id: "input--965",
		},
		"input--6205": {
			parent: {
				id: "container",
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
				show: "true",
				style: {
					padding: "4px",
					width: "100%",
				},
				disabled: false,
				label: "RATIO",
				type: "number",
				rows: 1,
				loading: false,
				value: "",
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
			id: "input--6205",
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
				loading: false,
				loadType: "Skeleton",
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
		"input--1140": {
			parent: {
				id: "container",
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
				show: "true",
				style: {
					padding: "4px",
					width: "100%",
				},
				disabled: false,
				label: "BP_1D",
				type: "number",
				rows: 1,
				loading: false,
				value: "",
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
			id: "input--1140",
		},
		"input--4210": {
			parent: {
				id: "container",
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
				show: "true",
				style: {
					padding: "4px",
					width: "100%",
				},
				disabled: false,
				label: "WAIST",
				type: "number",
				rows: 1,
				loading: false,
				value: "",
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
			id: "input--4210",
		},
		"input--8650": {
			parent: {
				id: "container",
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
				show: "true",
				style: {
					padding: "4px",
					width: "100%",
				},
				disabled: false,
				label: "HDL",
				type: "number",
				rows: 1,
				loading: false,
				value: "",
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
			id: "input--8650",
		},
		"input--5626": {
			parent: {
				id: "container",
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
				show: "true",
				style: {
					padding: "4px",
					width: "100%",
				},
				disabled: false,
				label: "TIME_PPN",
				type: "number",
				rows: 1,
				loading: false,
				value: "",
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
			id: "input--5626",
		},
		"input--635": {
			parent: {
				id: "container",
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
				show: "true",
				style: {
					padding: "4px",
					width: "100%",
				},
				disabled: false,
				label: "STAB_GLU",
				type: "number",
				rows: 1,
				loading: false,
				value: "",
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
			id: "input--635",
		},
		"input--5427": {
			parent: {
				id: "container",
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
				show: "true",
				style: {
					padding: "4px",
					width: "100%",
				},
				disabled: false,
				label: "GENDER",
				type: "text",
				rows: 1,
				loading: false,
				value: "",
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
			id: "input--5427",
		},
		"input--6259": {
			parent: {
				id: "container",
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
				show: "true",
				style: {
					padding: "4px",
					width: "100%",
				},
				disabled: false,
				label: "GLYHB",
				type: "number",
				rows: 1,
				loading: false,
				value: "",
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
			id: "input--6259",
		},
		"input--9801": {
			parent: {
				id: "container",
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
				show: "true",
				style: {
					padding: "4px",
					width: "100%",
				},
				disabled: false,
				label: "HEIGHT",
				type: "number",
				rows: 1,
				loading: false,
				value: "",
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
			id: "input--9801",
		},
		"input--9548": {
			parent: {
				id: "container",
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
				show: "true",
				style: {
					padding: "4px",
					width: "100%",
				},
				disabled: false,
				label: "BP_2S",
				type: "number",
				rows: 1,
				loading: false,
				value: "",
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
			id: "input--9548",
		},
		"input--5402": {
			parent: {
				id: "container",
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
				show: "true",
				style: {
					padding: "4px",
					width: "100%",
				},
				disabled: false,
				label: "AGE",
				type: "number",
				rows: 1,
				loading: false,
				value: "",
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
			id: "input--5402",
		},
		"input--4335": {
			parent: {
				id: "container",
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
				show: "true",
				style: {
					padding: "4px",
					width: "100%",
				},
				disabled: false,
				label: "FRAME",
				type: "text",
				rows: 1,
				loading: false,
				value: "",
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
			id: "input--4335",
		},
		"input--4379": {
			parent: {
				id: "container",
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
				show: "true",
				style: {
					padding: "4px",
					width: "100%",
				},
				disabled: false,
				label: "CHOL",
				type: "number",
				rows: 1,
				loading: false,
				value: "",
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
			id: "input--4379",
		},
		"input--2410": {
			parent: {
				id: "container",
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
				show: "true",
				style: {
					padding: "4px",
					width: "100%",
				},
				disabled: false,
				label: "ID",
				type: "number",
				rows: 1,
				loading: false,
				value: "",
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
			id: "input--2410",
		},
		"input--1541": {
			parent: {
				id: "container",
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
				show: "true",
				style: {
					padding: "4px",
					width: "100%",
				},
				disabled: false,
				label: "DRUG",
				type: "text",
				rows: 1,
				loading: false,
				value: "",
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
			id: "input--1541",
		},
		"input--2836": {
			parent: {
				id: "container",
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
				show: "true",
				style: {
					padding: "4px",
					width: "100%",
				},
				disabled: false,
				label: "dtype",
				type: "text",
				rows: 1,
				loading: false,
				value: "",
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
			id: "input--2836",
		},
	},
	variables: {
		LOCATION: {
			to: "input--1170",
			type: "block",
		},
		DRUG: {
			to: "input--1541",
			type: "block",
		},
		"db-response": {
			to: "insert-diabetes-record",
			type: "query",
		},
		GLYHB: {
			to: "input--6259",
			type: "block",
		},
		BP_1D: {
			to: "input--1140",
			type: "block",
		},
		"insert-diabetes-record--81571": {
			to: "insert-diabetes-record",
			type: "cell",
			cellId: "81571",
		},
		WAIST: {
			to: "input--4210",
			type: "block",
		},
		RATIO: {
			to: "input--6205",
			type: "block",
		},
		FRAME: {
			to: "input--4335",
			type: "block",
		},
		HDL: {
			to: "input--8650",
			type: "block",
		},
		BP_1S: {
			to: "input--282",
			type: "block",
		},
		STAB_GLU: {
			to: "input--635",
			type: "block",
		},
		"insert-diabetes-record--81572": {
			to: "insert-diabetes-record",
			type: "cell",
			cellId: "81572",
		},
		GENDER: {
			to: "input--5427",
			type: "block",
		},
		model: {
			type: "model",
			value: "4acbe913-df40-4ac0-b28a-daa5ad91b172",
		},
		ID: {
			to: "input--2410",
			type: "block",
		},
		WEIGHT: {
			to: "input--3394",
			type: "block",
		},
		CHOL: {
			to: "input--4379",
			type: "block",
		},
		AGE: {
			to: "input--5402",
			type: "block",
		},
		"mcp_driver--1": {
			to: "mcp_driver",
			type: "cell",
			cellId: "1",
		},
		mcp_driver: {
			to: "mcp_driver",
			type: "query",
			cellId: "1",
		},
		BP_2D: {
			to: "input--965",
			type: "block",
		},
		dtype: {
			to: "input--2836",
			type: "block",
		},
		HEIGHT: {
			to: "input--9801",
			type: "block",
		},
		HIP: {
			to: "input--1592",
			type: "block",
		},
		BP_2S: {
			to: "input--9548",
			type: "block",
		},
		response: {
			to: "insert-diabetes-record",
			type: "cell",
			cellId: "81570",
		},
		TIME_PPN: {
			to: "input--5626",
			type: "block",
		},
	},
	executionOrder: ["insert-diabetes-record"],
	version: "1.0.0-alpha.17",
};

const TEMPLATE_FOR_PROMPT = (() => {
	const clone = JSON.parse(JSON.stringify(DIABETES_TEMPLATE)) as Record<
		string,
		unknown
	>;

	type QueryCell = {
		id?: string;
		widget?: string;
		parameters?: {
			code?: string;
			[key: string]: unknown;
		};
		[key: string]: unknown;
	};

	type QueryDef = {
		id?: string;
		cells?: QueryCell[];
		[key: string]: unknown;
	};

	if (clone.queries && typeof clone.queries === "object") {
		for (const q of Object.values(clone.queries) as QueryDef[]) {
			if (q && typeof q === "object" && Array.isArray(q.cells)) {
				q.cells.forEach((cell: QueryCell) => {
					if (
						cell &&
						cell.widget === "code" &&
						cell.parameters &&
						typeof cell.parameters.code === "string"
					) {
						cell.parameters.code = "# code omitted in prompt";
					}
				});
			}
		}
	}

	return clone;
})();

/**
 * Constructs the LLM prompt for generating app JSON
 * @param appName - The name of the application to be created
 * @param userPrompt - The user's description of what they want to create
 * @returns The complete system instructions for the LLM
 */
export const constructLLMPrompt = (appName: string, userPrompt: string): string => {
	const defaultMenuJson = JSON.stringify(MENU_FOR_PROMPT, null, 2);
	const templateJson = JSON.stringify(TEMPLATE_FOR_PROMPT, null, 2);

	const systemInstructions = `You are an App JSON Generator.

The code and JSON structures below define:
1. The default menu of available blocks (DEFAULT_MENU), where each item has:
   - section: category like "Layout", "Input", etc.
   - name: block name
   - json: default BlockJSON configuration for that block.

DEFAULT_MENU (only section, name, json):

${defaultMenuJson}

2. An example full app template (blocks workspace state):

${templateJson}

The code and JSON structures above define:
- All available widgets (blocks) and their default JSON structure.
- The expected BlockJSON shape: \`widget\`, \`data\`, \`listeners\`, \`slots\`, etc.
- How blocks are composed into apps using \`blocks\`, \`queries\`, \`variables\`, \`executionOrder\`, and \`version\`.

Your task:
Given a natural-language user request, generate a SINGLE valid JSON object that represents a complete app configuration using ONLY the widgets, shapes, and patterns defined above.

Output contract:
- Output ONLY a JSON object with this top-level structure:
  {
    "queries": { ... },
    "blocks": { ... },
    "variables": { ... },
    "executionOrder": [ ... ],
    "version": "1.0.0-alpha.17"
  }
- Do NOT output any explanations, comments, or markdown.
- Use exactly the same JSON shapes as in the templates and default menu:
  - Block objects must match the widget defaults (same keys in \`data\`, \`listeners\`, \`slots\`).
  - \`queries\`, \`variables\`, and \`executionOrder\` must look like the existing template apps.
- All IDs and references must be consistent:
  - Every \`parent.id\`, every child in \`slots.children\`, every \`variables.*.to\`, and every query referenced in listeners or \`executionOrder\` MUST exist in the JSON you output.

Behavior:
- Support any type of app (forms, CRUD, dashboards, charts, wizards, etc.) as described by the user.
- Infer:
  - Appropriate widgets (page, container, text, input, select, table, chart, button, etc.).
  - Reasonable IDs (e.g., "page-1", "container-main", "input-username", "submit").
  - Required \`queries\`, \`variables\`, and \`listeners\` to satisfy the described behavior, following the style of the example template apps.
- When the user is vague, use simple defaults from the block definitions in DEFAULT_MENU.

Formatting rules:
- Respond with raw JSON only (no backticks).
- JSON must be syntactically valid and parseable.
- Do not invent new top-level keys or new widget types that do not exist in DEFAULT_MENU or the template.

The User Prompt: ${userPrompt}
The App Name: ${appName}`;

	return systemInstructions;
};

/**
 * Escapes a string for use in a pixel command
 * @param str - The string to escape
 * @returns The escaped string
 */
export const escapeForPixelString = (str: string): string => {
	return str
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/\r/g, "\\r")
		.replace(/\n/g, "\\n")
		.replace(/\t/g, "\\t")
		.replace(/%/g, "%25");
};

/**
 * Cleans and validates JSON response from LLM
 * @param raw - The raw response from the LLM
 * @returns Cleaned and formatted JSON string
 */
export const cleanToValidJSON = (raw: string): string => {
	try {
		let txt = raw.trim();

		if (txt.startsWith("```")) {
			txt = txt.replace(/^```(?:json)?\s*\n?/i, "");
			txt = txt.replace(/\n?```\s*$/, "");
			txt = txt.trim();
		}

		if (txt.startsWith('"') && txt.endsWith('"')) {
			txt = txt.slice(1, -1);
		}

		txt = txt.replace(/\\"/g, '"').replace(/\\\\/g, "\\");

		txt = txt
			.replace(/\\n/g, "")
			.replace(/\\r/g, "")
			.replace(/\s+/g, " ");

		const obj = JSON.parse(txt);

		return JSON.stringify(obj, null, 2);
	} catch (err) {
		console.error("Failed to clean JSON:", err);
		return raw;
	}
};