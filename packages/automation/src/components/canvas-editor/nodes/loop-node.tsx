import {
	Handle,
	type NodeProps,
	Position,
	useUpdateNodeInternals,
} from "@xyflow/react";
import {
	ChevronDown,
	ChevronUp,
	Layers3,
	Pencil,
	Plus,
	Repeat2,
	Trash2,
} from "lucide-react";
import {
	Button,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@semoss/ui/next";
import type { LoopConfig } from "../../../domain/automation.types";
import { getWorkflowNodeDisplay } from "../../../domain/automation-workflow-display";
import { useAutomationNode } from "../../../hooks/use-automation";
import { StatusIcon } from "../../status-icon";
import { getFlowBorderClass } from "../flow-colors";
import { LoopBodyCanvas } from "../loop-body-canvas";
import type { AutomationNodeData } from "./automation-node";

/** Summarizes the collection a loop will consume without exposing raw JSON on the canvas. */
function getItemsLabel(items: string): string {
	const trimmed = items.trim();
	const reference = /^\$\{([A-Za-z_][A-Za-z0-9_]*)}$/.exec(trimmed);
	if (reference) return reference[1];
	try {
		const parsed: unknown = JSON.parse(trimmed);
		if (Array.isArray(parsed)) {
			return `${parsed.length} item${parsed.length === 1 ? "" : "s"}`;
		}
	} catch {
		// An incomplete value is expected while the user is authoring the form.
	}
	return "Choose a list";
}

/** Canvas card for a loop container and the sequence it repeats. */
export function LoopNode({ data }: NodeProps) {
	const d = data as AutomationNodeData;
	const automationNode = useAutomationNode(d.step.id);
	const updateNodeInternals = useUpdateNodeInternals();
	const isExpanded = Boolean(d.expanded);
	const config = d.step.config as LoopConfig;
	const bodyNodes = d.step.body?.nodes ?? [];
	const borderClass = getFlowBorderClass(
		d.runStatus,
		Boolean(d.pathHighlighted),
		d.isIncomplete ? "border-warning" : "border-primary/40",
	);
	const batchLabel =
		config.batchSize > 1
			? `Batches of ${config.batchSize}`
			: "One item at a time";

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<section
					aria-label={`${d.step.label} loop`}
					className={`group relative ${isExpanded ? "w-160" : "w-70"} rounded-2xl border-2 bg-card shadow-sm transition-[width] ${borderClass} ${d.highlighted ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""} ${d.locked ? "opacity-75" : ""}`}
				>
					<header className="flex items-start gap-3 border-b bg-primary/5 px-4 py-3">
						<span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<Repeat2 className="size-4" aria-hidden />
							<span className="-top-1.5 -left-1.5 absolute flex size-4 items-center justify-center rounded-full border bg-background font-medium text-muted-foreground text-xs">
								{d.index + 1}
							</span>
						</span>
						<div className="min-w-0 flex-1">
							<p className="truncate font-semibold text-sm">
								{d.step.label || "Loop over items"}
							</p>
							<p className="truncate text-muted-foreground text-xs">
								{getItemsLabel(config.items)} · {batchLabel}
							</p>
						</div>
						{d.runStatus && d.runStatus !== "idle" && (
							<StatusIcon
								status={d.runStatus}
								className="mt-1 size-4 shrink-0"
							/>
						)}
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="nodrag shrink-0"
							onClick={(event) => {
								event.stopPropagation();
								d.onExpandedChange?.(!isExpanded);
								window.requestAnimationFrame(() => {
									window.requestAnimationFrame(() =>
										updateNodeInternals(d.step.id),
									);
								});
							}}
							aria-expanded={isExpanded}
						>
							{isExpanded ? (
								<ChevronUp className="size-4" aria-hidden />
							) : (
								<ChevronDown className="size-4" aria-hidden />
							)}
							{isExpanded ? "Collapse" : "Expand"}
						</Button>
					</header>

					<div className="space-y-2 px-3 py-3">
						<div className="flex items-center justify-between gap-2 px-1">
							<span className="flex items-center gap-1.5 font-medium text-xs">
								<Layers3
									className="size-3.5 text-primary"
									aria-hidden
								/>
								Repeat for every batch
							</span>
							<span className="text-muted-foreground text-xs">
								{bodyNodes.length} step
								{bodyNodes.length === 1 ? "" : "s"}
							</span>
						</div>

						{isExpanded ? (
							<LoopBodyCanvas
								body={d.step.body ?? { nodes: [], edges: [] }}
								loopOutputVar={d.step.outputVar}
								readOnly={Boolean(d.locked)}
								onBodyChange={(body) =>
									automationNode.update({ ...d.step, body })
								}
								onNodeSelect={() => automationNode.open()}
							/>
						) : (
							<div className="rounded-xl border border-primary/30 border-dashed bg-muted/30 p-2">
								{bodyNodes.length === 0 ? (
									<p className="px-2 py-3 text-center text-muted-foreground text-xs">
										Add the steps this loop should repeat.
									</p>
								) : (
									<ol className="space-y-1.5">
										{bodyNodes
											.slice(0, 3)
											.map((bodyNode, index) => {
												const display =
													bodyNode.workflowType
														? getWorkflowNodeDisplay(
																bodyNode.workflowType,
															)
														: null;
												const Icon =
													display?.icon ?? Layers3;
												return (
													<li
														key={bodyNode.id}
														className="flex items-center gap-2 rounded-lg border bg-background px-2.5 py-2"
													>
														<span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
															<Icon
																className="size-3.5"
																aria-hidden
															/>
														</span>
														<span className="min-w-0 flex-1 truncate text-xs">
															{bodyNode.label}
														</span>
														<span className="text-muted-foreground text-xs">
															{index + 1}
														</span>
													</li>
												);
											})}
										{bodyNodes.length > 3 && (
											<li className="px-2 py-1 text-center text-muted-foreground text-xs">
												+{bodyNodes.length - 3} more
											</li>
										)}
									</ol>
								)}
							</div>
						)}

						{!d.locked && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="w-full"
								onClick={(event) => {
									event.stopPropagation();
									automationNode.open();
								}}
							>
								<Pencil className="size-3.5" aria-hidden />
								Configure loop
							</Button>
						)}
					</div>

					<Handle
						id={`in-${d.step.id}`}
						type="target"
						position={Position.Left}
						isConnectable={!d.locked}
						className="size-2! border-2! border-background! bg-muted-foreground/50!"
					/>
					<Handle
						id={`out-${d.step.id}`}
						type="source"
						position={Position.Right}
						isConnectable={!d.locked}
						onClick={(event) => {
							if (d.locked) return;
							event.stopPropagation();
							automationNode.addAfter();
						}}
						aria-label="Add a step after the loop or drag to connect"
						className="border! size-7! border-border! bg-background! shadow-sm transition-colors hover:border-primary!"
					/>
					{!d.locked && (
						<span className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-0 flex size-7 translate-x-1/2 items-center justify-center text-muted-foreground">
							<Plus className="size-4" aria-hidden />
						</span>
					)}
				</section>
			</ContextMenuTrigger>
			{!d.locked && (
				<ContextMenuContent>
					<ContextMenuItem onSelect={() => automationNode.open()}>
						Edit loop
					</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuItem
						className="text-destructive focus:text-destructive"
						onSelect={() => automationNode.delete()}
					>
						<Trash2 className="size-4" aria-hidden />
						Delete and detach
					</ContextMenuItem>
					<ContextMenuItem
						className="text-destructive focus:text-destructive"
						onSelect={() => automationNode.deleteDownstream()}
					>
						Delete and remove all after
					</ContextMenuItem>
				</ContextMenuContent>
			)}
		</ContextMenu>
	);
}
