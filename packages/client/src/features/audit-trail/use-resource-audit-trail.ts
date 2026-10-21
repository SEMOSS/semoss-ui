import { usePixel } from "@semoss/sdk/react";
import type { AuditTrailFilters } from "@/api/audit-trail";
import {
	type AuditDirection,
	type AuditScope,
	type AuditSort,
	buildResourceAuditPixel,
	parseResourceAuditPage,
	type ResourceAuditEvent,
} from "@/api/resource-audit-trail";

/** Read a page with SDK cancellation and explicit payload validation. */
export function useResourceAuditTrail(
	scope: AuditScope,
	id: string,
	filters: AuditTrailFilters,
	page: number,
	pageSize: number,
	sort: AuditSort,
	direction: AuditDirection,
): {
	events: ResourceAuditEvent[];
	hasNextPage: boolean;
	isLoading: boolean;
	error: string | null;
	refresh: () => void;
} {
	const result = usePixel<unknown>(
		buildResourceAuditPixel(
			scope,
			id,
			filters,
			page,
			pageSize,
			sort,
			direction,
		),
		{ data: null },
	);
	let events: ResourceAuditEvent[] = [];
	let hasNextPage = false;
	let error = result.error?.message ?? null;
	if (result.status === "SUCCESS") {
		try {
			const parsed = parseResourceAuditPage(result.data);
			events = parsed.events;
			hasNextPage = parsed.hasNextPage;
		} catch {
			error = "Unable to read the resource audit response.";
		}
	}
	return {
		events,
		hasNextPage,
		error,
		isLoading: result.status === "INITIAL" || result.status === "LOADING",
		refresh: result.refresh,
	};
}
