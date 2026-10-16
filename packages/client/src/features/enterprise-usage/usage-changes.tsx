import { PanelRightOpen } from "lucide-react";
import { useRef, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardContent,
	H3,
	Muted,
	P,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { formatAuditTime } from "@/api/audit-trail";
import {
	logQuery,
	summaryQuery,
	USAGE_PAGE_SIZE,
} from "@/api/enterprise-usage-requests";
import { AuditEventSummary } from "@/features/audit-trail/audit-event-summary";
import { AuditIdentity } from "@/features/audit-trail/audit-identity";
import { auditText } from "@/features/audit-trail/audit-labels";
import { AuditStatusBadge } from "@/features/audit-trail/audit-status-badge";
import { AuditTarget } from "@/features/audit-trail/audit-target";
import type { UsageFilters, UsageSelection } from "./usage.types";
import { UsageDetail } from "./usage-detail";
import { formatMetric, numeric } from "./usage-metrics";
import { UsageNotes } from "./usage-notes";
import { UsageState } from "./usage-state";
import { useUsageExport } from "./use-usage-export";
import { useUsageQuery } from "./use-usage-query";

/** How to read the tab. */
const CHANGES_NOTES = [
	"Access Given, Changed, Or Ended, And Access Requests Answered.",
	"Requests Denied For Lack Of Access.",
	"Usage Limits Set, Changed, Or Removed.",
	"Read From The Audit Trail; Times Are Shown In UTC.",
	"The Dates Are The Server's Days, So A Change Counts On The Day It Was Made Even When Its UTC Time Is On Another Day.",
	"The User Filter Matches Who Made A Change Or Was Denied, Or Whom A Change Was For.",
	"Open An Event To See What Was There Before And After, Or Why A Request Was Denied.",
	"Exports Include Metadata Only.",
] as const;

/** The summary's counts, with what each one counts. */
const SUMMARY_KPIS = [
	{
		key: "USAGE_LIMIT_CHANGES",
		label: "Usage Limit Changes",
		description: "Limits Set, Changed, Or Removed",
	},
	{
		key: "ACCESS_CHANGES",
		label: "Access Changes",
		description: "Access Given, Changed, Or Ended, And Requests Answered",
	},
	{
		key: "DENIALS",
		label: "Denied Requests",
		description: "Requests Refused For Lack Of Access",
	},
	{
		key: "ACTORS",
		label: "People Making Changes",
		description: "Distinct People Who Made A Change",
	},
	{
		key: "PEOPLE_DENIED",
		label: "People Denied",
		description: "Distinct People Refused At Least Once",
	},
	{
		key: "PEOPLE_AFFECTED",
		label: "People Affected",
		description: "Distinct People A Change Was For",
	},
] as const;

export interface UsageChangesProps {
	/** Shared scope; the user filter matches who made a change or was denied, or whom a change was for. */
	filters: UsageFilters;
}

/** The audit trail's access changes, denied requests and usage limit changes: counts, a server-paginated log, and each event on request. */
export function UsageChanges({ filters }: UsageChangesProps) {
	const [page, setPage] = useState(0);
	const [selection, setSelection] = useState<UsageSelection | null>(null);
	const { isExporting, exportError, exportStatus, exportReport } =
		useUsageExport();
	const trigger = useRef<HTMLButtonElement | null>(null);
	const summary = useUsageQuery(summaryQuery("audit", filters));
	const result = useUsageQuery(logQuery("audit", filters, page));
	const summaryRow = summary.rows[0];
	const count = numeric(summaryRow, "EVENTS");
	const handleExport = (): Promise<void> =>
		exportReport({ view: "logs", format: "csv", source: "audit", filters });
	return (
		<div className="min-w-0 space-y-2">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-1">
					<H3>Access And Usage Limits</H3>
					<UsageNotes
						title="Access And Usage Limits"
						notes={CHANGES_NOTES}
					/>
				</div>
				<Button
					variant="outline"
					disabled={
						isExporting ||
						result.isLoading ||
						Boolean(result.error) ||
						result.rows.length === 0
					}
					onClick={handleExport}
				>
					{isExporting
						? "Exporting..."
						: "Export CSV (Up To 5,000 Rows)"}
				</Button>
			</div>
			<output className="text-muted-foreground text-sm">
				{exportStatus}
			</output>
			{exportError && (
				<Alert variant="destructive">
					<AlertDescription>{exportError}</AlertDescription>
				</Alert>
			)}
			<UsageState result={summary} label="Access And Limit Summary">
				<div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-6">
					{SUMMARY_KPIS.map((kpi) => (
						<Card key={kpi.key} className="gap-0 py-0 shadow-none">
							<CardContent className="space-y-1 p-3">
								<Muted className="text-xs">{kpi.label}</Muted>
								<P className="font-bold text-xl tabular-nums">
									{formatMetric(numeric(summaryRow, kpi.key))}
								</P>
								<Muted className="text-xs">
									{kpi.description}
								</Muted>
							</CardContent>
						</Card>
					))}
				</div>
			</UsageState>
			<UsageState result={result} label="Access And Limit Events">
				{result.rows.length === 0 ? (
					<Muted>
						No Access Or Usage Limit Events Match These Filters.
						Widen The Date Range Or Reset The Filters.
					</Muted>
				) : (
					<section
						aria-label="Access And Usage Limit Events"
						// biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard scrolling of the bounded table requires a focus target.
						tabIndex={0}
						className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-ring"
					>
						<Table
							wrapperClassName="overflow-visible"
							className="text-xs [&_td]:py-1 [&_th]:h-8"
						>
							<TableHeader>
								<TableRow>
									{[
										"Time (UTC)",
										"Event",
										"By",
										"For",
										"On",
										"Outcome",
										"Details",
									].map((label) => (
										<TableHead
											scope="col"
											key={label}
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
								{result.rows.map((row) => {
									const eventId = auditText(row.EVENT_ID);
									return (
										<TableRow key={eventId}>
											<TableCell className="whitespace-nowrap">
												{formatAuditTime(
													row.EVENT_TIME ?? null,
												)}
											</TableCell>
											<TableCell className="max-w-56">
												<AuditEventSummary
													event={{
														EVENT_TYPE:
															row.EVENT_TYPE ??
															null,
														ACTION:
															row.ACTION ?? null,
														STATUS:
															row.STATUS ?? null,
													}}
												/>
											</TableCell>
											<TableCell className="max-w-56">
												<AuditIdentity
													id={auditText(
														row.ACTOR_USER_ID,
													)}
													type={auditText(
														row.ACTOR_USER_TYPE,
													)}
													name={auditText(
														row.ACTOR_USER_NAME,
													)}
												/>
											</TableCell>
											<TableCell className="max-w-56">
												<AuditIdentity
													id={auditText(
														row.SUBJECT_USER_ID,
													)}
													type={auditText(
														row.SUBJECT_USER_TYPE,
													)}
													name={auditText(
														row.SUBJECT_USER_NAME,
													)}
													emptyLabel="-"
												/>
											</TableCell>
											<TableCell className="max-w-56">
												<AuditTarget event={row} />
											</TableCell>
											<TableCell>
												<AuditStatusBadge
													status={row.STATUS}
												/>
											</TableCell>
											<TableCell className="text-center">
												<Tooltip
													disableHoverableContent={
														false
													}
												>
													<TooltipTrigger asChild>
														<Button
															variant="ghost"
															size="icon-sm"
															className="text-muted-foreground hover:text-foreground"
															aria-label={`View Event Details: ${eventId}`}
															aria-haspopup="dialog"
															onClick={(
																event,
															) => {
																trigger.current =
																	event.currentTarget;
																setSelection({
																	source: "audit",
																	row,
																});
															}}
														>
															<PanelRightOpen aria-hidden="true" />
														</Button>
													</TooltipTrigger>
													<TooltipContent
														side="left"
														sideOffset={4}
													>
														View Event Details
													</TooltipContent>
												</Tooltip>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</section>
				)}
			</UsageState>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<Muted>
					{result.isLoading
						? "Loading Events..."
						: `Page ${page + 1} | ${formatMetric(count)} Matching Events${count === null ? " (Count Unavailable)" : ""}`}
				</Muted>
				<div className="flex gap-2">
					<Button
						variant="outline"
						disabled={page === 0 || result.isLoading}
						onClick={() => setPage((value) => value - 1)}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						disabled={
							result.isLoading ||
							Boolean(result.error) ||
							result.rows.length < USAGE_PAGE_SIZE ||
							(count !== null &&
								(page + 1) * USAGE_PAGE_SIZE >= count)
						}
						onClick={() => setPage((value) => value + 1)}
					>
						Next
					</Button>
				</div>
			</div>
			<UsageDetail
				selection={selection}
				onClose={() => setSelection(null)}
				onReturnFocus={() => trigger.current?.focus()}
			/>
		</div>
	);
}
