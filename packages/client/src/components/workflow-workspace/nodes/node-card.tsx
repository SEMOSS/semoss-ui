import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import {
	ChevronDown,
	ChevronUp,
	ClipboardCopy,
	Loader2,
	Play,
	Settings,
	Trash2,
} from "lucide-react";
import { type FC, useState } from "react";
import {
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import type { WorkflowNode, WorkflowNodeConfig } from "../workflow.types";
import { NODE_PALETTE } from "../workflow.types";
import { useWorkflowWorkspaceContext } from "../workflow-workspace-context";

/** Data shape stored on each ReactFlow node — must extend Record<string, unknown> for @xyflow/react v12 */
export interface WorkflowNodeData extends Record<string, unknown> {
	wfNode: WorkflowNode;
}

type RFWorkflowNode = Node<WorkflowNodeData>;

function getNodeMeta(type: string) {
	return NODE_PALETTE.find((m) => m.type === type);
}

/**
 * Engine select dropdown — loaded from WorkflowWorkspaceContext.enginesByType.
 */
const EngineSelect: FC<{
	engineTypeKey: string;
	value: string;
	onChange: (id: string) => void;
}> = ({ engineTypeKey, value, onChange }) => {
	const { enginesByType } = useWorkflowWorkspaceContext();
	const options = enginesByType[engineTypeKey] ?? [];

	return (
		<div className="nodrag nopan flex flex-col gap-1">
			<Label className="text-xs">Engine</Label>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger className="h-7 text-xs">
					<SelectValue placeholder="Select engine…" />
				</SelectTrigger>
				<SelectContent>
					{options.length === 0 && (
						<SelectItem value="__none__" disabled>
							No engines available
						</SelectItem>
					)}
					{options.map((opt) => (
						<SelectItem key={opt.engine_id} value={opt.engine_id}>
							{opt.engine_display_name ?? opt.engine_name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};

/** Inline form per node type. Fields map to what WorkflowExecutorReactor.buildPixel expects. */
const InlineNodeForm: FC<{
	wfNode: WorkflowNode;
	onUpdate: (cfg: WorkflowNodeConfig) => void;
}> = ({ wfNode, onUpdate }) => {
	const cfg = wfNode.config as unknown as Record<
		string,
		string | number | undefined
	>;
	const set = (key: string, val: string | number) =>
		onUpdate({ ...cfg, [key]: val } as unknown as WorkflowNodeConfig);

	switch (wfNode.type) {
		case "trigger":
			return (
				<div className="nodrag nopan flex flex-col gap-2 p-2">
					<div className="flex flex-col gap-1">
						<Label className="text-xs">Mode</Label>
						<Select
							value={(cfg.mode as string) ?? "manual"}
							onValueChange={(v) => set("mode", v)}
						>
							<SelectTrigger className="h-7 text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="manual">Manual</SelectItem>
								<SelectItem value="schedule">
									Schedule
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{cfg.mode === "schedule" && (
						<div className="flex flex-col gap-1">
							<Label className="text-xs">Cron expression</Label>
							<Input
								className="nodrag nopan h-7 text-xs"
								placeholder="0 * * * *"
								value={(cfg.cronExpression as string) ?? ""}
								onChange={(e) =>
									set("cronExpression", e.target.value)
								}
							/>
						</div>
					)}
				</div>
			);

		case "model-engine":
			return (
				<div className="nodrag nopan flex flex-col gap-2 p-2">
					<EngineSelect
						engineTypeKey="MODEL"
						value={(cfg.engineId as string) ?? ""}
						onChange={(v) => set("engineId", v)}
					/>
					<div className="flex flex-col gap-1">
						<Label className="text-xs">Prompt</Label>
						<Textarea
							className="nodrag nopan text-xs"
							rows={3}
							placeholder={`Enter prompt… use \${nodeId} for upstream output`}
							value={(cfg.promptTemplate as string) ?? ""}
							onChange={(e) =>
								set("promptTemplate", e.target.value)
							}
						/>
					</div>
					<div className="flex flex-col gap-1">
						<Label className="text-xs">
							System message{" "}
							<span className="text-muted-foreground">
								(optional)
							</span>
						</Label>
						<Textarea
							className="nodrag nopan text-xs"
							rows={2}
							placeholder="You are a helpful assistant…"
							value={(cfg.systemMessage as string) ?? ""}
							onChange={(e) =>
								set("systemMessage", e.target.value)
							}
						/>
					</div>
					<div className="flex flex-col gap-1">
						<Label className="text-xs">
							Parameters{" "}
							<span className="text-muted-foreground">
								(optional JSON)
							</span>
						</Label>
						<Input
							className="nodrag nopan h-7 font-mono text-xs"
							placeholder='{"temperature": 0.7, "max_tokens": 512}'
							value={(cfg.paramValues as string) ?? ""}
							onChange={(e) => set("paramValues", e.target.value)}
						/>
					</div>
				</div>
			);

		case "database-engine":
			return (
				<div className="nodrag nopan flex flex-col gap-2 p-2">
					<EngineSelect
						engineTypeKey="DATABASE"
						value={(cfg.engineId as string) ?? ""}
						onChange={(v) => set("engineId", v)}
					/>
					<div className="flex flex-col gap-1">
						<Label className="text-xs">SQL Query</Label>
						<Textarea
							className="nodrag nopan font-mono text-xs"
							rows={4}
							placeholder={`SELECT * FROM table WHERE col = '\${upstreamNode}'`}
							value={(cfg.expression as string) ?? ""}
							onChange={(e) => set("expression", e.target.value)}
						/>
					</div>
				</div>
			);

		case "vector-engine":
			return (
				<div className="nodrag nopan flex flex-col gap-2 p-2">
					<EngineSelect
						engineTypeKey="VECTOR"
						value={(cfg.engineId as string) ?? ""}
						onChange={(v) => set("engineId", v)}
					/>
					<div className="flex flex-col gap-1">
						<Label className="text-xs">Operation</Label>
						<Select
							value={(cfg.operation as string) ?? "query"}
							onValueChange={(v) => set("operation", v)}
						>
							<SelectTrigger className="h-7 text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="query">
									Semantic search
								</SelectItem>
								<SelectItem value="embed">
									Embed document
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-1">
						<Label className="text-xs">Search query</Label>
						<Input
							className="nodrag nopan h-7 text-xs"
							placeholder={`Search term or \${upstreamNode}`}
							value={(cfg.expression as string) ?? ""}
							onChange={(e) => set("expression", e.target.value)}
						/>
					</div>
					<div className="flex flex-col gap-1">
						<Label className="text-xs">
							Result limit{" "}
							<span className="text-muted-foreground">
								(optional)
							</span>
						</Label>
						<Input
							className="nodrag nopan h-7 text-xs"
							type="number"
							min={1}
							placeholder="10"
							value={(cfg.limit as number) ?? ""}
							onChange={(e) =>
								set(
									"limit",
									e.target.value
										? Number(e.target.value)
										: "",
								)
							}
						/>
					</div>
				</div>
			);

		case "storage-engine":
			return (
				<div className="nodrag nopan flex flex-col gap-2 p-2">
					<EngineSelect
						engineTypeKey="STORAGE"
						value={(cfg.engineId as string) ?? ""}
						onChange={(v) => set("engineId", v)}
					/>
					<div className="flex flex-col gap-1">
						<Label className="text-xs">Operation</Label>
						<Select
							value={(cfg.operation as string) ?? "list"}
							onValueChange={(v) => set("operation", v)}
						>
							<SelectTrigger className="h-7 text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="list">List files</SelectItem>
								<SelectItem value="read">Read file</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-1">
						<Label className="text-xs">Path</Label>
						<Input
							className="nodrag nopan h-7 text-xs"
							placeholder="/folder/file.txt"
							value={(cfg.path as string) ?? ""}
							onChange={(e) => set("path", e.target.value)}
						/>
					</div>
				</div>
			);

		case "function-engine":
			return (
				<div className="nodrag nopan flex flex-col gap-2 p-2">
					<EngineSelect
						engineTypeKey="FUNCTION"
						value={(cfg.engineId as string) ?? ""}
						onChange={(v) => set("engineId", v)}
					/>
					<div className="flex flex-col gap-1">
						<Label className="text-xs">
							Parameters{" "}
							<span className="text-muted-foreground">
								(optional JSON)
							</span>
						</Label>
						<Textarea
							className="nodrag nopan font-mono text-xs"
							rows={3}
							placeholder='{"key": "value"}'
							value={(cfg.paramsExpression as string) ?? ""}
							onChange={(e) =>
								set("paramsExpression", e.target.value)
							}
						/>
					</div>
				</div>
			);

		case "custom-pixel":
			return (
				<div className="nodrag nopan flex flex-col gap-2 p-2">
					<div className="flex flex-col gap-1">
						<Label className="text-xs">Pixel expression</Label>
						<Textarea
							className="nodrag nopan font-mono text-xs"
							rows={4}
							placeholder={`MyReactor(param=["\${upstreamNode}"]);`}
							value={(cfg.pixel as string) ?? ""}
							onChange={(e) => set("pixel", e.target.value)}
						/>
					</div>
				</div>
			);

		case "transform":
			return (
				<div className="nodrag nopan flex flex-col gap-2 p-2">
					<div className="flex flex-col gap-1">
						<Label className="text-xs">Operation</Label>
						<Select
							value={(cfg.operation as string) ?? "map"}
							onValueChange={(v) => set("operation", v)}
						>
							<SelectTrigger className="h-7 text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="map">Map</SelectItem>
								<SelectItem value="filter">Filter</SelectItem>
								<SelectItem value="reduce">Reduce</SelectItem>
								<SelectItem value="flatten">Flatten</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-1">
						<Label className="text-xs">Pixel expression</Label>
						<Textarea
							className="nodrag nopan font-mono text-xs"
							rows={3}
							placeholder="CollectAll()"
							value={(cfg.expression as string) ?? ""}
							onChange={(e) => set("expression", e.target.value)}
						/>
					</div>
				</div>
			);

		default:
			return (
				<div className="p-2 text-muted-foreground text-xs">
					No configuration for this node type.
				</div>
			);
	}
};

/**
 * Output ref chip + output preview — shown when a node is expanded.
 * The ref chip copies ${nodeId} to clipboard for pasting into downstream nodes.
 */
const NodeOutputSection: FC<{ nodeId: string; output?: string }> = ({
	nodeId,
	output,
}) => {
	const ref = `\${${nodeId}}`;
	const [copied, setCopied] = useState(false);

	const copy = () => {
		navigator.clipboard.writeText(ref).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		});
	};

	return (
		<div className="nodrag nopan border-border border-t px-2 pt-1.5 pb-2">
			<div className="mb-1 flex items-center gap-1.5">
				<span className="text-muted-foreground text-xs">
					Output ref:
				</span>
				<button
					type="button"
					onClick={copy}
					className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] hover:bg-muted/80"
					title="Copy reference to clipboard"
				>
					<code>{ref}</code>
					<ClipboardCopy className="size-2.5" />
				</button>
				{copied && (
					<span className="text-[10px] text-green-600">Copied!</span>
				)}
			</div>
			{output && (
				<pre className="max-h-28 overflow-y-auto whitespace-pre-wrap break-words rounded bg-muted p-1.5 text-[10px] leading-relaxed">
					{output}
				</pre>
			)}
		</div>
	);
};

/**
 * Custom ReactFlow node.
 * Header: label (expand toggle) + Run button + Settings + Delete.
 * Expanded: inline form + output ref chip + output preview.
 */
export const WorkflowNodeCard: FC<NodeProps<RFWorkflowNode>> = ({ data }) => {
	const { wfNode } = data;
	const {
		expandedNodeId,
		nodeOutputs,
		onNodeUpdate,
		deleteNode,
		openSettings,
		toggleExpand,
		runNode,
	} = useWorkflowWorkspaceContext();

	const [isRunning, setIsRunning] = useState(false);

	const meta = getNodeMeta(wfNode.type);
	const isExpanded = expandedNodeId === wfNode.id;
	const output = nodeOutputs[wfNode.id];
	const isTrigger = wfNode.type === "trigger";

	const handleUpdate = (cfg: WorkflowNodeConfig) => {
		onNodeUpdate({ ...wfNode, config: cfg });
	};

	const handleRun = async (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsRunning(true);
		try {
			await runNode(wfNode.id);
		} finally {
			setIsRunning(false);
		}
	};

	return (
		<div
			className="min-w-56 rounded-lg border border-border bg-card shadow-md"
			style={{
				borderTopWidth: 3,
				borderTopColor: meta?.color ?? "#475569",
			}}
		>
			<Handle
				type="target"
				position={Position.Top}
				className="!bg-muted-foreground"
			/>

			{/* Header */}
			<div className="flex items-center gap-1.5 px-3 py-2">
				<button
					type="button"
					className="nodrag nopan flex min-w-0 flex-1 cursor-pointer flex-col text-left"
					onClick={() => toggleExpand(wfNode.id)}
				>
					<span className="truncate font-semibold text-sm">
						{wfNode.label}
					</span>
					<span className="text-muted-foreground text-xs">
						{meta?.label ?? wfNode.type}
					</span>
				</button>

				{/* Run button — hidden for trigger nodes */}
				{!isTrigger && (
					<button
						type="button"
						aria-label="Run node"
						disabled={isRunning}
						onClick={handleRun}
						className="nodrag nopan flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-green-600 disabled:opacity-50"
					>
						{isRunning ? (
							<Loader2 className="size-3.5 animate-spin" />
						) : (
							<Play className="size-3.5" />
						)}
					</button>
				)}

				<button
					type="button"
					aria-label="Node settings"
					onClick={(e) => {
						e.stopPropagation();
						openSettings(wfNode.id);
					}}
					className="nodrag nopan flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
				>
					<Settings className="size-3.5" />
				</button>

				<button
					type="button"
					aria-label="Delete node"
					onClick={(e) => {
						e.stopPropagation();
						deleteNode(wfNode.id);
					}}
					className="nodrag nopan flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-destructive"
				>
					<Trash2 className="size-3.5" />
				</button>

				<span className="ml-0.5 shrink-0 text-muted-foreground">
					{isExpanded ? (
						<ChevronUp className="size-3.5" />
					) : (
						<ChevronDown className="size-3.5" />
					)}
				</span>
			</div>

			{/* Inline expanded content */}
			{isExpanded && (
				<>
					<div className="border-border border-t">
						<InlineNodeForm
							wfNode={wfNode}
							onUpdate={handleUpdate}
						/>
					</div>
					{!isTrigger && (
						<NodeOutputSection nodeId={wfNode.id} output={output} />
					)}
				</>
			)}

			{/* Collapsed output indicator */}
			{!isExpanded && output && (
				<div className="border-border border-t px-3 py-1">
					<span className="text-[10px] text-green-600">
						✓ output ready
					</span>
				</div>
			)}

			<Handle
				type="source"
				position={Position.Bottom}
				className="!bg-muted-foreground"
			/>
		</div>
	);
};
