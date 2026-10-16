import { runPixel } from "@semoss/sdk/react";
import { escapeCsvValue } from "@semoss/utility/csv";
import { parseTimestampWithUtcDefault } from "@semoss/utility/date";
import { formatJson } from "@semoss/utility/json";
import { isRecord } from "@semoss/utility/object";
import { auditPixelLiteral } from "./audit-pixel";

/** Columns selected by the AdminUserAuditEvents reactor, in schema order. */
export const AUDIT_EVENT_COLUMNS = [
	// event
	"EVENT_ID",
	"EVENT_TIME",
	"EVENT_OCCURRED_TIME",
	"EVENT_TYPE",
	"ACTION",
	"STATUS",
	"CATEGORY",
	"SEVERITY",
	// actor
	"ACTOR_USER_ID",
	"ACTOR_USER_TYPE",
	"ACTOR_USER_NAME",
	"ACTOR_IS_ADMIN",
	// affected user
	"SUBJECT_USER_ID",
	"SUBJECT_USER_TYPE",
	"SUBJECT_USER_NAME",
	// request
	"SESSION_ID_HASH",
	"REQUEST_ID",
	"IP_ADDR",
	"USER_AGENT",
	"HTTP_METHOD",
	"REQUEST_PATH",
	"HTTP_STATUS",
	// target
	"TARGET_TYPE",
	"TARGET_ID",
	"TARGET_NAME",
	// resource context
	"PROJECT_ID",
	"ENGINE_ID",
	"INSIGHT_ID",
	"ROOM_ID",
	// change
	"OLD_VALUE",
	"NEW_VALUE",
	"DETAILS",
	// failure
	"ERROR_CODE",
	"ERROR_MESSAGE",
	// source
	"SOURCE_APP",
	"SOURCE_MODULE",
	"SOURCE_CLASS",
	// optional integrity
	"HASH_PREVIOUS",
	"HASH_CURRENT",
] as const;

export type AuditEventColumn = (typeof AUDIT_EVENT_COLUMNS)[number];

/**
 * What the backend adds to each event from the catalog: the current name of the
 * engine or app it was on, and an engine's type and subtype, which pick its
 * logo. A target the catalog no longer has gets none.
 */
export const AUDIT_TARGET_CATALOG_COLUMNS = [
	"TARGET_DISPLAY_NAME",
	"TARGET_ENGINE_TYPE",
	"TARGET_ENGINE_SUBTYPE",
] as const;

export type AuditTargetCatalogColumn =
	(typeof AUDIT_TARGET_CATALOG_COLUMNS)[number];

export type AuditEvent = Record<
	AuditEventColumn,
	string | number | boolean | null
> &
	Partial<Record<AuditTargetCatalogColumn, string | null>>;

/** Exact-match filters plus an inclusive UTC date range. */
export interface AuditTrailFilters {
	eventType: string;
	category: string;
	status: string;
	severity: string;
	actorId: string;
	subjectId: string;
	targetType: string;
	targetId: string;
	projectId: string;
	engineId: string;
	insightId: string;
	/** Inclusive start date, `YYYY-MM-DD` in UTC. */
	from: string;
	/** Inclusive end date, `YYYY-MM-DD` in UTC. */
	to: string;
}

export const EMPTY_AUDIT_FILTERS: AuditTrailFilters = {
	eventType: "",
	category: "",
	status: "",
	severity: "",
	actorId: "",
	subjectId: "",
	targetType: "",
	targetId: "",
	projectId: "",
	engineId: "",
	insightId: "",
	from: "",
	to: "",
};

export const AUDIT_STATUSES = [
	"SUCCESS",
	"FAILURE",
	"DENIED",
	"ERROR",
] as const;
export const AUDIT_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const AUDIT_CATEGORIES = [
	"AUTH",
	"AUTHZ",
	"USAGE_LIMIT",
	"USER_ADMIN",
	"GROUP_ADMIN",
	"CREDENTIAL",
	"PROJECT",
	"INSIGHT",
	"WORKSPACE",
	"ENGINE",
	"AUTOMATION",
	"SKILL",
	"JOB",
	"CONFIG",
	"AUDIT",
] as const;

export const AUDIT_PAGE_SIZE = 25;
/** Upper bound on rows read by a single CSV export. */
export const AUDIT_EXPORT_LIMIT = 10000;
/** Select value meaning "do not filter on this field". */
export const AUDIT_FILTER_ALL = "all";

