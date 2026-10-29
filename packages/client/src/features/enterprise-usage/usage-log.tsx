import { PanelRightOpen } from "lucide-react";
import { useRef, useState } from "react";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	H3,
	Muted,
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
import {
	logQuery,
	summaryQuery,
	USAGE_PAGE_SIZE,
} from "@/api/enterprise-usage-requests";
import type { UsageFilters, UsageSelection, UsageSource } from "./usage.types";
import { describeMessageBilledTo } from "./usage-billed-to";
import { UsageDetail } from "./usage-detail";
import {
	formatCost,
	formatMetric,
	messageTokenParts,
	numeric,
} from "./usage-metrics";
import { UsageNotes } from "./usage-notes";
import { UsageState } from "./usage-state";
import { useUsageExport } from "./use-usage-export";
import { useUsageQuery } from "./use-usage-query";

/** What every export of a log does, whichever log it is. */
const EXPORT_NOTES = [
	"Exports Start At The Newest Matching Record, Whatever Page Is Shown.",
	"Exports Include Metadata Only; Open A Record To See Its Content.",
] as const;

/** How to read the model message log. */
const MODEL_LOG_NOTES = [
	"Input And Response Are Separate Message Rows.",
	"Model Request KPIs Count Inputs Once; Latency KPIs Use Response Rows Only.",
	"An Input's Tokens Split Into Uncached Input, Cache-Read And Cache-Creation Tokens; A Response's Into Visible Output And Thinking Tokens.",
	"A Call's Cost Is On Its Response Row, As Recorded When It Was Billed.",
	"Billed To Is The Usage Limit The Call Counted Against; Messages Logged Before Calls Recorded It Say Not Recorded.",
	...EXPORT_NOTES,
];

/** How to read the activity log. */
const ACTIVITY_LOG_NOTES = [
	"Recorded Platform Operations, With User, App, Engine, And Outcome.",
	"Unknown Outcomes Are Excluded From Success-Rate Calculations.",
	...EXPORT_NOTES,
];

interface UsageLogProps {
	/** Selects inference messages or platform events. */
	source: UsageSource;
	/** Shared scope, including user, app and model filters. */
	filters: UsageFilters;
}

