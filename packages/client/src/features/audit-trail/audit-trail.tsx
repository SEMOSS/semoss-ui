import { ChevronLeft, ChevronRight, Download, RefreshCw } from "lucide-react";
import { useState } from "react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Collapsible,
	CollapsibleContent,
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
	EMPTY_AUDIT_FILTERS,
	exportAuditEvents,
	formatAuditTime,
	toAuditCsv,
} from "@/api/audit-trail";
import { AuditEventDetails } from "./audit-event-details";
import { AuditEventSummary } from "./audit-event-summary";
import { AuditFilterToggle } from "./audit-filter-toggle";
import { AuditIdentity } from "./audit-identity";
import { auditText } from "./audit-labels";
import { AuditSeverityBadge } from "./audit-severity-badge";
import { AuditStatusBadge } from "./audit-status-badge";
import { AuditTarget } from "./audit-target";
import { AuditTrailFilterForm } from "./audit-trail-filter-form";
import { useAuditTrail } from "./use-audit-trail";

/** The table's columns, in order; Details holds each event's details button */
const COLUMNS = [
	"Time (UTC)",
	"Event",
	"Actor",
	"Resource",
	"Affected user",
	"Status",
	"Severity",
	"Details",
] as const;

/** Browse, filter, and export the security and administrative audit trail. */
export const AuditTrail = () => {
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [query, setQuery] = useState<{
		filters: AuditTrailFilters;
		page: number;
		snapshot?: string;
	}>({
		filters: EMPTY_AUDIT_FILTERS,
		page: 0,
	});
	const [isExporting, setIsExporting] = useState(false);
	const { events, hasNextPage, isLoading, error, refresh, snapshot } =
		useAuditTrail(query.filters, query.page, query.snapshot);
	const handleRefresh = () => {
		setQuery({ filters: query.filters, page: 0 });
		if (query.page === 0 && query.snapshot === undefined) refresh();
	};
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
			const exported = await exportAuditEvents(
				query.filters,
				snapshot ?? query.snapshot,
			);
			if (exported.length === 0) {
				toast.error("There are no audit events to export.");
				return;
			}
			downloadBlob(
				new Blob([toAuditCsv(exported)], {
					type: "text/csv;charset=utf-8;",
				}),
				`audit-trail-${new Date().toISOString().slice(0, 10)}.csv`,
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
					<AuditFilterToggle
						open={filtersOpen}
						activeFilterCount={activeFilterCount}
					/>
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
							{isExporting ? "Exporting..." : "Export CSV"}
						</Button>
						<Button
							type="button"
							variant="outline"
							size="icon"
							aria-label="Refresh"
							title="Refresh audit trail"
							disabled={isLoading}
							onClick={handleRefresh}
						>
							<RefreshCw className="size-4" aria-hidden="true" />
						</Button>
					</div>
				</div>
				<CollapsibleContent forceMount hidden={!filtersOpen}>
					<div className="border-b py-4">
						<AuditTrailFilterForm onApply={handleApply} />
					</div>
				</CollapsibleContent>
			</Collapsible>
			{error ? (
				<Alert variant="destructive">
					<AlertTitle>Unable to load the audit trail</AlertTitle>
					<AlertDescription>
						<P className="break-words text-sm">{error}</P>
						<Button
							type="button"
							variant="outline"
							onClick={handleRefresh}
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
								{COLUMNS.map((label) => (
									<TableHead
										key={label}
										scope="col"
										className={
											label === "Details"
												? "w-16 text-center"
												: undefined
										}
									>
										{label}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{events.map((event: AuditEvent) => (
								<TableRow key={String(event.EVENT_ID)}>
									<TableCell className="whitespace-nowrap text-sm">
										{formatAuditTime(event.EVENT_TIME)}
									</TableCell>
									<TableCell className="max-w-56">
										<AuditEventSummary event={event} />
									</TableCell>
									<TableCell className="max-w-64">
										<AuditIdentity
											id={auditText(event.ACTOR_USER_ID)}
											type={auditText(
												event.ACTOR_USER_TYPE,
											)}
											name={auditText(
												event.ACTOR_USER_NAME,
											)}
											isAdmin={
												event.ACTOR_IS_ADMIN === true
											}
										/>
									</TableCell>
									<TableCell className="max-w-64">
										<AuditTarget event={event} />
									</TableCell>
									<TableCell className="max-w-64">
										<AuditIdentity
											id={auditText(
												event.SUBJECT_USER_ID,
											)}
											type={auditText(
												event.SUBJECT_USER_TYPE,
											)}
											name={auditText(
												event.SUBJECT_USER_NAME,
											)}
											emptyLabel="-"
										/>
									</TableCell>
									<TableCell>
										<AuditStatusBadge
											status={event.STATUS}
										/>
									</TableCell>
									<TableCell>
										<AuditSeverityBadge
											severity={event.SEVERITY}
										/>
									</TableCell>
									<TableCell className="text-center">
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
							? "Loading audit events..."
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
								snapshot: snapshot ?? previous.snapshot,
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
								snapshot: snapshot ?? previous.snapshot,
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
