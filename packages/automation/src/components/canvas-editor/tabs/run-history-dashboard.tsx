import { formatDurationMs } from "@semoss/utility/date";
import type { AutomationRunSummary } from "../../../domain/automation.types";
import { computeRunDashboardStats } from "./run-dashboard-stats";

interface RunHistoryDashboardProps {
	/** The run page already loaded by the history list — no separate backend fetch. */
	runs: AutomationRunSummary[];
}

const STATUS_LABELS: Record<string, string> = {
	SUCCESS: "Success",
	FAILED: "Failed",
	RUNNING: "Running",
	WAITING_FOR_INPUT: "Needs input",
	INTERRUPTED: "Interrupted",
	CANCELLED: "Cancelled",
};

const TRIGGER_LABELS: Record<string, string> = {
	MANUAL: "Manual",
	PLAYGROUND: "Playground",
	SCHEDULED: "Scheduled",
	UNKNOWN: "Unknown",
};

function StatCard({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border bg-card p-3">
			<p className="text-muted-foreground text-xs">{label}</p>
			<p className="mt-1 font-semibold text-lg">{value}</p>
		</div>
	);
}

function BreakdownList({
	title,
	counts,
	labels,
	total,
}: {
	title: string;
	counts: Record<string, number>;
	labels: Record<string, string>;
	total: number;
}) {
	const entries = Object.entries(counts).filter(([, count]) => count > 0);
	return (
		<div className="rounded-lg border bg-card p-3">
			<p className="font-medium text-xs">{title}</p>
			{entries.length === 0 ? (
				<p className="mt-2 text-muted-foreground text-xs">
					No data yet.
				</p>
			) : (
				<ul className="mt-2 flex flex-col gap-1.5">
					{entries.map(([key, count]) => (
						<li
							key={key}
							className="flex items-center justify-between text-xs"
						>
							<span className="text-muted-foreground">
								{labels[key] ?? key}
							</span>
							<span className="font-medium">
								{count}
								{total > 0 && (
									<span className="ml-1 text-muted-foreground/70">
										({Math.round((count / total) * 100)}%)
									</span>
								)}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

/** Summary stats computed client-side over the run page `RunsTab` already loaded. */
export function RunHistoryDashboard({ runs }: RunHistoryDashboardProps) {
	const stats = computeRunDashboardStats(runs);

	return (
		<div className="flex flex-col gap-3">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				<StatCard label="Total runs" value={String(stats.totalRuns)} />
				<StatCard
					label="Success rate"
					value={
						stats.successRatePct === null
							? "—"
							: `${Math.round(stats.successRatePct)}%`
					}
				/>
				<StatCard
					label="Avg duration"
					value={
						stats.avgDurationMs === null
							? "—"
							: formatDurationMs(stats.avgDurationMs)
					}
				/>
			</div>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<BreakdownList
					title="Runs by status"
					counts={stats.statusCounts}
					labels={STATUS_LABELS}
					total={stats.totalRuns}
				/>
				<BreakdownList
					title="Runs by trigger"
					counts={stats.triggerCounts}
					labels={TRIGGER_LABELS}
					total={stats.totalRuns}
				/>
			</div>
			<p className="text-muted-foreground/70 text-xs">
				Based on the {stats.totalRuns} most recently loaded run
				{stats.totalRuns === 1 ? "" : "s"}.
			</p>
		</div>
	);
}
