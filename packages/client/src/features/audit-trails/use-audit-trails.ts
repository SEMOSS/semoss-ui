import { usePixel } from "@semoss/sdk/react";
import {
	AUDIT_PAGE_SIZE,
	type AuditEvent,
	type AuditTrailFilters,
	buildAuditTrailsPixel,
	parseAuditEvents,
	parseAuditSnapshot,
} from "@/api/audit-trails";

interface AuditTrailsResult {
	events: AuditEvent[];
	hasNextPage: boolean;
	isLoading: boolean;
	error: string | null;
	refresh: () => void;
	snapshot?: string;
}

/** Read one page using the SDK's cancellation and backend-error handling. */
export function useAuditTrails(
	filters: AuditTrailFilters,
	page: number,
	snapshot?: string,
): AuditTrailsResult {
	const result = usePixel<unknown>(
		buildAuditTrailsPixel(filters, page, snapshot),
		{
			data: null,
		},
	);
	let events: AuditEvent[] = [];
	let responseSnapshot: string | undefined;
	let error = result.error?.message ?? null;
	if (result.status === "SUCCESS") {
		try {
			events = parseAuditEvents(result.data);
			responseSnapshot = parseAuditSnapshot(result.data);
		} catch (cause: unknown) {
			error =
				cause instanceof Error
					? cause.message
					: "Unable to read audit events.";
		}
	}
	return {
		snapshot: responseSnapshot,
		events: events.slice(0, AUDIT_PAGE_SIZE),
		hasNextPage: !error && events.length > AUDIT_PAGE_SIZE,
		isLoading: result.status === "INITIAL" || result.status === "LOADING",
		error,
		refresh: result.refresh,
	};
}
