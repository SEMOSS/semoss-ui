import type {
	FieldWidgetType,
	FormBuilderState,
	FormBuilderStepInfo,
} from "./form-builder.types";

/** Step numbers */
export const FORM_BUILDER_NAME_STEP = 1;
export const FORM_BUILDER_DATABASE_STEP = 2;
export const FORM_BUILDER_ACTIONS_STEP = 3;
export const FORM_BUILDER_FIELDS_STEP = 4;
export const FORM_BUILDER_PREVIEW_STEP = 5;

/** Total number of steps */
export const FORM_BUILDER_TOTAL_STEPS = 5;

/** Summary sidebar step definitions */
export const FORM_BUILDER_STEPS: FormBuilderStepInfo[] = [
	{
		step: FORM_BUILDER_NAME_STEP,
		title: "Name & Describe",
		description: "Set your app's name and description",
	},
	{
		step: FORM_BUILDER_DATABASE_STEP,
		title: "Connect Database",
		description: "Choose or create a database",
	},
	{
		step: FORM_BUILDER_ACTIONS_STEP,
		title: "Choose Actions",
		description: "Select CRUD operations per table",
	},
	{
		step: FORM_BUILDER_FIELDS_STEP,
		title: "Configure Fields",
		description: "Customize form fields and layout",
	},
	{
		step: FORM_BUILDER_PREVIEW_STEP,
		title: "Preview & Create",
		description: "Review and generate your app",
	},
];

/** Mapping from DB column types to default widget types */
export const DB_TYPE_TO_WIDGET: Record<string, FieldWidgetType> = {
	VARCHAR: "text",
	NVARCHAR: "text",
	TEXT: "textarea",
	CLOB: "textarea",
	CHAR: "text",
	INT: "number",
	INTEGER: "number",
	BIGINT: "number",
	SMALLINT: "number",
	TINYINT: "number",
	FLOAT: "number",
	DOUBLE: "number",
	DECIMAL: "number",
	NUMERIC: "number",
	REAL: "number",
	NUMBER: "number",
	DATE: "date",
	DATETIME: "date",
	TIMESTAMP: "date",
	BOOLEAN: "toggle",
	BIT: "toggle",
	EMAIL: "email",
};

/** Available widget type options for the field config UI */
export const WIDGET_TYPE_OPTIONS: {
	value: FieldWidgetType;
	label: string;
	description: string;
	icon: string;
	needsOptions?: boolean;
}[] = [
	{
		value: "text",
		label: "Text Input",
		description: "Single-line free text",
		icon: "Type",
	},
	{
		value: "number",
		label: "Number",
		description: "Numeric value with validation",
		icon: "Hash",
	},
	{
		value: "email",
		label: "Email",
		description: "Email with format validation",
		icon: "Mail",
	},
	{
		value: "password",
		label: "Password",
		description: "Masked text entry",
		icon: "Lock",
	},
	{
		value: "textarea",
		label: "Long Text",
		description: "Multi-line text area",
		icon: "AlignLeft",
	},
	{
		value: "date",
		label: "Date",
		description: "Date picker calendar",
		icon: "Calendar",
	},
	{
		value: "select",
		label: "Dropdown",
		description: "Choose from a list of options",
		icon: "ChevronDown",
		needsOptions: true,
	},
	{
		value: "checkbox",
		label: "Checkbox",
		description: "True / false check",
		icon: "CheckSquare",
	},
	{
		value: "radio",
		label: "Radio Group",
		description: "Pick one from a set of options",
		icon: "CircleDot",
		needsOptions: true,
	},
	{
		value: "toggle",
		label: "Yes / No Toggle",
		description: "On/off switch for boolean values",
		icon: "ToggleRight",
	},
];

/** Default initial state for the wizard */
export const INITIAL_FORM_BUILDER_STATE: FormBuilderState = {
	appName: "",
	appDescription: "",
	appTags: [],
	appImage: null,
	databaseId: "",
	databaseName: "",
	tables: [],
	isCreating: false,
};
