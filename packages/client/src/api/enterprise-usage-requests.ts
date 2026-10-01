import type {
	UsageBenchmark,
	UsageDimension,
	UsageExportRequest,
	UsageFilterDimension,
	UsageFilters,
	UsageQuery,
	UsageRow,
	UsageSource,
} from "@/features/enterprise-usage/usage.types";

const dayMs = 86_400_000;
export const USAGE_PAGE_SIZE = 25;
export const USAGE_EXPORT_LIMIT = 5000;

/** Requests a bounded catalog page or resolves a selected identity by exact ID. */
export function usageFilterOptionsPixel(
	dimension: UsageFilterDimension,
	search = "",
	page = 0,
	id = "",
): string {
	for (const value of [search, id]) {
		if (
			value.length > 255 ||
			/[<>\\]/.test(value) ||
			Array.from(value).some((character) => character.charCodeAt(0) < 32)
		)
			throw new Error(
				"Search Must Be At Most 255 Characters Without Angle Brackets, Backslashes, Or Control Characters.",
			);
	}
	if (!Number.isSafeInteger(page) || page < 0 || page > 42949670)
		throw new Error("Invalid Options Page");
	const args = { dimension, search, id, limit: 50, offset: page * 50 };
	return `AdminGetEnterpriseUsageFilterOptions(${Object.entries(args)
		.map(([key, value]) => `${key}=[${JSON.stringify(value)}]`)
		.join(", ")});`;
}

/** Validates calendar dates before submitting a report request. */
export function calendarDate(value: string): number {
	const time = Date.parse(`${value}T00:00:00Z`);
	if (
		!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
		!Number.isFinite(time) ||
		new Date(time).toISOString().slice(0, 10) !== value
	) {
		throw new Error("Enter A Valid Calendar Date.");
	}
	return time;
}

/** Counts inclusive calendar days, independent of daylight-saving offsets. */
export function usageWindowDays(
	filters: Pick<UsageFilters, "from" | "to">,
): number {
	return (calendarDate(filters.to) - calendarDate(filters.from)) / dayMs + 1;
}

/** Shifts calendar dates without daylight-saving offsets. */
export function shiftDate(value: string, days: number): string {
	return new Date(calendarDate(value) + days * dayMs)
		.toISOString()
		.slice(0, 10);
}

/** Defaults to the most recent 30 calendar dates, including today. */
export function defaultUsageFilters(days = 30): UsageFilters {
	const now = new Date();
	const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
	return { from: shiftDate(to, 1 - days), to, user: "", app: "", engine: "" };
}

/** Bounds interactive queries to one year; exports use the identical filter validation. */
export function validateUsageFilters(filters: UsageFilters): void {
	const days =
		(calendarDate(filters.to) - calendarDate(filters.from)) / dayMs;
	if (days < 0 || days > 365)
		throw new Error(
			"Choose An End Date On Or After The Start Date, With At Most 366 Days.",
		);
	for (const value of [filters.user, filters.app, filters.engine]) {
		if ((value.startsWith("=") ? value.slice(1) : value).length > 255)
			throw new Error(
				"Name And ID Filters Must Be At Most 255 Characters.",
			);
		if (
			/[<>\\]/.test(value) ||
			Array.from(value).some((character) => character.charCodeAt(0) < 32)
		)
			throw new Error(
				"Filters Cannot Contain Angle Brackets, Backslashes, Or Control Characters.",
			);
	}
}

/** A same-length, immediately preceding period (including leap days). */
export function previousUsageFilters(filters: UsageFilters): UsageFilters {
	validateUsageFilters(filters);
	const days =
		(calendarDate(filters.to) - calendarDate(filters.from)) / dayMs + 1;
	return {
		...filters,
		from: shiftDate(filters.from, -days),
		to: shiftDate(filters.from, -1),
	};
}

/** Creates a scoped request; authorization and query construction belong to the reactor. */
function request(
	source: UsageSource,
	view: UsageQuery["view"],
	filters: UsageFilters,
	limit: number,
): UsageQuery {
	validateUsageFilters(filters);
	return { source, view, filters, limit };
}

/** All matching records contribute to summaries, independent of pagination. */
export function summaryQuery(
	source: UsageSource,
	filters: UsageFilters,
): UsageQuery {
	return request(source, "summary", filters, 1);
}

/** Requests at most 366 daily buckets from the server. */
export function trendQuery(
	source: UsageSource,
	filters: UsageFilters,
): UsageQuery {
	return request(source, "trend", filters, 366);
}

