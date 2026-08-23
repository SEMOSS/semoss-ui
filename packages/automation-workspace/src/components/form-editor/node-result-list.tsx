import {
	ChevronDown,
	ChevronRight,
	Clock3,
	ExternalLink,
	Waypoints,
} from "lucide-react";
import { useMemo, useState } from "react";
import type {
	AutomationNode,
	AutomationNodeResult,
	AutomationNodeTrace,
} from "../../domain/automation.types";
import { getDisplayMeta } from "../../domain/automation-display";
import { formatDurationMs } from "../../domain/automation-utils";
import { StatusBadge } from "../status-badge";
import { OutputPreview } from "./output-preview";

export interface NodeResultListProps {
	/** Automation node definitions, used to look up label/type per result */
	steps: AutomationNode[];
	/** Per-node execution results to render */
	results: AutomationNodeResult[];
	/** Node ids whose output preview is currently expanded */
	expandedNodes: Set<string>;
	/** Called with a node id when its output preview is expanded/collapsed */
	onToggleNode: (nodeId: string) => void;
}

function ErrorDetail({ message }: { message: string }) {
	const [expanded, setExpanded] = useState(false);
	return (
		<div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">
			<div className="flex items-center justify-between gap-2">
				<span className="font-medium">Step failed</span>
				<button
					type="button"
					onClick={() => setExpanded((p) => !p)}
					className="flex items-center gap-0.5 text-destructive/70 hover:text-destructive"
				>
					{expanded ? (
						<ChevronDown className="h-3 w-3" />
					) : (
						<ChevronRight className="h-3 w-3" />
					)}
					{expanded ? "Hide details" : "Show details"}
				</button>
			</div>
			{expanded && (
				<pre className="mt-2 whitespace-pre-wrap break-all font-mono text-[10px] opacity-80">
					{message}
				</pre>
			)}
		</div>
	);
}

function configString(
	step: AutomationNode | undefined,
	key: string,
): string | null {
	const value = step?.workflowConfig?.[key];
	return typeof value === "string" && value.trim() ? value : null;
}

function systemAppUrl(app: "client" | "playground", route: string): string {
	const url = new URL(`../../${app}/dist/`, window.location.href);
	url.hash = route;
	return url.toString();
}

function TraceDetail({
	trace,
	step,
}: {
	trace: AutomationNodeTrace;
	step: AutomationNode | undefined;
}) {
	const roomId = trace.roomId?.trim();
	const modelMessageId = trace.modelMessageId?.trim();
	const agentRunId = trace.agentRunId?.trim();
	const workspaceId =
		configString(step, "workspaceId") ?? configString(step, "agentId");
	const modelRoomUrl =
		roomId && modelMessageId
			? systemAppUrl("playground", `/room/${encodeURIComponent(roomId)}`)
			: null;
	const agentActivityUrl =
		agentRunId && workspaceId
			? systemAppUrl(
					"client",
					`/agent/${encodeURIComponent(workspaceId)}/agent-activity`,
				)
			: null;

	if (!roomId && !modelMessageId && !agentRunId) return null;

	return (
		<div className="rounded-md border bg-muted/30 px-3 py-2 text-[11px]">
			<div className="flex items-center gap-1.5 font-medium text-foreground">
				<Waypoints className="h-3.5 w-3.5" aria-hidden />
				Activity trace
			</div>
			<dl className="mt-2 space-y-1 text-muted-foreground">
				{roomId && (
					<div>
						<dt className="inline font-medium">Room ID: </dt>
						<dd className="inline break-all font-mono">{roomId}</dd>
					</div>
				)}
				{modelMessageId && (
					<div>
						<dt className="inline font-medium">Message ID: </dt>
						<dd className="inline break-all font-mono">
							{modelMessageId}
						</dd>
					</div>
				)}
				{agentRunId && (
					<div>
						<dt className="inline font-medium">Agent run ID: </dt>
						<dd className="inline break-all font-mono">
							{agentRunId}
						</dd>
					</div>
				)}
			</dl>
			{(modelRoomUrl || agentActivityUrl) && (
				<div className="mt-2 flex flex-wrap gap-3">
					{modelRoomUrl && (
						<a
							href={modelRoomUrl}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
						>
							Open model room
							<ExternalLink className="h-3 w-3" aria-hidden />
						</a>
					)}
					{agentActivityUrl && (
						<a
							href={agentActivityUrl}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
						>
							Open Agent Activity
							<ExternalLink className="h-3 w-3" aria-hidden />
						</a>
					)}
				</div>
			)}
		</div>
	);
}

export function NodeResultList({
	steps,
	results,
	expandedNodes,
	onToggleNode,
}: NodeResultListProps) {
	const stepMap = useMemo(
		() => new Map(steps.map((step) => [step.id, step])),
		[steps],
	);

	if (results.length === 0) {
		return (
			<div className="rounded-xl border border-dashed bg-card/60 px-6 py-12 text-center text-muted-foreground text-sm">
				No results yet. Run the automation to see what each step
				produces.
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{results.map((result) => {
				const step = stepMap.get(result.NODE_ID);
				const meta = getDisplayMeta(step?.type ?? "app");
				const Icon = meta.icon;
				const isExpanded = expandedNodes.has(result.NODE_ID);

				const displayStatus =
					step?.type === "trigger" && result.STATUS === "PENDING"
						? "SUCCESS"
						: result.STATUS;

				return (
					<div
						key={result.NODE_ID}
						className="rounded-xl border bg-card shadow-sm"
					>
						<div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
							<div className="flex min-w-0 flex-1 items-start gap-3">
								<span
									className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted ${meta.color}`}
								>
									<Icon className="h-5 w-5" />
								</span>
								<div className="min-w-0 flex-1 space-y-2">
									<div className="flex flex-wrap items-center gap-2">
										<span className="font-medium text-sm">
											{result.NODE_LABEL ||
												step?.label ||
												meta.label}
										</span>
										<StatusBadge status={displayStatus} />
									</div>
									{result.ERROR_MESSAGE && (
										<ErrorDetail
											message={result.ERROR_MESSAGE}
										/>
									)}
									{result.OUTPUT_PREVIEW && (
										<OutputPreview
											value={result.OUTPUT_PREVIEW}
											expanded={isExpanded}
											onToggle={() =>
												onToggleNode(result.NODE_ID)
											}
											nodeType={step?.type}
										/>
									)}
									{result.trace && (
										<TraceDetail
											trace={result.trace}
											step={step}
										/>
									)}
								</div>
							</div>
							<div className="flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground lg:pl-4">
								<Clock3 className="h-3.5 w-3.5" />
								{formatDurationMs(result.DURATION_MS)}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
