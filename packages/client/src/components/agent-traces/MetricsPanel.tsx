import type { TraceRow } from "./types";

interface MetricsPanelProps {
	trace: TraceRow;
}

function formatDuration(ms: number): string {
	if (!ms || ms <= 0) return "—";
	if (ms < 1000) return `${ms}ms`;
	const s = Math.floor(ms / 1000);
	if (s < 60) return `${s}s`;
	const m = Math.floor(s / 60);
	const rem = s % 60;
	return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

interface StatChipProps {
	label: string;
	value: string;
	color?: string;
}

const StatChip = ({ label, value, color }: StatChipProps) => (
	<div className="flex min-w-[90px] flex-col items-center rounded-lg border border-border bg-card px-4 py-2">
		<span className="text-muted-foreground text-xs">{label}</span>
		<span className={`font-semibold text-sm ${color ?? ""}`}>{value}</span>
	</div>
);

export const MetricsPanel = ({ trace }: MetricsPanelProps) => {
	const isSuccess = trace.STATUS === "OK";
	const inputTok = trace.TOTAL_INPUT_TOKENS ?? 0;
	const outputTok = trace.TOTAL_OUTPUT_TOKENS ?? 0;

	return (
		<div className="flex flex-wrap gap-2 rounded-lg border border-border bg-muted/30 p-3">
			<StatChip
				label="Duration"
				value={formatDuration(trace.DURATION_MS)}
			/>
			<StatChip
				label="Input Tokens"
				value={inputTok > 0 ? inputTok.toLocaleString() : "—"}
			/>
			<StatChip
				label="Output Tokens"
				value={outputTok > 0 ? outputTok.toLocaleString() : "—"}
			/>
			<StatChip
				label="Iterations"
				value={String(trace.ITERATIONS ?? 0)}
			/>
			<StatChip
				label="Tool Calls"
				value={String(trace.TOOL_CALL_COUNT ?? 0)}
			/>
			<StatChip
				label="Status"
				value={trace.STATUS ?? "—"}
				color={
					isSuccess
						? "text-emerald-600"
						: trace.STATUS === "RUNNING"
							? "text-blue-600"
							: "text-red-600"
				}
			/>
		</div>
	);
};
