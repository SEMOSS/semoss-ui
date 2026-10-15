import { Download, FileText } from "lucide-react";
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardContent,
	H3,
	H4,
	Muted,
	P,
} from "@semoss/ui/next";
import {
	comparisonUsageFilters,
	feedbackQuery,
	latencyQuery,
	summaryQuery,
	trendQuery,
	usageWindowDays,
} from "@/api/enterprise-usage-requests";
import type {
	UsageBenchmark as Benchmark,
	UsageDateRange,
	UsageFilters,
	UsageRow,
	UsageSource,
} from "./usage.types";
import { UsageBenchmark } from "./usage-benchmark";
import {
	fillUsageDays,
	formatMetric,
	modelKpis,
	numeric,
	percentage,
	periodChange,
} from "./usage-metrics";
import { UsageState } from "./usage-state";
import { UsageTrend } from "./usage-trend";
import { useUsageExport } from "./use-usage-export";
import { useUsageQuery } from "./use-usage-query";

interface UsageOverviewProps {
	/** Applied scope for aggregates, charts and exports. */
	filters: UsageFilters;
	/** Selected comparison window. */
	benchmark: Benchmark;
	onBenchmark: (value: Benchmark) => void;
	/** Logging source displayed in this tab. */
	source: UsageSource;
	/** Shared chart selection and reset actions. */
	selectedRange: UsageDateRange | null;
	onRange: (range: UsageDateRange) => void;
	onClearRange: () => void;
}

