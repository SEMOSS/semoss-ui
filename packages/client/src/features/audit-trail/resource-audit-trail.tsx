import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	RefreshCw,
} from "lucide-react";
import { useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Collapsible,
	CollapsibleContent,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import { EMPTY_AUDIT_FILTERS, formatAuditTime } from "@/api/audit-trail";
import type {
	AuditDirection,
	AuditScope,
	AuditSort,
} from "@/api/resource-audit-trail";
import { AuditEventDetails } from "./audit-event-details";
import { AuditEventSummary } from "./audit-event-summary";
import { AuditFilterToggle } from "./audit-filter-toggle";
import { AuditIdentity } from "./audit-identity";
import { auditText } from "./audit-labels";
import { AuditSeverityBadge } from "./audit-severity-badge";
import { AuditStatusBadge } from "./audit-status-badge";
import { AuditTrailFilterForm } from "./audit-trail-filter-form";
import { useResourceAuditTrail } from "./use-resource-audit-trail";

const columns: { label: string; sort?: AuditSort }[] = [
	{ label: "Time (UTC)", sort: "EVENT_TIME" },
	{ label: "Event", sort: "EVENT_TYPE" },
	{ label: "Actor", sort: "ACTOR_USER_NAME" },
	{ label: "Affected user" },
	{ label: "Status", sort: "STATUS" },
	{ label: "Severity", sort: "SEVERITY" },
	{ label: "Details" },
];

export interface ResourceAuditTrailProps {
	/** Whether the resource is an engine or a project */
	scope: AuditScope;
	/** The engine's or project's id */
	resourceId: string;
}

/** Owner-only resource history; access is checked again by the backend on every read. */
export function ResourceAuditTrail({
	scope,
	resourceId,
}: ResourceAuditTrailProps) {
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [query, setQuery] = useState({
		filters: EMPTY_AUDIT_FILTERS,
		page: 0,
		pageSize: 25,
		sort: "EVENT_TIME" as AuditSort,
		direction: "DESC" as AuditDirection,
	});
	const { events, hasNextPage, isLoading, error, refresh } =
		useResourceAuditTrail(
			scope,
			resourceId,
			query.filters,
			query.page,
			query.pageSize,
			query.sort,
			query.direction,
		);
	const handleSort = (sort: AuditSort) =>
		setQuery((previous) => ({
			...previous,
			page: 0,
			sort,
			direction:
				previous.sort === sort && previous.direction === "DESC"
					? "ASC"
					: "DESC",
		}));
	const activeFilterCount = Object.values(query.filters).filter(
		Boolean,
	).length;
	return (
		<section
			aria-label="Resource audit trail"
			className="flex w-full min-w-0 flex-col"
		>
			<Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
				<div
					role="toolbar"
					aria-label="Audit table controls"
					className="flex items-center justify-between gap-3 border-b py-3"
				>
					<AuditFilterToggle
						open={filtersOpen}
						activeFilterCount={activeFilterCount}
					/>
					<Button
						variant="outline"
						size="icon"
						aria-label="Refresh audit trail"
						title="Refresh audit trail"
						onClick={refresh}
						disabled={isLoading}
					>
						<RefreshCw aria-hidden="true" className="size-4" />
					</Button>
				</div>
				<CollapsibleContent forceMount hidden={!filtersOpen}>
					<div className="border-b py-4">
						<AuditTrailFilterForm
							resourceScoped
							onApply={(filters) =>
								setQuery((previous) => ({
									...previous,
									filters,
									page: 0,
								}))
							}
						/>
					</div>
				</CollapsibleContent>
			</Collapsible>
			{error ? (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : (
				<section
					className="min-w-0 overflow-x-auto"
					aria-label="Audit events"
					// biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll this bounded table region.
					tabIndex={0}
					aria-busy={isLoading}
				>
					<Table>
						<TableHeader>
							<TableRow>
								{columns.map((column) => (
									<TableHead
										key={column.label}
										className={
											column.label === "Details"
												? "w-16 text-center"
												: undefined
										}
										aria-sort={
											column.sort
												? query.sort === column.sort
													? query.direction === "DESC"
														? "descending"
														: "ascending"
													: "none"
												: undefined
										}
									>
										{column.sort ? (
											<Button
												size="sm"
												variant="ghost"
												disabled={isLoading}
												onClick={() =>
													column.sort &&
													handleSort(column.sort)
												}
											>
												{column.label}
												{query.sort === column.sort ? (
													query.direction ===
													"DESC" ? (
														<ArrowDown
															aria-hidden="true"
															className="size-4"
														/>
													) : (
														<ArrowUp
															aria-hidden="true"
															className="size-4"
														/>
													)
												) : (
													<ArrowUpDown
														aria-hidden="true"
														className="size-4"
													/>
												)}
											</Button>
										) : (
											column.label
										)}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{events.map((event) => (
								<TableRow key={event.EVENT_ID}>
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
										/>
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
										<AuditEventDetails
											event={event}
											resourceScoped
										/>
									</TableCell>
								</TableRow>
							))}
							{events.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={7}
										className="h-32 text-center text-muted-foreground"
									>
										{isLoading
											? "Loading audit events..."
											: "No audit events match these filters."}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</section>
			)}
			<footer className="flex flex-col gap-3 border-t py-3 sm:flex-row sm:items-center sm:justify-between">
				<P aria-live="polite" className="text-muted-foreground text-sm">
					{isLoading
						? "Loading audit events..."
						: error
							? "Audit events unavailable"
							: events.length === 0
								? "0 events"
								: `Showing ${query.page * query.pageSize + 1}-${query.page * query.pageSize + events.length} events`}
				</P>
				<nav
					aria-label="Audit table pagination"
					className="flex flex-wrap items-center gap-2"
				>
					<Select
						value={String(query.pageSize)}
						onValueChange={(value) =>
							setQuery((previous) => ({
								...previous,
								page: 0,
								pageSize: Number(value),
							}))
						}
						disabled={isLoading}
					>
						<SelectTrigger
							className="w-40"
							aria-label="Events per page"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{[25, 50, 100].map((size) => (
								<SelectItem key={size} value={String(size)}>
									{size} per page
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						variant="outline"
						size="icon"
						title="Previous page"
						aria-label="Previous page"
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
						variant="outline"
						size="icon"
						title="Next page"
						aria-label="Next page"
						disabled={
							isLoading ||
							!!error ||
							!hasNextPage ||
							query.page >= 1000
						}
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
		</section>
	);
}
