import { Handle, type NodeProps, Position, useEdges } from "@xyflow/react";
import { GitFork, GitMerge, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Fragment } from "react";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@semoss/ui/next";
import type {
	AutomationNode as AutomationGraphNode,
	AutomationPort,
	StepRunStatus,
} from "../../../domain/automation.types";
import { formatDurationMs } from "../../../domain/automation-utils";
import { getWorkflowNodeDefinition } from "../../../domain/automation-workflow-adapter";
import { useAutomationNode } from "../../../hooks/use-automation";
import { StatusIcon } from "../../status-icon";
import { getFlowBorderClass } from "../flow-colors";

interface ControlFlowNodeData {
	step: AutomationGraphNode;
	index: number;
	runStatus?: StepRunStatus;
	runDuration?: number;
	isIncomplete?: boolean;
	locked?: boolean;
	highlighted?: boolean;
	pathHighlighted?: boolean;
}

interface ControlOutputHandle {
	id: string;
	label: string;
	connected: boolean;
}

const DEFAULT_HANDLE_COLOR = "var(--muted-foreground)";

function controlHandleId(
	direction: AutomationPort["direction"],
	stepId: string,
	portId: string,
): string {
	if (direction === "output" && portId === "out") return `out-${stepId}`;
	if (direction === "input" && portId === "in") return `in-${stepId}`;
	return portId;
}

function handlePosition(index: number, count: number): string {
	return `${((index + 1) / (count + 1)) * 100}%`;
}

