import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Download,
	RefreshCw,
	SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	H4,
	P,
	Skeleton,
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	toast,
} from "@semoss/ui/next";
import { downloadBlob } from "@semoss/utility/browser";
import {
	AUDIT_EXPORT_LIMIT,
	AUDIT_PAGE_SIZE,
	type AuditEvent,
	type AuditTrailFilters,
	buildAuditTrailsExportPixel,
	EMPTY_AUDIT_FILTERS,
	formatAuditTime,
	parseAuditEvents,
	toAuditCsv,
} from "@/api/audit-trails";
import { AuditEventDetails } from "./audit-event-details";
import { AuditTrailsFilters } from "./audit-trails-filters";
import { useAuditTrails } from "./use-audit-trails";

function statusVariant(status: AuditEvent["STATUS"]) {
	return status === "FAILURE" || status === "ERROR" || status === "DENIED"
		? "destructive"
		: "outline";
}

function severityVariant(severity: AuditEvent["SEVERITY"]) {
	return severity === "HIGH" || severity === "CRITICAL"
		? "destructive"
		: severity === "MEDIUM"
			? "secondary"
			: "outline";
}

/** Browse, filter, and export the security and administrative audit trail. */
export const AuditTrails = () => {
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [query, setQuery] = useState({
		filters: EMPTY_AUDIT_FILTERS,
		page: 0,
	});
	const [isExporting, setIsExporting] = useState(false);
	const { events, hasNextPage, isLoading, error, refresh } = useAuditTrails(
		query.filters,
		query.page,
	);
	const hasFilters = Object.values(query.filters).some(Boolean);
	const activeFilterCount = Object.values(query.filters).filter(
		Boolean,
	).length;
	const handleApply = (filters: AuditTrailFilters) => {
		setQuery({ filters, page: 0 });
	};
	const handleExport = async () => {
		setIsExporting(true);
		try {
			const response = await runPixel(
				buildAuditTrailsExportPixel(query.filters),
			);
			const result = response?.pixelReturn?.[0];
			if (!result || result.operationType?.includes("ERROR")) {
				throw new Error(
					typeof result?.output === "string"
						? result.output
						: "The audit events could not be exported.",
				);
			}
			const exported = parseAuditEvents(result.output);
			if (exported.length === 0) {
				toast.error("There are no audit events to export.");
				return;
			}
			downloadBlob(
				new Blob([toAuditCsv(exported)], {
					type: "text/csv;charset=utf-8;",
				}),
				`audit-trails-${new Date().toISOString().slice(0, 10)}.csv`,
			);
			toast.success(
				exported.length >= AUDIT_EXPORT_LIMIT
					? `Exported the newest ${AUDIT_EXPORT_LIMIT} matching events. Narrow the filters to export older events.`
					: `Exported ${exported.length} audit ${exported.length === 1 ? "event" : "events"}.`,
			);
		} catch (cause: unknown) {
			toast.error(
				cause instanceof Error
					? cause.message
					: "The audit events could not be exported.",
			);
		} finally {
			setIsExporting(false);
		}
	};
	return (
		<div className="flex w-full min-w-0 flex-col pb-8">
			<Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
				<div
					role="toolbar"
					aria-label="Audit table controls"
					className="flex flex-wrap items-center justify-between gap-3 border-b py-3"
				>
					<CollapsibleTrigger asChild>
						<Button variant="outline" aria-label="Audit filters">
							<SlidersHorizontal
								aria-hidden="true"
								className="size-4"
							/>
							Filters
							{activeFilterCount > 0 && (
								<Badge variant="secondary">
									{activeFilterCount}
								</Badge>
							)}
							<ChevronDown
								aria-hidden="true"
								className={`size-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
							/>
						</Button>
					</CollapsibleTrigger>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							disabled={
								isLoading || isExporting || Boolean(error)
							}
							onClick={handleExport}
						>
							<Download className="size-4" aria-hidden="true" />
							{isExporting ? "Exporting…" : "Export CSV"}
						</Button>
						<Button
							type="button"
							variant="outline"
							size="icon"
							aria-label="Refresh"
							title="Refresh audit trail"
							disabled={isLoading}
							onClick={refresh}
						>
							<RefreshCw className="size-4" aria-hidden="true" />
						</Button>
					</div>
				</div>
				<CollapsibleContent forceMount hidden={!filtersOpen}>
					<div className="border-b py-4">
						<AuditTrailsFilters onApply={handleApply} />
					</div>
				</CollapsibleContent>
			</Collapsible>
			{error ? (
				<Alert variant="destructive">
					<AlertTitle>Unable to load audit trails</AlertTitle>
					<AlertDescription>
						<P className="break-words text-sm">{error}</P>
						<Button
							type="button"
							variant="outline"
							onClick={refresh}
						>
							Retry
						</Button>
					</AlertDescription>
				</Alert>
			) : isLoading ? (
				<div
					className="flex min-h-60 flex-col gap-4"
					aria-hidden="true"
				>
					{[0, 1, 2, 3, 4].map((row) => (
						<Skeleton key={row} className="h-10 w-full" />
					))}
				</div>
			) : events.length === 0 ? (
				<div className="flex min-h-60 flex-col items-center justify-center gap-2 p-6 text-center">
					<H4 className="font-medium text-base">
						{hasFilters
							? "No matching audit events"
							: query.page > 0
								? "No more audit events"
								: "No audit events yet"}
					</H4>
					<P className="max-w-prose text-muted-foreground text-sm">
						{hasFilters
							? "Change or clear the filters to see more events."
							: "Recorded sign-ins, permissions, and resource changes will appear here."}
					</P>
				</div>
			) : (
				<section
					className="min-w-0 overflow-x-auto focus-visible:outline-2 focus-visible:outline-ring"
					aria-label="Audit events"
					// biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard users need to scroll the bounded results table.
					tabIndex={0}
				>
					<Table
						className="min-w-max"
						wrapperClassName="overflow-visible"
					>
						<TableCaption className="sr-only">
							Security and administrative audit events, newest
							first. All times are UTC.
						</TableCaption>
						<TableHeader>
							<TableRow>
								{[
									"Time (UTC)",
									"Actor",
									"Action",
									"Event type",
									"Resource",
									"Affected user",
									"Status",
									"Severity",
									"Details",
								].map((label) => (
									<TableHead key={label} scope="col">
										{label}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{events.map((event) => (
								<TableRow key={String(event.EVENT_ID)}>
									<TableCell>
										{formatAuditTime(event.EVENT_TIME)}
									</TableCell>
									<TableCell className="max-w-64 whitespace-normal break-words">
										<P className="text-sm">
											{event.ACTOR_USER_NAME ||
												event.ACTOR_USER_ID ||
												"—"}
										</P>
										{event.ACTOR_USER_NAME &&
										event.ACTOR_USER_ID ? (
											<P className="text-muted-foreground text-xs">
												{event.ACTOR_USER_ID}
											</P>
										) : null}
									</TableCell>
									<TableCell className="max-w-48 whitespace-normal break-words">
										{event.ACTION || "—"}
									</TableCell>
									<TableCell className="max-w-48 whitespace-normal break-words">
										{event.EVENT_TYPE || "—"}
									</TableCell>
									<TableCell className="max-w-64 whitespace-normal break-words">
										<P className="text-sm">
											{event.TARGET_NAME ||
												event.TARGET_ID ||
												"—"}
										</P>
										<P className="text-muted-foreground text-xs">
											{event.TARGET_TYPE || "—"}
										</P>
									</TableCell>
									<TableCell className="max-w-64 whitespace-normal break-words">
										{event.SUBJECT_USER_NAME ||
											event.SUBJECT_USER_ID ||
											"—"}
									</TableCell>
									<TableCell>
										<Badge
											variant={statusVariant(
												event.STATUS,
											)}
										>
											{event.STATUS || "Unknown"}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge
											variant={severityVariant(
												event.SEVERITY,
											)}
										>
											{event.SEVERITY || "—"}
										</Badge>
									</TableCell>
									<TableCell>
										<AuditEventDetails event={event} />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</section>
			)}
			<footer className="flex flex-col gap-3 border-t py-3 sm:flex-row sm:items-center sm:justify-between">
				<output>
					<P className="text-muted-foreground text-sm">
						{isLoading
							? "Loading audit events…"
							: error
								? "Audit events unavailable"
								: events.length === 0
									? "0 events"
									: `Showing ${query.page * AUDIT_PAGE_SIZE + 1}-${query.page * AUDIT_PAGE_SIZE + events.length} events`}
					</P>
				</output>
				<nav
					aria-label="Audit events pagination"
					className="flex flex-wrap items-center gap-2"
				>
					<span className="text-muted-foreground text-sm">
						{AUDIT_PAGE_SIZE} per page
					</span>
					<Button
						type="button"
						variant="outline"
						size="icon"
						aria-label="Previous"
						title="Previous page"
						disabled={isLoading || query.page === 0}
						onClick={() =>
							setQuery((previous) => ({
								...previous,
								page: previous.page - 1,
							}))
						}
					>
						<ChevronLeft aria-hidden="true" className="size-4" />
					</Button>
					<span className="min-w-16 text-center text-sm">
						Page {query.page + 1}
					</span>
					<Button
						type="button"
						variant="outline"
						size="icon"
						aria-label="Next"
						title="Next page"
						disabled={isLoading || Boolean(error) || !hasNextPage}
						onClick={() =>
							setQuery((previous) => ({
								...previous,
								page: previous.page + 1,
							}))
						}
					>
						<ChevronRight aria-hidden="true" className="size-4" />
					</Button>
				</nav>
			</footer>
		</div>
	);
};
