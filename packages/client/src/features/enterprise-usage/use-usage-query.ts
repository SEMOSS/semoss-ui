import { usePixel } from "@semoss/sdk/react";
import { parseUsageRows } from "@/api/enterprise-usage";
import { usagePixel } from "@/api/enterprise-usage-requests";
import type { UsageQuery, UsageResult } from "./usage.types";

/** Uses the SDK's cancellation guard and surfaces both transport and dataset failures. */
export function useUsageQuery(query: UsageQuery | null): UsageResult {
	const result = usePixel<unknown>(query ? usagePixel(query) : "");
	if (result.status === "ERROR")
		return {
			rows: [],
			isLoading: false,
			error: result.error?.message || "Unable To Load Usage.",
			refresh: result.refresh,
		};
	if (result.status !== "SUCCESS")
		return {
			rows: [],
			isLoading: Boolean(query),
			error: null,
			refresh: result.refresh,
		};
	try {
		return {
			rows: parseUsageRows(result.data, query ?? undefined),
			isLoading: false,
			error: null,
			refresh: result.refresh,
		};
	} catch (error) {
		return {
			rows: [],
			isLoading: false,
			error:
				error instanceof Error ? error.message : "Invalid Usage Data.",
			refresh: result.refresh,
		};
	}
}
