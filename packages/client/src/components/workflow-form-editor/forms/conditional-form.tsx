import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
	Button,
	Field,
	FieldLabel,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import type {
	ConditionalConfig,
	EngineOption,
	NodeConfig,
	ProjectOption,
	WorkflowEdge,
	WorkflowGraph,
	WorkflowNode,
	WorkflowNodeType,
} from "@/pages/workflow/workflow.types";
import { NODE_TYPE_META } from "@/pages/workflow/workflow.types";
import { StepForm } from "../step-form";

// Node types that can appear inside a branch (exclude trigger and conditional itself)
const BRANCH_NODE_TYPES = NODE_TYPE_META.filter(
	(m) => m.category !== "trigger" && m.type !== "conditional",
);

function newBranchNode(type: WorkflowNodeType): WorkflowNode {
	const meta = NODE_TYPE_META.find((m) => m.type === type);
	if (!meta) throw new Error(`Unknown branch node type: ${type}`);
	return {
		id: `${type}-${crypto.randomUUID()}`,
		type,
		label: meta.label,
		outputVar: meta.defaultOutputVar,
		config: meta.defaultConfig as NodeConfig,
		position: { x: 0, y: 0 },
	};
}

function emptyGraph(): WorkflowGraph {
	return { nodes: [], edges: [] };
}

interface BranchEditorProps {
	label: string;
	graph: WorkflowGraph;
	enginesByType: Record<string, EngineOption[]>;
	projects: ProjectOption[];
	upstreamVars: string[];
	onChange: (graph: WorkflowGraph) => void;
}

