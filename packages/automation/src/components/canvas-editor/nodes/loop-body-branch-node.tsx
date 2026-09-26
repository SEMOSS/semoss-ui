import { Handle, type NodeProps, Position } from "@xyflow/react";
import { BrainCircuit, GitBranch, Plus } from "lucide-react";
import type { RoutingConfig } from "../../../domain/automation.types";
import type { LoopBodyCanvasNodeData } from "../loop-body-canvas.types";

interface LoopRoute {
	id: string;
	label: string;
	description: string;
}

/** Compact decision card whose route handles remain editable inside a loop. */
export function LoopBodyBranchNode({ data }: NodeProps) {
	const d = data as LoopBodyCanvasNodeData;
	const config = d.node.config as RoutingConfig;
	const isJev = d.node.workflowType === "control.jev";
	const isYesNo =
		isJev && "questionType" in config && config.questionType === "noul";
	const routes: LoopRoute[] = config.clauses.map((clause, index) => {
		const description =
			"description" in clause ? clause.description : clause.condition;
		const answer = "answer" in clause ? clause.answer : undefined;
		return {
			id: `case-${d.node.id}-${clause.id}`,
			label: isYesNo
				? answer === true
					? "Yes"
					: "No"
				: isJev
					? `Route ${index + 1}`
					: `Condition ${index + 1}`,
			description,
		};
	});
	routes.push({
		id: `else-${d.node.id}`,
		label: isJev ? "Fallback" : "Else",
		description: "No other route matched",
	});
	const DecisionIcon = isJev ? BrainCircuit : GitBranch;

	return (
		<div
			className={`relative w-52 rounded-xl border bg-background shadow-sm ${d.selected ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
		>
			<button
				type="button"
				className="nodrag flex min-h-14 w-full items-center gap-2 rounded-t-xl border-b px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				onClick={() => d.onSelect(d.node.id)}
			>
				<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<DecisionIcon className="size-4" aria-hidden />
				</span>
				<span className="min-w-0 flex-1">
					<span className="block truncate font-medium text-xs">
						{d.node.label}
					</span>
					<span className="block text-muted-foreground text-xs">
						{routes.length} routes
					</span>
				</span>
			</button>
			<Handle
				id={`in-${d.node.id}`}
				type="target"
				position={Position.Left}
				isConnectable={false}
				className="size-2! border-2! border-background! bg-muted-foreground/50!"
			/>
			<div className="space-y-1 p-2">
				{routes.map((route) => {
					const isConnected = d.connectedSourceHandles.includes(
						route.id,
					);
					return (
						<div
							key={route.id}
							className="nodrag relative flex min-h-8 items-center gap-2 rounded-md bg-muted/50 px-2 pr-5"
							title={route.description}
						>
							<span className="min-w-0 flex-1 truncate text-xs">
								{route.label}
							</span>
							<Handle
								id={route.id}
								type="source"
								position={Position.Right}
								isConnectable={false}
								aria-label={`${route.label} output`}
								className="pointer-events-none size-2! border-2! border-background! bg-muted-foreground/50!"
							/>
							{!d.readOnly && (
								<button
									type="button"
									aria-label={`${isConnected ? "Insert into" : "Add to"} ${route.label}`}
									className="nodrag nopan -translate-y-1/2 absolute top-1/2 right-0 z-10 flex size-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
									onClick={(event) => {
										event.stopPropagation();
										if (event.detail === 0) {
											d.onAddAfter(d.node.id, route.id);
										}
									}}
									onPointerDown={(event) => {
										event.stopPropagation();
										d.onAddAfter(d.node.id, route.id);
									}}
								>
									<Plus className="size-3.5" aria-hidden />
								</button>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
