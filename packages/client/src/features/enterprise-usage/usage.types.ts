/** Applied filters are shared by every query and export. Dates are inclusive calendar dates. */
export interface UsageFilters {
	from: string;
	to: string;
	user: string;
	app: string;
	engine: string;
}

export type UsageSource = "model" | "activity";
export type UsageFilterDimension = "user" | "app" | "engine";

/** A selected span shared by all report tabs. */
export interface UsageDateRange {
	from: string;
	to: string;
}

/** Minimal catalog metadata used by the identity selectors. */
export interface UsageEntity {
	id: string;
	name: string;
	type: string;
	/** Engine provider/subtype used by the shared engine logo component. */
	subtype: string;
}

export interface UsageFilterOptions {
	rows: UsageEntity[];
	hasMore: boolean;
}

export type UsageDimension = "user" | "app" | "model";
export type UsageCell = string | number | boolean | null;
export type UsageRow = Record<string, UsageCell>;

/** A typed request to dedicated admin reactors; no database query text crosses the UI boundary. */
export interface UsageQuery {
	source: UsageSource;
	view:
		| "summary"
		| "trend"
		| "latency"
		| "feedback"
		| "ranking"
		| "logs"
		| "detail";
	filters?: UsageFilters;
	dimension?: UsageDimension;
	offset?: number;
	recordId?: string;
	limit: number;
}

export interface UsageResult {
	rows: UsageRow[];
	isLoading: boolean;
	error: string | null;
	refresh: () => void;
}

/** The metadata needed to retrieve a single message pair or activity event. */
export interface UsageSelection {
	source: UsageSource;
	row: UsageRow;
}

/** A selectable baseline using the same user, app, and model filters. */
export interface UsageBenchmark {
	mode: "previous-period" | "previous-year" | "custom";
	from: string;
	to: string;
}

/** Export contents and bounds are selected and enforced by the server. */
export interface UsageExportRequest {
	view: "overview" | "ranking" | "logs";
	format: "csv" | "pdf";
	source: UsageSource;
	filters: UsageFilters;
	dimension?: UsageDimension;
	comparison?: UsageFilters;
}