function BranchEditor({
	label,
	graph,
	enginesByType,
	projects,
	upstreamVars,
	onChange,
}: BranchEditorProps) {
	const [expanded, setExpanded] = useState(true);
	const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
	const [addType, setAddType] = useState<WorkflowNodeType>(
		BRANCH_NODE_TYPES[0].type,
	);

	const nodes = graph.nodes ?? [];

	function updateNode(updated: WorkflowNode) {
		onChange({
			...graph,
			nodes: nodes.map((n) => (n.id === updated.id ? updated : n)),
		});
	}

	function removeNode(id: string) {
		const edges = (graph.edges ?? []).filter(
			(e) => e.source !== id && e.target !== id,
		);
		onChange({ ...graph, nodes: nodes.filter((n) => n.id !== id), edges });
	}

	function moveNode(index: number, dir: -1 | 1) {
		const next = [...nodes];
		const swap = index + dir;
		if (swap < 0 || swap >= next.length) return;
		[next[index], next[swap]] = [next[swap], next[index]];
		// Rebuild linear edges to match new order
		const edges: WorkflowEdge[] = next.slice(0, -1).map((n, i) => ({
			id: `e-${n.id}-${next[i + 1].id}`,
			source: n.id,
			target: next[i + 1].id,
		}));
		onChange({ nodes: next, edges });
	}

	function addNode() {
		const node = newBranchNode(addType);
		const next = [...nodes, node];
		const edges: WorkflowEdge[] = next.slice(0, -1).map((n, i) => ({
			id: `e-${n.id}-${next[i + 1].id}`,
			source: n.id,
			target: next[i + 1].id,
		}));
		onChange({ nodes: next, edges });
		setExpandedNodes((s) => new Set(s).add(node.id));
	}

	function toggleNode(id: string) {
		setExpandedNodes((s) => {
			const next = new Set(s);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	}

	const branchUpstreamVars = [...upstreamVars];

	return (
		<div className="rounded-md border">
			<button
				type="button"
				onClick={() => setExpanded((v) => !v)}
				className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted/40"
			>
				<span className="font-medium text-xs">{label}</span>
				<span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
					{nodes.length} {nodes.length === 1 ? "step" : "steps"}
					{expanded ? (
						<ChevronUp className="h-3.5 w-3.5" />
					) : (
						<ChevronDown className="h-3.5 w-3.5" />
					)}
				</span>
			</button>

			{expanded && (
				<div className="border-t px-3 pt-2 pb-3">
					{nodes.length === 0 && (
						<p className="mb-2 text-[11px] text-muted-foreground italic">
							No steps — this branch will complete immediately.
						</p>
					)}

					<div className="flex flex-col gap-1.5">
						{nodes.map((node, i) => (
							<div
								key={node.id}
								className="rounded border bg-card"
							>
								<button
									type="button"
									onClick={() => toggleNode(node.id)}
									className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/40"
								>
									<span className="flex-1 font-medium text-xs">
										{node.label || node.type}
									</span>
									{/* biome-ignore lint/a11y/noStaticElementInteractions: stop-propagation wrapper for button group */}
									<div
										className="flex items-center gap-1"
										onClick={(e) => e.stopPropagation()}
										onKeyDown={(e) => e.stopPropagation()}
									>
										<Button
											size="sm"
											variant="ghost"
											className="h-5 w-5 p-0"
											onClick={() => moveNode(i, -1)}
											disabled={i === 0}
										>
											<ChevronUp className="h-3 w-3" />
										</Button>
										<Button
											size="sm"
											variant="ghost"
											className="h-5 w-5 p-0"
											onClick={() => moveNode(i, 1)}
											disabled={i === nodes.length - 1}
										>
											<ChevronDown className="h-3 w-3" />
										</Button>
										<Button
											size="sm"
											variant="ghost"
											className="h-5 w-5 p-0 text-destructive hover:text-destructive"
											onClick={() => removeNode(node.id)}
										>
											<Trash2 className="h-3 w-3" />
										</Button>
									</div>
								</button>
								{expandedNodes.has(node.id) && (
									<div className="border-t px-3 pt-2 pb-3">
										<StepForm
											step={node}
											enginesByType={enginesByType}
											projects={projects}
											upstreamVars={[
												...branchUpstreamVars,
												...nodes
													.slice(0, i)
													.map((n) => n.outputVar)
													.filter(Boolean),
											]}
											onUpdate={updateNode}
										/>
									</div>
								)}
							</div>
						))}
					</div>

					<div className="mt-2 flex gap-2">
						<Select
							value={addType}
							onValueChange={(v) =>
								setAddType(v as WorkflowNodeType)
							}
						>
							<SelectTrigger className="h-7 flex-1 text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{BRANCH_NODE_TYPES.map((m) => (
									<SelectItem
										key={m.type}
										value={m.type}
										className="text-xs"
									>
										{m.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							size="sm"
							variant="outline"
							className="h-7 px-2"
							onClick={addNode}
						>
							<Plus className="mr-1 h-3.5 w-3.5" />
							Add step
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

interface ConditionalStepFormProps {
	step: WorkflowNode;
	enginesByType: Record<string, EngineOption[]>;
	projects: ProjectOption[];
	upstreamVars: string[];
	onUpdate: (step: WorkflowNode) => void;
}

export function ConditionalStepForm({
	step,
	enginesByType,
	projects,
	upstreamVars,
	onUpdate,
}: ConditionalStepFormProps) {
	const c = step.config as unknown as ConditionalConfig;
	const update = (patch: Partial<ConditionalConfig>) =>
		onUpdate({
			...step,
			config: { ...c, ...patch } as unknown as NodeConfig,
		});

	return (
		<div className="flex flex-col gap-3">
			<Field>
				<FieldLabel className="text-xs">
					Condition expression
				</FieldLabel>
				<Textarea
					className="min-h-[56px] font-mono text-xs"
					value={c.condition ?? ""}
					onChange={(e) => update({ condition: e.target.value })}
					placeholder={
						upstreamVars.length > 0
							? `\${${upstreamVars[upstreamVars.length - 1]}} != null`
							: // biome-ignore lint/suspicious/noTemplateCurlyInString: literal example for users
								"${score} > 0.8"
					}
					rows={2}
				/>
				<p className="mt-0.5 text-[11px] text-muted-foreground">
					Scope variables are substituted before evaluation. Supports
					JS expressions:{" "}
					<code className="font-mono">{`\${score} > 0.8`}</code>,{" "}
					<code className="font-mono">{`\${status} === "done"`}</code>
				</p>
			</Field>

			<BranchEditor
				label="TRUE branch"
				graph={c.trueGraph ?? emptyGraph()}
				enginesByType={enginesByType}
				projects={projects}
				upstreamVars={upstreamVars}
				onChange={(g) => update({ trueGraph: g })}
			/>

			<BranchEditor
				label="FALSE branch"
				graph={c.falseGraph ?? emptyGraph()}
				enginesByType={enginesByType}
				projects={projects}
				upstreamVars={upstreamVars}
				onChange={(g) => update({ falseGraph: g })}
			/>
		</div>
	);
}