/** Enterprise-level KPIs with independently recoverable model and activity sources. */
export function UsageOverview({
	filters,
	source,
	selectedRange,
	onRange,
	onClearRange,
	benchmark,
	onBenchmark,
}: UsageOverviewProps) {
	const comparison = comparisonUsageFilters(filters, benchmark);
	const periods = {
		currentDays: usageWindowDays(filters),
		benchmarkDays: usageWindowDays(comparison),
	};
	const comparisonTrend = useUsageQuery(
		source === "model" ? trendQuery("model", comparison) : null,
	);
	const comparisonActivityTrend = useUsageQuery(
		source === "activity" ? trendQuery("activity", comparison) : null,
	);
	const comparisonModelDays =
		comparisonTrend.error || comparisonTrend.isLoading
			? undefined
			: fillUsageDays(comparisonTrend.rows, comparison);
	const comparisonActivityDays =
		comparisonActivityTrend.error || comparisonActivityTrend.isLoading
			? undefined
			: fillUsageDays(comparisonActivityTrend.rows, comparison);
	const model = useUsageQuery(
		source === "model" ? summaryQuery("model", filters) : null,
	);
	const previous = useUsageQuery(
		source === "model" ? summaryQuery("model", comparison) : null,
	);
	const trend = useUsageQuery(
		source === "model" ? trendQuery("model", filters) : null,
	);
	const latency = useUsageQuery(
		source === "model" ? latencyQuery(filters) : null,
	);
	const feedback = useUsageQuery(
		source === "model" ? feedbackQuery(filters) : null,
	);
	const activity = useUsageQuery(
		source === "activity" ? summaryQuery("activity", filters) : null,
	);
	const priorActivity = useUsageQuery(
		source === "activity" ? summaryQuery("activity", comparison) : null,
	);
	const activityTrend = useUsageQuery(
		source === "activity" ? trendQuery("activity", filters) : null,
	);
	const { isExporting, exportError, exportStatus, exportReport } =
		useUsageExport();
	const modelRow = model.rows[0];
	const activityRow = activity.rows[0];
	const modelDays = fillUsageDays(trend.rows, filters);
	const activityDays = fillUsageDays(activityTrend.rows, filters);
	const kpis = modelRow
		? modelKpis(
				modelRow,
				previous.rows[0],
				latency.rows[0],
				feedback.rows[0],
				periods,
			)
		: [];
	const success = percentage(
		numeric(activityRow, "SUCCEEDED"),
		numeric(activityRow, "KNOWN_OUTCOMES"),
	);
	const activityKpis = [
		{
			label: "Activity Events",
			value: formatMetric(numeric(activityRow, "EVENTS")),
			description: periodChange(
				numeric(activityRow, "EVENTS"),
				numeric(priorActivity.rows[0], "EVENTS"),
				periods,
			),
		},
		{
			label: "Active Platform Users",
			value: formatMetric(numeric(activityRow, "USERS")),
			description: "Users With Recorded Activity",
		},
		{
			label: "Failed Events",
			value: formatMetric(numeric(activityRow, "FAILED")),
			description: "Activity Records Marked Unsuccessful",
		},
		{
			label: "Activity Success Rate",
			value: success === null ? "-" : `${formatMetric(success, 1)}%`,
			description: `${formatMetric(numeric(activityRow, "KNOWN_OUTCOMES"))} Events With Known Outcomes`,
		},
	];
	const isExportLoading = [
		model,
		previous,
		trend,
		latency,
		feedback,
		activity,
		priorActivity,
		activityTrend,
	].some((result) => result.isLoading);
	const hasData = Boolean(modelRow || activityRow);
	const tokenRows: UsageRow[] = modelRow
		? [
				{
					METRIC: "Input Tokens",
					VALUE: numeric(modelRow, "INPUT_TOKENS"),
					NOTES: "Recorded INPUT Message Tokens",
				},
				{
					METRIC: "Output Tokens",
					VALUE: numeric(modelRow, "OUTPUT_TOKENS"),
					NOTES: "Recorded RESPONSE Message Tokens",
				},
				{
					METRIC: "Cache-Read Tokens",
					VALUE: numeric(modelRow, "CACHE_ROWS")
						? numeric(modelRow, "CACHE_READ_TOKENS")
						: null,
					NOTES: "Provider-Reported Detail; Do Not Add To Total Tokens",
				},
				{
					METRIC: "Cache-Creation Tokens",
					VALUE: numeric(modelRow, "CACHE_CREATION_TOKENS"),
					NOTES: "Provider-Reported Detail; Do Not Add To Total Tokens",
				},
				{
					METRIC: "Thinking Tokens",
					VALUE: numeric(modelRow, "THINKING_ROWS")
						? numeric(modelRow, "THINKING_TOKENS")
						: null,
					NOTES: "Provider-Reported Detail; Do Not Add To Total Tokens",
				},
			]
		: [];
	const handleExport = (format: "csv" | "pdf"): Promise<void> =>
		exportReport({
			view: "overview",
			format,
			source,
			filters,
			comparison,
		});
	return (
		<div className="space-y-3">
			<div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
				<H3>
					{source === "model"
						? "Token Consumption"
						: "Platform Activity"}
				</H3>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						disabled={isExporting || isExportLoading || !hasData}
						onClick={() => handleExport("csv")}
					>
						<Download aria-hidden="true" />
						KPI CSV
					</Button>
					<Button
						variant="outline"
						disabled={isExporting || isExportLoading || !hasData}
						onClick={() => handleExport("pdf")}
					>
						<FileText aria-hidden="true" />
						Export PDF
					</Button>
				</div>
			</div>
			<output
				className={
					isExporting || exportStatus
						? "block text-muted-foreground text-xs"
						: "sr-only"
				}
			>
				{isExporting ? "Preparing Export..." : exportStatus}
			</output>
			<UsageBenchmark
				value={benchmark}
				filters={filters}
				onApply={onBenchmark}
			/>
			{exportError && (
				<Alert variant="destructive">
					<AlertDescription>{exportError}</AlertDescription>
				</Alert>
			)}
			{source === "model" && (
				<>
					<UsageState result={model} label="Model Usage">
						{numeric(modelRow, "MESSAGE_ROWS") === 0 && (
							<Alert>
								<AlertDescription>
									No Model Messages Match These Filters. Try A
									Wider Date Range Or Reset The Filters.
								</AlertDescription>
							</Alert>
						)}
						<div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-5">
							{kpis.map((kpi) => (
								<Card
									key={kpi.label}
									className="gap-0 py-0 shadow-none"
								>
									<CardContent className="space-y-1 p-3">
										<Muted className="text-xs">
											{kpi.label}
										</Muted>
										<P className="font-bold text-xl tabular-nums">
											{kpi.value}
										</P>
										<Muted className="text-xs">
											{kpi.description}
										</Muted>
									</CardContent>
								</Card>
							))}
						</div>
						<div className="mt-3 space-y-2">
							<H4>Token Composition</H4>
							<dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
								{tokenRows.map((row) => (
									<div key={String(row.METRIC)}>
										<dt className="text-muted-foreground text-sm">
											{String(row.METRIC)}
										</dt>
										<dd className="font-medium tabular-nums">
											{formatMetric(
												numeric(row, "VALUE"),
											)}
										</dd>
									</div>
								))}
							</dl>
							<Muted>
								Token Reporting Coverage:{" "}
								{formatMetric(
									percentage(
										numeric(modelRow, "TOKEN_ROWS"),
										numeric(modelRow, "MESSAGE_ROWS"),
									),
									1,
								)}
								%. Cache And Thinking Counts Are Provider Detail
								And Must Not Be Added To The Total. Missing
								Counts Are Not An Estimate Of Zero Usage.
							</Muted>
						</div>
					</UsageState>
					{comparisonTrend.error && (
						<UsageState
							result={comparisonTrend}
							label="Benchmark Model Trends"
						>
							{null}
						</UsageState>
					)}
					{previous.error && (
						<UsageState
							result={previous}
							label="Prior Model Period"
						>
							{null}
						</UsageState>
					)}
					{latency.error && (
						<UsageState result={latency} label="P95 Latency">
							{null}
						</UsageState>
					)}
					{feedback.error && (
						<UsageState result={feedback} label="Feedback">
							{null}
						</UsageState>
					)}
					<UsageState result={trend} label="Model Trends">
						<div className="grid gap-3 lg:grid-cols-2">
							<UsageTrend
								title="Model Requests Over Time"
								rows={modelDays}
								comparisonRows={comparisonModelDays}
								series={[
									{
										key: "REQUESTS",
										label: "Requests",
										color: 1,
									},
								]}
								selectedRange={selectedRange}
								onRange={onRange}
								onClearRange={onClearRange}
							/>
							<UsageTrend
								title="Token Consumption Over Time"
								rows={modelDays}
								comparisonRows={comparisonModelDays}
								series={[
									{
										key: "INPUT_TOKENS",
										label: "Input Tokens",
										color: 1,
									},
									{
										key: "OUTPUT_TOKENS",
										label: "Output Tokens",
										color: 2,
									},
								]}
								selectedRange={selectedRange}
								onRange={onRange}
								onClearRange={onClearRange}
							/>
							<UsageTrend
								title="Daily Active Model Users"
								rows={modelDays}
								comparisonRows={comparisonModelDays}
								series={[
									{
										key: "USERS",
										label: "Active Users",
										color: 3,
									},
								]}
								selectedRange={selectedRange}
								onRange={onRange}
								onClearRange={onClearRange}
							/>
							<UsageTrend
								title="Average Response Latency"
								rows={modelDays}
								comparisonRows={comparisonModelDays}
								series={[
									{
										key: "LATENCY_MS",
										label: "Seconds",
										color: 4,
										divisor: 1000,
									},
								]}
								selectedRange={selectedRange}
								onRange={onRange}
								onClearRange={onClearRange}
							/>
						</div>
					</UsageState>
				</>
			)}
			{source === "activity" && (
				<div className="space-y-3">
					<Muted>
						Recorded Events Across Model, App, And Other Engine
						Operations. A Model Call Can Also Create An Activity
						Event; These Counts Must Not Be Combined.
					</Muted>
					<UsageState result={activity} label="Platform Activity">
						<div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
							{activityKpis.map((kpi) => (
								<Card
									key={kpi.label}
									className="gap-0 py-0 shadow-none"
								>
									<CardContent className="space-y-1 p-3">
										<Muted className="text-xs">
											{kpi.label}
										</Muted>
										<P className="font-bold text-xl tabular-nums">
											{kpi.value}
										</P>
										<Muted className="text-xs">
											{kpi.description}
										</Muted>
									</CardContent>
								</Card>
							))}
						</div>
					</UsageState>
					{comparisonActivityTrend.error && (
						<UsageState
							result={comparisonActivityTrend}
							label="Benchmark Activity Trends"
						>
							{null}
						</UsageState>
					)}
					{priorActivity.error && (
						<UsageState
							result={priorActivity}
							label="Prior Activity Period"
						>
							{null}
						</UsageState>
					)}
					<UsageState result={activityTrend} label="Activity Trend">
						<UsageTrend
							title="Platform Activity Over Time"
							rows={activityDays}
							comparisonRows={comparisonActivityDays}
							series={[
								{
									key: "EVENTS",
									label: "Events",
									color: 1,
								},
								{
									key: "FAILED",
									label: "Failed Events",
									color: 5,
								},
							]}
							selectedRange={selectedRange}
							onRange={onRange}
							onClearRange={onClearRange}
						/>
					</UsageState>
				</div>
			)}
		</div>
	);
}