/** A server-paginated event log with bounded CSV exports and on-demand content inspection. */
export function UsageLog({ source, filters }: UsageLogProps) {
	const [page, setPage] = useState(0);
	const [selection, setSelection] = useState<UsageSelection | null>(null);
	const { isExporting, exportError, exportStatus, exportReport } =
		useUsageExport();
	const trigger = useRef<HTMLButtonElement | null>(null);
	const result = useUsageQuery(logQuery(source, filters, page));
	const summary = useUsageQuery(summaryQuery(source, filters));
	const count = numeric(
		summary.rows[0],
		source === "model" ? "MESSAGE_ROWS" : "EVENTS",
	);
	const isModel = source === "model";
	const title = isModel ? "Model Message Log" : "Enterprise Activity Log";
	const handleExport = (): Promise<void> =>
		exportReport({ view: "logs", format: "csv", source, filters });
	return (
		<div className="min-w-0 space-y-2">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-1">
					<H3>{title}</H3>
					<UsageNotes
						title={title}
						notes={isModel ? MODEL_LOG_NOTES : ACTIVITY_LOG_NOTES}
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
			{summary.error && (
				<UsageState result={summary} label="Log Count">
					{null}
				</UsageState>
			)}
			<UsageState
				result={result}
				label={isModel ? "Model Messages" : "Activity Events"}
			>
				{result.rows.length === 0 ? (
					<Muted>
						No Records Match These Filters. Widen The Date Range Or
						Reset The Filters.
					</Muted>
				) : (
					<section
						aria-label={
							isModel ? "Model Messages" : "Activity Events"
						}
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
										"Time (Log Database)",
										"User",
										"App",
										isModel ? "Model" : "Engine",
										"Method",
										isModel ? "Message Type" : "Outcome",
										...(isModel
											? [
													"Tokens",
													"Cost",
													"Billed To",
													"Latency (s)",
												]
											: []),
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
								{result.rows.map((row) => (
									<TableRow key={String(row.ROW_NUM)}>
										<TableCell>
											{String(row.TIME ?? "-")}
										</TableCell>
										<TableCell className="max-w-48 whitespace-normal break-words">
											{String(
												row.USER_NAME ||
													row.USER_ID ||
													"Unattributed",
											)}
										</TableCell>
										<TableCell className="max-w-48 whitespace-normal break-words">
											{String(
												row.APP_NAME ||
													row.APP_ID ||
													"Unattributed",
											)}
										</TableCell>
										<TableCell className="max-w-48 whitespace-normal break-words">
											{String(
												row.MODEL_NAME ||
													row.ENGINE_NAME ||
													row.MODEL_ID ||
													row.ENGINE_ID ||
													"Unattributed",
											)}
										</TableCell>
										<TableCell>
											{String(row.METHOD ?? "-")}
										</TableCell>
										<TableCell>
											{isModel ? (
												<Badge variant="outline">
													{String(row.MESSAGE_TYPE)}
												</Badge>
											) : (
												<Badge
													variant={
														row.IS_SUCCESS ===
															false ||
														row.IS_SUCCESS === 0
															? "destructive"
															: "outline"
													}
												>
													{row.IS_SUCCESS === true ||
													row.IS_SUCCESS === 1
														? "Succeeded"
														: row.IS_SUCCESS ===
																	false ||
																row.IS_SUCCESS ===
																	0
															? "Failed"
															: "Unknown"}
												</Badge>
											)}
										</TableCell>
										{isModel && (
											<>
												<TableCell className="min-w-36 whitespace-normal">
													<span className="tabular-nums">
														{formatMetric(
															numeric(
																row,
																"TOKENS",
															),
														)}
													</span>
													{messageTokenParts(row).map(
														(part) => (
															<span
																key={part.label}
																className="block text-muted-foreground tabular-nums"
															>
																{formatMetric(
																	part.tokens,
																)}{" "}
																{part.label}
															</span>
														),
													)}
												</TableCell>
												<TableCell className="tabular-nums">
													{row.MESSAGE_TYPE ===
													"RESPONSE"
														? formatCost(
																numeric(
																	row,
																	"COST_MICROS",
																),
															)
														: "-"}
												</TableCell>
												<TableCell className="max-w-48 whitespace-normal break-words">
													{describeMessageBilledTo(
														row,
													)}
												</TableCell>
												<TableCell>
													{row.MESSAGE_TYPE ===
														"RESPONSE" &&
													numeric(
														row,
														"LATENCY_MS",
													) !== null
														? formatMetric(
																Number(
																	row.LATENCY_MS,
																) / 1000,
																2,
															)
														: "-"}
												</TableCell>
											</>
										)}
										<TableCell className="text-center">
											<Tooltip
												disableHoverableContent={false}
											>
												<TooltipTrigger asChild>
													<Button
														variant="ghost"
														size="icon-sm"
														className="text-muted-foreground hover:text-foreground"
														aria-label={`View ${isModel ? "Message" : "Event"} Details: ${row.MESSAGE_ID ?? row.LOG_ID}`}
														aria-haspopup="dialog"
														onClick={(event) => {
															trigger.current =
																event.currentTarget;
															setSelection({
																source,
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
													View{" "}
													{isModel
														? "Message"
														: "Event"}{" "}
													Details
												</TooltipContent>
											</Tooltip>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</section>
				)}
			</UsageState>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<Muted>
					{result.isLoading
						? "Loading Records..."
						: `Page ${page + 1} | ${formatMetric(count)} Matching Rows${count === null ? " (Count Unavailable)" : ""}`}
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
