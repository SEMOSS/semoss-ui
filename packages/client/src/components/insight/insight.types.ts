import type { SerializedState } from "@semoss/renderer";

export interface SavedQuery {
	id: string;
	databaseId: string;
	databaseName: string;
	sqlQuery: string;
	frameType: string;
	frameVariableName: string;
}

export type ParameterInputType =
	| "text"
	| "number"
	| "date"
	| "toggle"
	| "radio"
	| "select";

export type ParameterOptionsSourceType =
	| "manual"
	| "existingQuery"
	| "separateQuery";

export interface FilterParameter {
	id: string;
	name: string; // Variable name and display label
	label?: string; // Display label shown to end users (defaults to name if not set)
	inputType: ParameterInputType;
	selectOptions?: string[]; // Options for select-type parameters (simple string list)
	required?: boolean;
	defaultValue?: string | number | boolean | string[];
	hint?: string;
	// For radio and select
	options?: Array<{ label: string; value: string }>;
	// For select blocks with query-based options
	optionsSourceType?: ParameterOptionsSourceType;
	optionsSourceQueryId?: string; // Reference to existing query or separate query
	optionLabel?: string; // Path to label field in query result
	optionValue?: string; // Path to value field in query result
	optionSublabel?: string; // Path to sublabel field
	// For SQL-based parameter options (separateQuery mode)
	parameterDatabaseId?: string; // Database to query for options
	parameterSqlQuery?: string; // SQL query to populate options
	// For select blocks
	multiple?: boolean;
	// For radio blocks
	direction?: "row" | "column";
}

export interface SavedComponent {
	id: string;
	queryId: string;
	componentType: string;
	frameVariableName: string;
	// For block components
	blockState?: SerializedState;
	blockId?: string;
}

export interface BuilderStepItem {
	step: number;
	value: BuilderValue;
	required: boolean;
	display: string;
}

export interface InsightBuilder {
	queries: BuilderStepItem;
	components: BuilderStepItem;
	app: BuilderStepItem;
}

export interface ColumnHeaderInfo {
	alias: string;
	header: string;
	dataType: string;
}

export type BuilderValue =
	| SavedQuery[]
	| SavedComponent[]
	| FilterParameter[]
	| undefined;
