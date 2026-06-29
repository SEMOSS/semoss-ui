import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { ChevronDown, ChevronUp, Settings, Trash2 } from "lucide-react";
import type { FC } from "react";
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

/** Data shape stored on each ReactFlow node */
export interface WorkflowNodeData {
	wfNode: WorkflowNode;
}

type RFWorkflowNode = Node<WorkflowNodeData>;

function getNodeMeta(type: string) {
	return NODE_PALETTE.find((m) => m.type === type);
}

/**
 * Engine select dropdown — loaded from WorkflowWorkspaceContext.enginesByType.
 * engineTypeKey is the SEMOSS engine type string (e.g. "MODEL", "DATABASE").
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

/** Inline form rendered when a node is expanded. Per-type form fields. */
const InlineNodeForm: FC<{
	wfNode: WorkflowNode;
	onUpdate: (cfg: WorkflowNodeConfig) => void;
}> = ({ wfNode, onUpdate }) => {
	const cfg = wfNode.config as Record<string, string>;
	const set = (key: string, val: string) =>
		onUpdate({ ...cfg, [key]: val } as WorkflowNodeConfig);

	switch (wfNode.type) {
		case "trigger":
			return (
				<div className="nodrag nopan flex flex-col gap-2 p-2">
					<div className="flex flex-col gap-1">
						<Label className="text-xs">Mode</Label>
						<Select
							value={cfg.mode ?? "manual"}
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
								value={cfg.cronExpression ?? ""}
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
						value={cfg.engineId ?? ""}
						onChange={(v) => set("engineId", v)}
					/>
					<div className="flex flex-col gap-1">
						<Label className="text-xs">Prompt</Label>
						<Textarea
							className="nodrag nopan text-xs"
							rows={3}
							placeholder="Prompt… use ${nodeId} for upstream output"
							value={cfg.promptTemplate ?? ""}
							onChange={(e) =>
								set("promptTemplate", e.target.value)
							}
						/>
					</div>
				</div>
			);

		case "database-engine":
			return (
				<div className="nodrag nopan flex flex-col gap-2 p-2">
					<EngineSelect
						engineTypeKey="DATABASE"
						value={cfg.engineId ?? ""}
						onChange={(v) => set("engineId", v)}
					/>
					<div className="flex flex-col gap-1">
						<Label className="text-xs">Operation</Label>
						<Select
							value={cfg.operation ?? "query"}
							onValueChange={(v) => set("operation", v)}
						>
							<SelectTrigger className="h-7 text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="query">Query</SelectItem>
								<SelectItem value="update">Update</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-1">
						<Label className="text-xs">SQL expression</Label>
						<Textarea
							className="nodrag nopan text-xs"
							rows={3}
							placeholder="SELECT * FROM …"
							value={cfg.expression ?? ""}
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
						value={cfg.engineId ?? ""}
						onChange={(v) => set("engineId", v)}
					/>
					<div className="flex flex-col gap-1">
						<Label className="text-xs">Operation</Label>
						<Select
							value={cfg.operation ?? "query"}
							onValueChange={(v) => set("operation", v)}
						>
							<SelectTrigger className="h-7 text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="query">Query</SelectItem>
								<SelectItem value="embed">
									Embed document
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-1">
						<Label className="text-xs">Expression</Label>
						<Input
							className="nodrag nopan h-7 text-xs"
							placeholder="Search query or file path…"
							value={cfg.expression ?? ""}
							onChange={(e) => set("expression", e.target.value)}
						/>
					</div>
				</div>
			);

		case "storage-engine":
			return (
				<div className="nodrag nopan flex flex-col gap-2 p-2">
					<EngineSelect
						engineTypeKey="STORAGE"
						value={cfg.engineId ?? ""}
						onChange={(v) => set("engineId", v)}
					/>
					<div className="flex flex-col gap-1">
						<Label className="text-xs">Operation</Label>
						<Select
							value={cfg.operation ?? "list"}
							onValueChange={(v) => set("operation", v)}
						>
							<SelectTrigger className="h-7 text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="list">List</SelectItem>
								<SelectItem value="read">Read</SelectItem>
								<SelectItem value="write">Write</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-1">
						<Label className="text-xs">Path</Label>
						<Input
							className="nodrag nopan h-7 text-xs"
							placeholder="/folder/file.txt"
							value={cfg.path ?? ""}
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
						value={cfg.engineId ?? ""}
						onChange={(v) => set("engineId", v)}
					/>
					<div className="flex flex-col gap-1">
						<Label className="text-xs">Parameters</Label>
						<Textarea
							className="nodrag nopan text-xs"
							rows={2}
							placeholder='{"key": "value"}'
							value={cfg.paramsExpression ?? ""}
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
							placeholder="MyReactor(param=[${upstreamNode}]);"
							value={cfg.pixel ?? ""}
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
							value={cfg.operation ?? "map"}
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
						<Label className="text-xs">Expression</Label>
						<Textarea
							className="nodrag nopan font-mono text-xs"
							rows={3}
							placeholder="item => item.value"
							value={cfg.expression ?? ""}
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
 * Custom ReactFlow node — clicking the header toggles inline expansion.
 * Config updates go through onNodeUpdate; expansion through toggleExpand.
 */
export const WorkflowNodeCard: FC<NodeProps<RFWorkflowNode>> = ({ data }) => {
	const { wfNode } = data;
	const {
		expandedNodeId,
		onNodeUpdate,
		deleteNode,
		openSettings,
		toggleExpand,
	} = useWorkflowWorkspaceContext();

	const meta = getNodeMeta(wfNode.type);
	const isExpanded = expandedNodeId === wfNode.id;

	const handleUpdate = (cfg: WorkflowNodeConfig) => {
		onNodeUpdate({ ...wfNode, config: cfg });
	};

	return (
		<div
			className="min-w-52 rounded-lg border border-border bg-card shadow-md"
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

			{/* Header: label button (expands) + action buttons (siblings, not nested) */}
			<div className="flex items-center gap-2 px-3 py-2">
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
				<div className="flex shrink-0 items-center gap-1">
					<button
						type="button"
						className="nodrag nopan rounded p-0.5 text-muted-foreground hover:text-foreground"
						onClick={() => openSettings(wfNode.id)}
						title="Full settings"
					>
						<Settings className="size-3.5" />
					</button>
					<button
						type="button"
						className="nodrag nopan rounded p-0.5 text-muted-foreground hover:text-destructive"
						onClick={() => deleteNode(wfNode.id)}
						title="Delete node"
					>
						<Trash2 className="size-3.5" />
					</button>
					{isExpanded ? (
						<ChevronUp className="size-3.5 text-muted-foreground" />
					) : (
						<ChevronDown className="size-3.5 text-muted-foreground" />
					)}
				</div>
			</div>

			{isExpanded && (
				<div className="border-border border-t">
					<InlineNodeForm wfNode={wfNode} onUpdate={handleUpdate} />
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