export function ControlFlowNode({ data }: NodeProps) {
	const nodeData = data as ControlFlowNodeData;
	const { step, index, runStatus, runDuration, isIncomplete, locked } =
		nodeData;
	const automationNode = useAutomationNode(step.id);
	const edges = useEdges();
	const isSplit = step.workflowType === "control.parallel";
	const definition = step.workflowType
		? getWorkflowNodeDefinition(step.workflowType)
		: undefined;
	const inputs =
		definition?.inputs.filter((port) => port.kind === "control") ?? [];
	const outputs =
		definition?.outputs.filter((port) => port.kind === "control") ?? [];
	const parallelEdges = edges.filter(
		(edge) => edge.kind === "control" && edge.source === step.id,
	);
	const parallelBranchCount = parallelEdges.length;
	const outputHandles: ControlOutputHandle[] = isSplit
		? [
				...parallelEdges.map((edge, branchIndex) => ({
					id:
						edge.sourceHandle ??
						`parallel-out-${step.id}-${edge.id}`,
					label: String(branchIndex + 1),
					connected: true,
				})),
				{
					id: `parallel-add-${step.id}-${parallelBranchCount}`,
					label: String(parallelBranchCount + 1),
					connected: false,
				},
			]
		: outputs.map((port) => {
				const id = controlHandleId("output", step.id, port.id);
				return {
					id,
					label: port.label,
					connected: edges.some(
						(edge) =>
							edge.source === step.id && edge.sourceHandle === id,
					),
				};
			});
	const minHeight = `${88 + Math.max(0, outputHandles.length - 2) * 48}px`;
	const Icon = isSplit ? GitFork : GitMerge;
	const borderClass = getFlowBorderClass(
		runStatus,
		Boolean(nodeData.pathHighlighted),
		isIncomplete ? "border-warning/60" : "border-border",
	);
	const highlightClass = nodeData.highlighted
		? "animate-pulse ring-2 ring-primary ring-offset-2 ring-offset-background"
		: "";
	const runningClass =
		runStatus === "running" ? "automation-node-running" : "";

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<div
					className={`group relative w-70 rounded-2xl border-2 shadow-sm ${borderClass} ${runningClass} ${highlightClass} ${locked ? "opacity-75" : ""}`}
					style={isSplit ? { minHeight } : undefined}
				>
					<div className="relative z-1 m-0.5 rounded-[14px] bg-card px-4 py-3">
						{!locked && (
							<div className="-top-2 absolute right-2 z-10 hidden items-center gap-0.5 rounded-full border bg-background px-1 py-0.5 shadow-sm group-hover:flex">
								<button
									type="button"
									onClick={(event) => {
										event.stopPropagation();
										automationNode.open();
									}}
									className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									aria-label={`Edit ${isSplit ? "split" : "join"}`}
								>
									<Pencil
										className="size-3"
										aria-hidden="true"
									/>
								</button>
								<button
									type="button"
									onClick={(event) => {
										event.stopPropagation();
										automationNode.delete();
									}}
									className="rounded p-0.5 text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
									aria-label={`Delete ${isSplit ? "split" : "join"}`}
								>
									<Trash2
										className="size-3"
										aria-hidden="true"
									/>
								</button>
							</div>
						)}

						<div className="flex items-center gap-3">
							<span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<Icon className="size-4" aria-hidden="true" />
								<span className="-top-1.5 -left-1.5 absolute flex size-4 items-center justify-center rounded-full border border-border bg-muted font-medium text-muted-foreground text-xs">
									{index + 1}
								</span>
							</span>
							<div className="min-w-0 flex-1">
								<p className="truncate font-semibold text-sm leading-snug">
									{step.label || (isSplit ? "Split" : "Join")}
								</p>
								<p className="mt-0.5 text-muted-foreground text-xs">
									{isSplit
										? "Parallel branches"
										: "Join branches"}
								</p>
							</div>
							{runStatus && runStatus !== "idle" && (
								<div className="ml-auto shrink-0">
									{runStatus === "running" ? (
										<Loader2 className="size-3.5 animate-spin text-primary" />
									) : (
										<StatusIcon
											status={runStatus}
											className={`size-3.5 ${runStatus === "success" ? "text-success" : runStatus === "error" ? "text-destructive" : ""}`}
										/>
									)}
								</div>
							)}
						</div>

						{runDuration != null && runStatus !== "running" && (
							<div className="mt-1.5 pl-12">
								<span className="text-muted-foreground text-xs">
									{formatDurationMs(runDuration)}
								</span>
							</div>
						)}
					</div>

					{inputs.map((port, portIndex) => {
						const id = controlHandleId("input", step.id, port.id);
						return (
							<Handle
								key={port.id}
								id={id}
								type="target"
								position={Position.Left}
								isConnectable={!locked}
								style={{
									top: handlePosition(
										portIndex,
										inputs.length,
									),
								}}
								aria-label="Connect workflow input"
								className="h-2! w-2! border-2! border-background! bg-muted-foreground/50!"
							/>
						);
					})}

					{outputHandles.map((output, outputIndex) => {
						const canAddAfter = !output.connected;
						const top = handlePosition(
							outputIndex,
							outputHandles.length,
						);
						return (
							<Fragment key={output.id}>
								<Handle
									id={output.id}
									type="source"
									position={Position.Right}
									isConnectable={!locked && canAddAfter}
									onClick={(event) => {
										event.stopPropagation();
										if (!locked && canAddAfter) {
											automationNode.addAfter(output.id);
										}
									}}
									style={{
										top,
										...(output.connected
											? {
													backgroundColor:
														DEFAULT_HANDLE_COLOR,
												}
											: {
													borderColor:
														DEFAULT_HANDLE_COLOR,
												}),
									}}
									aria-label={
										canAddAfter
											? `Add node after ${output.label}`
											: `${output.label} output`
									}
									className={
										output.connected || locked
											? "h-2! w-2! border-2! border-background!"
											: "border! h-7! w-7! bg-background! shadow-sm transition-colors hover:opacity-70"
									}
								/>
								{canAddAfter && !locked && (
									<span
										className="pointer-events-none absolute z-10 flex h-7 w-7 items-center justify-center text-muted-foreground"
										style={{
											top,
											right: 0,
											transform:
												"translateX(50%) translateY(-50%)",
										}}
									>
										<Plus
											className="size-4"
											aria-hidden="true"
										/>
									</span>
								)}
								{isSplit && (
									<span
										className="pointer-events-none absolute right-0 font-medium text-muted-foreground text-xs"
										style={{
											top: `calc(${top} - 10px)`,
											transform: `translateX(calc(100% + ${output.connected || locked ? 6 : 20}px)) translateY(-50%)`,
										}}
									>
										{output.label}
									</span>
								)}
							</Fragment>
						);
					})}
				</div>
			</ContextMenuTrigger>
			{!locked && (
				<ContextMenuContent>
					<ContextMenuItem onSelect={() => automationNode.open()}>
						Edit
					</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuItem
						className="text-destructive focus:text-destructive"
						onSelect={() => automationNode.delete()}
					>
						Delete and Detach
					</ContextMenuItem>
					<ContextMenuItem
						className="text-destructive focus:text-destructive"
						onSelect={() => automationNode.deleteDownstream()}
					>
						Delete and Remove All After
					</ContextMenuItem>
				</ContextMenuContent>
			)}
		</ContextMenu>
	);
}