/** Trim values and turn the "all" select sentinel back into no filter. */
export function normalizeAuditFilters(
	filters: AuditTrailFilters,
): AuditTrailFilters {
	const normalized = { ...EMPTY_AUDIT_FILTERS };
	for (const key of Object.keys(
		EMPTY_AUDIT_FILTERS,
	) as (keyof AuditTrailFilters)[]) {
		const value = (filters[key] ?? "").trim();
		normalized[key] =
			["category", "status", "severity", "targetType"].includes(key) &&
			value === AUDIT_FILTER_ALL
				? ""
				: value;
	}
	return normalized;
}

const EXACT_FILTER_COLUMNS: Record<
	Exclude<keyof AuditTrailFilters, "from" | "to">,
	AuditEventColumn
> = {
	eventType: "EVENT_TYPE",
	category: "CATEGORY",
	status: "STATUS",
	severity: "SEVERITY",
	actorId: "ACTOR_USER_ID",
	subjectId: "SUBJECT_USER_ID",
	targetType: "TARGET_TYPE",
	targetId: "TARGET_ID",
	projectId: "PROJECT_ID",
	engineId: "ENGINE_ID",
	insightId: "INSIGHT_ID",
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Validate actual UTC calendar dates, not just their shape. */
function auditDate(value: string, label: string): Date {
	const date = new Date(`${value}T00:00:00Z`);
	if (
		!DATE_PATTERN.test(value) ||
		Number.isNaN(date.getTime()) ||
		date.toISOString().slice(0, 10) !== value
	) {
		throw new Error(`Invalid ${label} date.`);
	}
	return date;
}

function validateDates(filters: AuditTrailFilters): void {
	if (filters.from) auditDate(filters.from, "start");
	if (filters.to) auditDate(filters.to, "end");
	if (filters.from && filters.to && filters.from > filters.to)
		throw new Error("Invalid audit date range.");
}

/** Build the `| Filter(...)` clause shared by paging and export reads. */
export function buildAuditFilterClause(filters: AuditTrailFilters): string {
	validateDates(filters);
	const clauses: string[] = [];
	for (const [key, column] of Object.entries(EXACT_FILTER_COLUMNS) as [
		keyof typeof EXACT_FILTER_COLUMNS,
		AuditEventColumn,
	][]) {
		const value = filters[key].trim();
		if (value) {
			clauses.push(
				`USER_AUDIT_EVENTS__${column} == ${auditPixelLiteral(value)}`,
			);
		}
	}
	const from = filters.from.trim();
	const to = filters.to.trim();
	if (from) {
		clauses.push(
			`USER_AUDIT_EVENTS__EVENT_TIME >= ${auditPixelLiteral(`${from} 00:00:00`)}`,
		);
	}
	if (to) {
		const nextDay = auditDate(to, "end");
		nextDay.setUTCDate(nextDay.getUTCDate() + 1);
		clauses.push(
			`USER_AUDIT_EVENTS__EVENT_TIME < ${auditPixelLiteral(`${nextDay.toISOString().slice(0, 10)} 00:00:00`)}`,
		);
	}
	return clauses.length ? ` | Filter(${clauses.join(", ")})` : "";
}

/** Build a bounded read, requesting one extra row to determine the next page. */
export function buildAuditTrailPixel(
	filters: AuditTrailFilters,
	page: number,
	snapshot?: string,
): string {
	if (!Number.isSafeInteger(page) || page < 0) {
		throw new Error("Invalid audit trail page.");
	}
	return adminAuditPixel(filters, [`page=[${page}]`], snapshot);
}

/** Build a materialized read; the server owns limits and completed-read auditing. */
function adminAuditPixel(
	filters: AuditTrailFilters,
	args: string[],
	snapshot?: string,
): string {
	validateDates(filters);
	for (const key of Object.keys(
		EMPTY_AUDIT_FILTERS,
	) as (keyof AuditTrailFilters)[]) {
		const value = filters[key].trim();
		if (value) args.push(`${key}=[${auditPixelLiteral(value)}]`);
	}
	if (snapshot !== undefined) {
		if (!/^[0-9]{1,19}$/.test(snapshot))
			throw new Error("Invalid audit snapshot.");
		args.push(`snapshot=[${auditPixelLiteral(snapshot)}]`);
	}
	return `AdminAuditEvents(${args.join(",")});`;
}

/** Snapshot sequence is a string to preserve 64-bit precision in the browser. */
export function parseAuditSnapshot(output: unknown): string {
	if (
		!isRecord(output) ||
		typeof output.snapshot !== "string" ||
		!/^[0-9]{1,19}$/.test(output.snapshot)
	) {
		throw new Error(
			"The audit response is missing its pagination snapshot.",
		);
	}
	return output.snapshot;
}

/** Build the export read; the backend records it as AUDIT_EXPORT. */
export function buildAuditTrailExportPixel(
	filters: AuditTrailFilters,
	snapshot?: string,
): string {
	return adminAuditPixel(filters, ["export=[true]"], snapshot);
}

/** Retrieve the bounded export through the admin reader and validate its result. */
export async function exportAuditEvents(
	filters: AuditTrailFilters,
	snapshot?: string,
): Promise<AuditEvent[]> {
	const response = await runPixel(
		buildAuditTrailExportPixel(filters, snapshot),
	);
	const result = response?.pixelReturn?.[0];
	if (!result || result.operationType?.includes("ERROR")) {
		throw new Error(
			typeof result?.output === "string"
				? result.output
				: "The audit events could not be exported.",
		);
	}
	return parseAuditEvents(result.output);
}

/** Validate a Collect task response and map headers independently of column order. */
export function parseAuditEvents(output: unknown): AuditEvent[] {
	if (!isRecord(output) || !isRecord(output.data)) {
		throw new Error(
			"The audit trail response did not contain a results table.",
		);
	}
	const { headers, values } = output.data;
	if (
		!Array.isArray(headers) ||
		!headers.every((header) => typeof header === "string") ||
		!Array.isArray(values)
	) {
		throw new Error(
			"The audit trail response contained an invalid results table.",
		);
	}
	// Collect's formatter can return no headers when the query has no rows.
	if (values.length === 0) return [];
	const columnIndexes = new Map(
		headers.map((header: string, index) => [
			header.split("__").pop()?.toUpperCase(),
			index,
		]),
	);
	if (AUDIT_EVENT_COLUMNS.some((column) => !columnIndexes.has(column))) {
		throw new Error(
			"The audit trail response is missing expected event fields.",
		);
	}
	return values.map((row: unknown): AuditEvent => {
		if (
			!Array.isArray(row) ||
			row.length !== headers.length ||
			!row.every(
				(cell: unknown) =>
					cell === null ||
					typeof cell === "string" ||
					typeof cell === "boolean" ||
					(typeof cell === "number" && Number.isFinite(cell)),
			)
		) {
			throw new Error(
				"The audit trail response contained an invalid event.",
			);
		}
		const event = Object.fromEntries([
			...AUDIT_EVENT_COLUMNS.map((column) => [
				column,
				row[columnIndexes.get(column) ?? -1],
			]),
			// the catalog's fields are added when the backend could read them
			...AUDIT_TARGET_CATALOG_COLUMNS.filter((column) =>
				columnIndexes.has(column),
			).map((column) => [column, row[columnIndexes.get(column) ?? -1]]),
		]) as AuditEvent;
		if (typeof event.EVENT_ID !== "string" || !event.EVENT_ID) {
			throw new Error(
				"The audit trail response contained an event without an ID.",
			);
		}
		return event;
	});
}

/** Show event timestamps in UTC, including SQL timestamps that omit a zone. */
export function formatAuditTime(value: AuditEvent["EVENT_TIME"]): string {
	if (value === null || value === "" || typeof value === "boolean")
		return "-";
	const date =
		typeof value === "number"
			? new Date(value)
			: parseTimestampWithUtcDefault(value).toDate();
	return Number.isNaN(date.getTime())
		? String(value)
		: date.toLocaleString(undefined, { timeZone: "UTC" });
}

/** Pretty-print structured details without interpreting backend text as HTML. */
export function formatAuditValue(value: AuditEvent[AuditEventColumn]): string {
	if (value === null || value === "") return "-";
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	return formatJson(value);
}

/**
 * Escape a CSV cell, neutralising values a spreadsheet would evaluate as a
 * formula (CSV injection).
 */
function auditCsvCell(value: AuditEvent[AuditEventColumn]): string {
	if (value === null) return "";
	const text = String(value);
	return escapeCsvValue(/^[=+\-@\t\r]/.test(text) ? `'${text}` : text);
}

/** Serialise events to CSV with one column per audit field. */
export function toAuditCsv(events: AuditEvent[]): string {
	const header = AUDIT_EVENT_COLUMNS.map((column) => escapeCsvValue(column));
	const rows = events.map((event) =>
		AUDIT_EVENT_COLUMNS.map((column) => auditCsvCell(event[column])).join(
			",",
		),
	);
	return [header.join(","), ...rows].join("\n");
}
