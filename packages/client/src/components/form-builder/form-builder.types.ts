/** Field widget types available for form inputs */
export type FieldWidgetType =
	| "text"
	| "number"
	| "email"
	| "password"
	| "textarea"
	| "date"
	| "select"
	| "checkbox"
	| "radio"
	| "toggle";

/** Configuration for a single field in the form */
export interface FieldConfig {
	/** Column name from the database */
	columnName: string;
	/** Display label for the field */
	label: string;
	/** Widget type to render */
	widgetType: FieldWidgetType;
	/** Database column type (e.g. VARCHAR, INT) */
	dbType: string;
	/** Whether the field is required */
	required: boolean;
	/** Whether the field is visible in the form */
	visible: boolean;
	/** Placeholder text */
	placeholder: string;
	/** Display order (0-based) */
	order: number;
	/** Options for select/radio widgets */
	options?: string[];
	/** Default value pre-filled in the form input */
	defaultValue?: string;
	/** Help text shown beneath the field to guide users */
	helpText?: string;
	/** Value stored when a checkbox / toggle is checked (default "1") */
	checkedValue?: string;
	/** Value stored when a checkbox / toggle is unchecked (default "0") */
	uncheckedValue?: string;
}

/** A CRUD operation the user can enable per table */
export type CrudOperation = "create" | "read" | "update" | "delete";

/** Per-table configuration for which CRUD operations are enabled + field configs */
export interface TableConfig {
	/** Table name */
	table: string;
	/** Columns from the database */
	columns: { column: string; type: string }[];
	/** Enabled CRUD operations */
	operations: CrudOperation[];
	/** Field configurations keyed by column name, per operation */
	fields: Record<CrudOperation, FieldConfig[]>;
	/** Column used to identify / lookup records for update (defaults to first column) */
	lookupField?: string;
}

/** The wizard's full state */
export interface FormBuilderState {
	/** Step 1: App name */
	appName: string;
	/** Step 1: App description */
	appDescription: string;
	/** Step 1: Tags */
	appTags: string[];
	/** Step 1: Image file */
	appImage: File | null;
	/** Step 2: Selected database engine ID */
	databaseId: string;
	/** Step 2: Selected database engine name */
	databaseName: string;
	/** Step 2: Selected tables with their configs */
	tables: TableConfig[];
	/** Tracks loading state during app creation */
	isCreating: boolean;
}

/** A single step in the summary sidebar */
export interface FormBuilderStepInfo {
	/** Step number (1-based) */
	step: number;
	/** Display title */
	title: string;
	/** Description text */
	description: string;
}