/** Requests server-computed nearest-rank p95 response latency. */
export function latencyQuery(filters: UsageFilters): UsageQuery {
	return request("model", "latency", filters, 1);
}

/** Requests ratings associated with responses in the applied window. */
export function feedbackQuery(filters: UsageFilters): UsageQuery {
	return request("model", "feedback", filters, 1);
}

/** Requests the top twenty consumers by stable entity identity. */
export function rankingQuery(
	filters: UsageFilters,
	dimension: UsageDimension,
): UsageQuery {
	return { ...request("model", "ranking", filters, 20), dimension };
}

/** Requests a bounded page of metadata. Message bodies use a separate reactor. */
export function logQuery(
	source: UsageSource,
	filters: UsageFilters,
	page = 0,
	size = USAGE_PAGE_SIZE,
): UsageQuery {
	if (
		!Number.isSafeInteger(page) ||
		page < 0 ||
		!Number.isSafeInteger(size) ||
		size < 1 ||
		size > USAGE_EXPORT_LIMIT ||
		page * size > 2147478647
	)
		throw new Error("Invalid Log Page.");
	return { ...request(source, "logs", filters, size), offset: page * size };
}

/** Only the selected record ID is sent; the server resolves its message pair. */
export function detailQuery(source: UsageSource, row: UsageRow): UsageQuery {
	const recordId = source === "model" ? row.MESSAGE_ID : row.LOG_ID;
	if (typeof recordId !== "string" || !recordId)
		throw new Error("Missing Record Identifier.");
	return {
		source,
		view: "detail",
		recordId,
		limit: source === "model" ? 20 : 1,
	};
}

/** Serializes typed reactor arguments, never raw SQL or user-controlled identifiers. */
export function usagePixel(query: UsageQuery): string {
	const args: Record<string, string | number> = { source: query.source };
	if (query.view === "detail") {
		args.recordId = query.recordId ?? "";
	} else {
		args.view = query.view;
		args.startDate = query.filters?.from ?? "";
		args.endDate = query.filters?.to ?? "";
		args.user = query.filters?.user ?? "";
		args.app = query.filters?.app ?? "";
		args.engine = query.filters?.engine ?? "";
		args.limit = query.limit;
		args.offset = query.offset ?? 0;
		if (query.dimension) args.dimension = query.dimension;
	}
	const reactor =
		query.view === "detail"
			? "AdminGetEnterpriseUsageDetail"
			: "AdminGetEnterpriseUsage";
	return `${reactor}(${Object.entries(args)
		.map(([key, value]) => `${key}=[${JSON.stringify(value)}]`)
		.join(", ")});`;
}

/** Resolves the selected baseline to explicit, validated calendar dates. */
export function comparisonUsageFilters(
	filters: UsageFilters,
	benchmark: UsageBenchmark,
): UsageFilters {
	if (benchmark.mode === "previous-period")
		return previousUsageFilters(filters);
	const previousYear = (date: string): string => {
		const value = new Date(calendarDate(date));
		const month = value.getUTCMonth();
		value.setUTCFullYear(value.getUTCFullYear() - 1);
		if (value.getUTCMonth() !== month) value.setUTCDate(0);
		return value.toISOString().slice(0, 10);
	};
	const result = {
		...filters,
		from:
			benchmark.mode === "previous-year"
				? previousYear(filters.from)
				: benchmark.from,
		to:
			benchmark.mode === "previous-year"
				? previousYear(filters.to)
				: benchmark.to,
	};
	validateUsageFilters(result);
	return result;
}

/** Sends only export selection and scope; the server queries and renders the file. */
export function usageExportPixel(request: UsageExportRequest): string {
	validateUsageFilters(request.filters);
	if (request.comparison) validateUsageFilters(request.comparison);
	const args: Record<string, string> = {
		source: request.source,
		view: request.view,
		format: request.format,
		startDate: request.filters.from,
		endDate: request.filters.to,
		user: request.filters.user,
		app: request.filters.app,
		engine: request.filters.engine,
	};
	if (request.dimension) args.dimension = request.dimension;
	if (request.comparison) {
		args.comparisonStartDate = request.comparison.from;
		args.comparisonEndDate = request.comparison.to;
	}
	return `AdminExportEnterpriseUsage(${Object.entries(args)
		.map(([key, value]) => `${key}=[${JSON.stringify(value)}]`)
		.join(", ")});`;
}
