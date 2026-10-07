import { parseTimestampWithUtcDefault } from "@semoss/utility/date";
import { formatJson } from "@semoss/utility/json";
import { isRecord } from "@semoss/utility/object";

/** Columns selected by the existing AdminUserAuditEvents reactor. */
export const AUDIT_EVENT_COLUMNS = [
	"EVENT_ID",
	"EVENT_TIME",
	"EVENT_TYPE",
	"ACTION",
	"STATUS",
	"ACTOR_USER_ID",
	"ACTOR_USER_TYPE",
	"ACTOR_USER_NAME",
	"SESSION_ID",
	"REQUEST_ID",
	"IP_ADDR",
	"TARGET_TYPE",
	"TARGET_ID",
	"TARGET_NAME",
	"PROJECT_ID",
	"ENGINE_ID",
	"INSIGHT_ID",
	"ROOM_ID",
	"OLD_VALUE",
	"NEW_VALUE",
	"DETAILS",
	"ERROR_MESSAGE",
] as const;

export type AuditEventColumn = (typeof AUDIT_EVENT_COLUMNS)[number];
export type AuditEvent = Record<AuditEventColumn, string | number | null>;

/** Exact-match filters supported through the existing query-struct pipeline. */
export interface AuditTrailFilters {
	actorId: string;
	action: string;
	targetId: string;
	status: string;
}

export const EMPTY_AUDIT_FILTERS: AuditTrailFilters = {
	actorId: "",
	action: "",
	targetId: "",
	status: "",
};

export const AUDIT_PAGE_SIZE = 25;

/** Build a bounded read, requesting one extra row to determine the next page. */
export function buildAuditTrailsPixel(
	filters: AuditTrailFilters,
	page: number,
): string {
	if (!Number.isSafeInteger(page) || page < 0) {
		throw new Error("Invalid audit trails page.");
	}
	const columns = {
		actorId: "ACTOR_USER_ID",
		action: "ACTION",
		targetId: "TARGET_ID",
		status: "STATUS",
	} as const;
	const clauses = (
		Object.keys(columns) as (keyof AuditTrailFilters)[]
	).flatMap((key) => {
		const value = filters[key].trim();
		// Escape '<' as well as JSON string characters so the Pixel preprocessor
		// cannot interpret user-provided <encode> or other markup blocks.
		const literal = JSON.stringify(value).replace(/</g, "\\u003c");
		return value
			? [`USER_AUDIT_EVENTS__${columns[key]} == ${literal}`]
			: [];
	});
	const filter = clauses.length ? ` | Filter(${clauses.join(", ")})` : "";
	return `AdminUserAuditEvents()${filter} | Offset(${page * AUDIT_PAGE_SIZE}) | Limit(${AUDIT_PAGE_SIZE + 1}) | Collect(${AUDIT_PAGE_SIZE + 1});`;
}

/** Validate a Collect task response and map headers independently of column order. */
export function parseAuditEvents(output: unknown): AuditEvent[] {
	if (!isRecord(output) || !isRecord(output.data)) {
		throw new Error(
			"The audit trails response did not contain a results table.",
		);
	}
	const { headers, values } = output.data;
	if (
		!Array.isArray(headers) ||
		!headers.every((header) => typeof header === "string") ||
		!Array.isArray(values)
	) {
		throw new Error(
			"The audit trails response contained an invalid results table.",
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
			"The audit trails response is missing expected event fields.",
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
					(typeof cell === "number" && Number.isFinite(cell)),
			)
		) {
			throw new Error(
				"The audit trails response contained an invalid event.",
			);
		}
		const event = Object.fromEntries(
			AUDIT_EVENT_COLUMNS.map((column) => [
				column,
				row[columnIndexes.get(column) ?? -1],
			]),
		) as AuditEvent;
		if (typeof event.EVENT_ID !== "string" || !event.EVENT_ID) {
			throw new Error(
				"The audit trails response contained an event without an ID.",
			);
		}
		return event;
	});
}

/** Show event timestamps in UTC, including SQL timestamps that omit a zone. */
export function formatAuditTime(value: AuditEvent["EVENT_TIME"]): string {
	if (value === null || value === "") return "—";
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
	if (value === null || value === "") return "—";
	if (typeof value === "number") return String(value);
	return formatJson(value);
}
