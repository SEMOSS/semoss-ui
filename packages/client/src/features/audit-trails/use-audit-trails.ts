import { usePixel } from "@semoss/sdk/react";
import {
	AUDIT_PAGE_SIZE,
	type AuditEvent,
	type AuditTrailFilters,
	buildAuditTrailsPixel,
	parseAuditEvents,
} from "@/api/audit-trails";

interface AuditTrailsResult {
	events: AuditEvent[];
	hasNextPage: boolean;
	isLoading: boolean;
	error: string | null;
	refresh: () => void;
}

/** Read one page using the SDK's cancellation and backend-error handling. */
export function useAuditTrails(
	filters: AuditTrailFilters,
	page: number,
): AuditTrailsResult {
	const result = usePixel<unknown>(buildAuditTrailsPixel(filters, page), {
		data: null,
	});
	let events: AuditEvent[] = [];
	let error = result.error?.message ?? null;
	if (result.status === "SUCCESS") {
		try {
			events = parseAuditEvents(result.data);
		} catch (cause: unknown) {
			error =
				cause instanceof Error
					? cause.message
					: "Unable to read audit events.";
		}
	}
	return {
		events: events.slice(0, AUDIT_PAGE_SIZE),
		hasNextPage: events.length > AUDIT_PAGE_SIZE,
		isLoading: result.status === "INITIAL" || result.status === "LOADING",
		error,
		refresh: result.refresh,
	};
}
