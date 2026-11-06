import { formatDurationMs } from "@semoss/utility/date";
import type { AutomationRunSummary } from "../../../domain/automation.types";
import {
	computeRunDashboardStats,
	toMirthStyleCounts,
} from "./run-dashboard-stats";

interface RunHistoryDashboardProps {
	/** The run page already loaded by the history list — no separate backend fetch. */
	runs: AutomationRunSummary[];
}

const TRIGGER_LABELS: Record<string, string> = {
	MANUAL: "Manual",
	PLAYGROUND: "Playground",
	SCHEDULED: "Scheduled",
	UNKNOWN: "Unknown",
};

/** Mirth's channel-state dot: green running cleanly, red latest run errored, gray never run, blue in flight. */
function StatusDot({ status }: { status: string | null }) {
	const { color, label } =
		status === null
			? { color: "bg-muted-foreground/40", label: "No runs yet" }
			: status === "RUNNING" || status === "WAITING_FOR_INPUT"
				? { color: "bg-sky-500", label: "In progress" }
				: status === "SUCCESS"
					? { color: "bg-emerald-500", label: "Last run succeeded" }
					: {
							color: "bg-red-500",
							label: "Last run did not complete",
						};
	return (
		<span
			className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${color}`}
			role="img"
			aria-label={label}
			title={label}
		/>
	);
}

function MirthStatCell({
	value,
	tone,
}: {
	value: number;
	tone?: "success" | "error";
}) {
	const toneClasses =
		tone === "success"
			? "text-emerald-600"
			: tone === "error" && value > 0
				? "text-red-600"
				: "text-foreground";
	return (
		<td
			className={`border-border border-l px-3 py-2 text-right font-medium tabular-nums ${toneClasses}`}
		>
			{value}
		</td>
	);
}

/** Mirth Connect-style dashboard: a dense channel-statistics table, remapped onto automation run outcomes. */
export function RunHistoryDashboard({ runs }: RunHistoryDashboardProps) {
	const stats = computeRunDashboardStats(runs);
	const counts = toMirthStyleCounts(stats);
	const triggerEntries = Object.entries(stats.triggerCounts).filter(
		([, count]) => count > 0,
	);

	return (
		<div className="flex flex-col gap-3">
			<div className="overflow-hidden rounded-lg border">
				<table className="w-full border-collapse text-xs">
					<thead>
						<tr className="bg-muted/50 text-muted-foreground uppercase tracking-wide">
							<th className="w-8 px-3 py-2 text-left font-medium" />
							<th className="px-3 py-2 text-left font-medium">
								Automation
							</th>
							<th className="border-border border-l px-3 py-2 text-right font-medium">
								Received
							</th>
							<th className="border-border border-l px-3 py-2 text-right font-medium">
								Filtered
							</th>
							<th className="border-border border-l px-3 py-2 text-right font-medium">
								Queued
							</th>
							<th className="border-border border-l px-3 py-2 text-right font-medium">
								Sent
							</th>
							<th className="border-border border-l px-3 py-2 text-right font-medium">
								Errored
							</th>
							<th className="border-border border-l px-3 py-2 text-right font-medium">
								Avg Time
							</th>
						</tr>
					</thead>
					<tbody>
						<tr className="bg-card">
							<td className="px-3 py-2">
								<StatusDot status={stats.latestStatus} />
							</td>
							<td className="px-3 py-2 font-medium">
								This automation
							</td>
							<MirthStatCell value={counts.received} />
							<MirthStatCell value={counts.filtered} />
							<MirthStatCell value={counts.queued} />
							<MirthStatCell value={counts.sent} tone="success" />
							<MirthStatCell
								value={counts.errored}
								tone="error"
							/>
							<td className="border-border border-l px-3 py-2 text-right tabular-nums">
								{stats.avgDurationMs === null
									? "—"
									: formatDurationMs(stats.avgDurationMs)}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border bg-card px-3 py-2 text-muted-foreground text-xs">
				<span className="font-medium text-foreground">
					Triggered by:
				</span>
				{triggerEntries.length === 0 ? (
					<span>No data yet.</span>
				) : (
					triggerEntries.map(([key, count]) => (
						<span key={key}>
							{TRIGGER_LABELS[key] ?? key}: {count}
						</span>
					))
				)}
				<span className="ml-auto text-muted-foreground/70">
					Based on the {stats.totalRuns} most recently loaded run
					{stats.totalRuns === 1 ? "" : "s"}.
				</span>
			</div>
		</div>
	);
}
