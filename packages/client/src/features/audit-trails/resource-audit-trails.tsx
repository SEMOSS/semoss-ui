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
	Badge,
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
import {
	EMPTY_AUDIT_FILTERS,
	formatAuditTime,
	formatAuditValue,
} from "@/api/audit-trails";
import type {
	AuditDirection,
	AuditScope,
	AuditSort,
} from "@/api/resource-audit-trails";
import { AuditEventDetails } from "./audit-event-details";
import { AuditFilterToggle } from "./audit-filter-toggle";
import { AuditTrailsFilters } from "./audit-trails-filters";
import { useResourceAuditTrails } from "./use-resource-audit-trails";

const columns: { label: string; sort?: AuditSort }[] = [
	{ label: "Time (UTC)", sort: "EVENT_TIME" },
	{ label: "Actor", sort: "ACTOR_USER_NAME" },
	{ label: "Event type", sort: "EVENT_TYPE" },
	{ label: "Affected user" },
	{ label: "Status", sort: "STATUS" },
	{ label: "Severity", sort: "SEVERITY" },
	{ label: "Details" },
];

/** Owner-only resource history; access is checked again by the backend on every read. */
export function ResourceAuditTrails({
	scope,
	resourceId,
}: {
	scope: AuditScope;
	resourceId: string;
}) {
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [query, setQuery] = useState({
		filters: EMPTY_AUDIT_FILTERS,
		page: 0,
		pageSize: 25,
		sort: "EVENT_TIME" as AuditSort,
		direction: "DESC" as AuditDirection,
	});
	const { events, hasNextPage, isLoading, error, refresh } =
		useResourceAuditTrails(
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
						<AuditTrailsFilters
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
									<TableCell className="whitespace-nowrap">
										{formatAuditTime(event.EVENT_TIME)}
									</TableCell>
									<TableCell className="max-w-64 break-all">
										{formatAuditValue(
											event.ACTOR_USER_NAME ||
												event.ACTOR_USER_ID,
										)}
									</TableCell>
									<TableCell>{event.EVENT_TYPE}</TableCell>
									<TableCell className="max-w-64 break-all">
										{formatAuditValue(
											event.SUBJECT_USER_NAME ||
												event.SUBJECT_USER_ID,
										)}
									</TableCell>
									<TableCell>
										<Badge
											variant={
												event.STATUS === "SUCCESS"
													? "secondary"
													: "destructive"
											}
										>
											{event.STATUS}
										</Badge>
									</TableCell>
									<TableCell>{event.SEVERITY}</TableCell>
									<TableCell>
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
