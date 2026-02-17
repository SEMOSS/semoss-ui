import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@semoss/ui/next";
import { useWorkflowEditor } from "@/stores/workflow";
import type { WorkflowExecution } from "@/types/workflow";

function StatusBadge({ status }: { status: WorkflowExecution["status"] }) {
	const colors: Record<string, string> = {
		SUCCESS: "bg-green-100 text-green-800",
		ERROR: "bg-red-100 text-red-800",
		TIMEOUT: "bg-yellow-100 text-yellow-800",
	};

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2 py-0.5 font-medium text-[10px]",
				colors[status] ?? "bg-gray-100 text-gray-600",
			)}
		>
			{status}
		</span>
	);
}

function formatDuration(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	const secs = Math.round(ms / 1000);
	if (secs < 60) return `${secs}s`;
	const mins = Math.floor(secs / 60);
	const remSecs = secs % 60;
	return `${mins}m ${remSecs}s`;
}

function formatTime(ts: string | number): string {
	return new Date(ts).toLocaleString();
}

export function ExecutionHistory() {
	const { state } = useWorkflowEditor();
	const [open, setOpen] = useState(false);
	const [expandedId, setExpandedId] = useState<string | null>(null);

	const executions = state.executions;

	return (
		<div className="border-gray-200 border-t bg-white">
			{/* Toggle bar */}
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex w-full items-center justify-between px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50"
			>
				<span>Execution History ({executions.length})</span>
				{open ? (
					<ChevronDown className="h-4 w-4" />
				) : (
					<ChevronUp className="h-4 w-4" />
				)}
			</button>

			{open && (
				<div className="max-h-64 overflow-y-auto">
					{executions.length === 0 ? (
						<div className="px-4 py-6 text-center text-gray-400 text-xs">
							No executions yet. Run the workflow to see results
							here.
						</div>
					) : (
						<table className="w-full text-left text-xs">
							<thead className="border-gray-100 border-b bg-gray-50 text-[10px] text-gray-500 uppercase">
								<tr>
									<th className="px-4 py-1.5">Status</th>
									<th className="px-4 py-1.5">Started</th>
									<th className="px-4 py-1.5">Duration</th>
									<th className="px-4 py-1.5">Trigger</th>
									<th className="px-4 py-1.5" />
								</tr>
							</thead>
							<tbody>
								{executions.map((exec) => (
									<tr
										key={exec.executionId}
										className="border-gray-50 border-b hover:bg-gray-50"
									>
										<td className="px-4 py-1.5">
											<StatusBadge status={exec.status} />
										</td>
										<td className="px-4 py-1.5 text-gray-600">
											{formatTime(exec.startTimeMs)}
										</td>
										<td className="px-4 py-1.5 text-gray-600">
											{exec.durationMs
												? formatDuration(
														exec.durationMs,
													)
												: "—"}
										</td>
										<td className="px-4 py-1.5 text-gray-600">
											{exec.triggeredBy ?? "manual"}
										</td>
										<td className="px-4 py-1.5">
											{exec.error && (
												<button
													type="button"
													onClick={() =>
														setExpandedId(
															expandedId ===
																exec.executionId
																? null
																: exec.executionId,
														)
													}
													className="text-red-500 hover:text-red-700"
													title="Show error details"
												>
													<AlertCircle className="h-3.5 w-3.5" />
												</button>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}

					{/* Error detail panel */}
					{expandedId && (
						<div className="border-red-100 border-t bg-red-50 p-3">
							<pre className="whitespace-pre-wrap text-[11px] text-red-800">
								{
									executions.find(
										(e) => e.executionId === expandedId,
									)?.error
								}
							</pre>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
