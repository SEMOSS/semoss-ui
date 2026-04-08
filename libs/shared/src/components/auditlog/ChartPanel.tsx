/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */

import {
	Activity,
	BarChart3,
	ChevronLeft,
	ChevronRight,
	Loader2,
} from "lucide-react";
import { Button } from "@semoss/ui/next";
import LatencyChart from "./LatencyChart";
import LogDetailPanel from "./LogDetailPanel";
import { type AuditLog, latencyColor, parseArg } from "./types/audit";

const CHART_PAGE_SIZE = 15;

export interface ChartPanelProps {
	logs: AuditLog[];
	loading: boolean;
	dark: boolean;
	selected: AuditLog | null;
	chartTab: "bar" | "timeline";
	chartPage: number;
	onSelectLog: (log: AuditLog) => void;
	onSetChartTab: (tab: "bar" | "timeline") => void;
	onSetChartPage: (updater: number | ((prev: number) => number)) => void;
}

export const ChartPanel = ({
	logs,
	loading,
	dark,
	selected,
	chartTab,
	chartPage,
	onSelectLog,
	onSetChartTab,
	onSetChartPage,
}: ChartPanelProps) => {
	const maxLat = Math.max(...logs.map((l) => l.latency), 1);
	const chartTotalPages = Math.ceil(logs.length / CHART_PAGE_SIZE);
	const chartData = logs.slice(
		chartPage * CHART_PAGE_SIZE,
		(chartPage + 1) * CHART_PAGE_SIZE,
	);

	const tabs = [
		{
			id: "timeline" as const,
			label: "Execution Timeline",
			icon: Activity,
		},
		{
			id: "bar" as const,
			label: "Latency Chart",
			icon: BarChart3,
		},
	];

	return (
		<div className="flex h-[700px] flex-col gap-2">
			{/* ── Chart Panel ── */}
			<div className="flex max-h-[300px] flex-1 flex-col rounded-lg border border-border bg-card">
				{/* Tab bar */}
				<div className="flex flex-shrink-0 items-center gap-0 border-border border-b px-3 pt-1">
					{tabs.map((t) => (
						<Button
							key={t.id}
							onClick={() => onSetChartTab(t.id)}
							variant="ghost"
							className={`flex cursor-pointer items-center gap-1.5 rounded-none border-b-2 bg-transparent px-3 py-2 text-[10px] transition-all ${
								chartTab === t.id
									? "border-primary text-primary"
									: "border-transparent text-muted-foreground hover:text-foreground"
							}`}
						>
							<t.icon size={11} />
							{t.label}
						</Button>
					))}

					{/* Legend */}
					<div className="ml-auto flex items-center gap-3 pr-1 pb-1">
						<span className="flex items-center gap-1 text-[9px] text-muted-foreground">
							<span className="inline-block h-2 w-2 rounded-sm bg-primary" />
							OK
						</span>
						<span className="flex items-center gap-1 text-[9px] text-muted-foreground">
							<span className="inline-block h-2 w-2 rounded-sm bg-destructive" />
							Fail
						</span>
					</div>
				</div>

				{/* Chart body */}
				<div className="flex flex-1 flex-col p-3">
					{loading ? (
						<div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground text-xs">
							<Loader2 size={14} className="animate-spin" />
							Fetching logs…
						</div>
					) : logs.length === 0 ? (
						<div className="flex flex-1 items-center justify-center text-muted-foreground text-xs">
							No data matches filters
						</div>
					) : chartTab === "bar" ? (
						<>
							{/* Latency bar chart */}
							<div className="min-h-0 flex-1 overflow-hidden">
								<LatencyChart data={chartData} dark={dark} />
							</div>

							{/* Chart pagination */}
							{chartTotalPages > 1 && (
								<div className="mt-2 flex flex-shrink-0 items-center justify-center gap-2 border-border border-t pt-2">
									<Button
										disabled={chartPage === 0}
										onClick={() =>
											onSetChartPage((p) => p - 1)
										}
										variant="ghost"
										className="flex cursor-pointer items-center gap-0.5 rounded border border-border bg-transparent px-2 py-0.5 text-[10px] text-muted-foreground transition-all hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
									>
										<ChevronLeft size={10} />
										Prev
									</Button>
									<span className="font-mono text-[10px] text-muted-foreground">
										{chartPage * CHART_PAGE_SIZE + 1}–
										{Math.min(
											(chartPage + 1) * CHART_PAGE_SIZE,
											logs.length,
										)}{" "}
										of {logs.length}
									</span>
									<Button
										disabled={
											chartPage >= chartTotalPages - 1
										}
										onClick={() =>
											onSetChartPage((p) => p + 1)
										}
										variant="ghost"
										className="flex cursor-pointer items-center gap-0.5 rounded border border-border bg-transparent px-2 py-0.5 text-[10px] text-muted-foreground transition-all hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
									>
										Next
										<ChevronRight size={10} />
									</Button>
								</div>
							)}
						</>
					) : (
						/* Timeline view */
						<div className="flex-1 space-y-0.5 overflow-y-auto [scrollbar-width:thin]">
							{logs.map((log) => (
								<div
									key={log.spanId}
									className={`flex h-5 cursor-pointer items-center gap-2 rounded px-1 transition-colors ${
										selected?.spanId === log.spanId
											? "bg-primary/10"
											: "hover:bg-secondary/50"
									}`}
									onClick={() => onSelectLog(log)}
								>
									<span className="w-20 flex-shrink-0 truncate text-right font-mono text-[9px] text-muted-foreground">
										{parseArg(log.request)}
									</span>
									<div className="relative h-2.5 flex-1 overflow-hidden rounded bg-muted/40">
										<div
											className={`absolute top-0 left-0 h-full rounded opacity-80 transition-all ${
												log.status
													? "bg-primary"
													: "bg-destructive"
											}`}
											style={{
												width: `${Math.max(
													3,
													(log.latency / maxLat) *
														100,
												)}%`,
											}}
										/>
									</div>
									{!log.status && (
										<span className="flex-shrink-0 rounded border border-destructive/40 px-0.5 font-semibold text-[7px] text-destructive">
											FAIL
										</span>
									)}
									<span
										className={`w-8 flex-shrink-0 text-right font-medium font-mono text-[9px] ${latencyColor(log.latency)}`}
									>
										{log.latency}ms
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* ── Detail Panel ── */}
			<div className="h-[370px] flex-1 overflow-hidden rounded-lg border border-border bg-card">
				<LogDetailPanel log={logs.length === 0 ? null : selected} />
			</div>
		</div>
	);
};
