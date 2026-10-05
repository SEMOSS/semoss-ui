import { download, runPixel } from "@semoss/sdk";
import { isRecord } from "@semoss/utility/object";
import type {
	UsageExportRequest,
	UsageFilterOptions,
	UsageQuery,
	UsageRow,
} from "@/features/enterprise-usage/usage.types";
import { usageExportPixel } from "./enterprise-usage-requests";

/** Validates the selector contract without exposing other account/catalog fields. */
export function parseUsageFilterOptions(output: unknown): UsageFilterOptions {
	if (
		!output ||
		typeof output !== "object" ||
		!("hasMore" in output) ||
		typeof output.hasMore !== "boolean"
	)
		throw new Error("Invalid Filter Options Response");
	const rows = parseUsageRows(output).map((row) => {
		if (
			typeof row.ENTITY_ID !== "string" ||
			!row.ENTITY_ID ||
			(row.ENTITY_NAME != null && typeof row.ENTITY_NAME !== "string") ||
			(row.ENTITY_TYPE != null && typeof row.ENTITY_TYPE !== "string") ||
			(row.ENTITY_SUBTYPE != null &&
				typeof row.ENTITY_SUBTYPE !== "string")
		)
			throw new Error("Invalid Filter Option Identity");
		return {
			id: row.ENTITY_ID,
			name:
				typeof row.ENTITY_NAME === "string" && row.ENTITY_NAME
					? row.ENTITY_NAME
					: row.ENTITY_ID,
			type: typeof row.ENTITY_TYPE === "string" ? row.ENTITY_TYPE : "",
			subtype:
				typeof row.ENTITY_SUBTYPE === "string"
					? row.ENTITY_SUBTYPE
					: "",
		};
	});
	return { rows, hasMore: output.hasMore };
}

/** Validates reactor payloads; malformed responses are errors, never empty reports. */
export function parseUsageRows(
	output: unknown,
	query?: UsageQuery,
): UsageRow[] {
	if (
		!output ||
		typeof output !== "object" ||
		!("rows" in output) ||
		!Array.isArray(output.rows)
	)
		throw new Error("The Usage Reactor Returned An Invalid Dataset.");
	const rows = output.rows.map((row: unknown): UsageRow => {
		if (!isRecord(row)) throw new Error("Invalid Usage Row.");
		const result: UsageRow = {};
		for (const [key, value] of Object.entries(row)) {
			if (value === null) result[key] = null;
			else if (
				typeof value === "string" ||
				typeof value === "boolean" ||
				(typeof value === "number" && Number.isFinite(value))
			)
				result[key] = value;
			else throw new Error("Unsupported Usage Value.");
		}

		// Gson may omit SQL-null map entries. Rehydrate only fields nullable by the query contract.
		const nullable =
			query?.view === "ranking"
				? ["ENTITY_ID", "ENTITY_NAME", "TOKENS"]
				: query?.view === "summary" && query.source === "model"
					? ["TOKENS"]
					: query?.view === "latency"
						? ["P95_MS"]
						: [];
		for (const key of nullable) if (!(key in result)) result[key] = null;
		return result;
	});
	if (query) {
		const required =
			query.view === "summary"
				? query.source === "model"
					? ["REQUESTS", "TOKENS", "MESSAGE_ROWS"]
					: ["EVENTS", "FAILED", "KNOWN_OUTCOMES"]
				: query.view === "trend"
					? ["DAY"]
					: query.view === "latency"
						? ["P95_MS"]
						: query.view === "feedback"
							? ["RATINGS", "POSITIVE"]
							: query.view === "ranking"
								? ["ENTITY_ID", "TOKENS", "REQUESTS"]
								: query.source === "model"
									? ["MESSAGE_ID", "MESSAGE_TYPE"]
									: ["LOG_ID"];
		if (rows.some((row) => required.some((key) => !(key in row))))
			throw new Error("The Usage Response Is Missing Required Fields.");
		if (
			["summary", "latency", "feedback"].includes(query.view) &&
			rows.length !== 1
		)
			throw new Error(
				"The Usage Response Is Missing Its Aggregate Result.",
			);
	}
	return rows;
}

/** Requests an audited server-generated export and downloads its insight-scoped file. */
export async function exportUsageReport(
	request: UsageExportRequest,
	insightId: string,
): Promise<void> {
	if (!insightId) throw new Error("An Active Session Is Required To Export");
	const response = await runPixel<[unknown]>(
		usageExportPixel(request),
		insightId,
	);
	if (response.errors.length) throw new Error(response.errors.join("\n"));
	const result = response.pixelReturn[0];
	const key = result?.output;
	if (
		!result?.operationType.includes("FILE_DOWNLOAD") ||
		typeof key !== "string" ||
		!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
			key,
		)
	)
		throw new Error(
			"The Export Reactor Did Not Return A Valid Download Key",
		);
	await download(insightId, key);
}
