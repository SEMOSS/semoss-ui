import { Handle, type NodeProps, Position } from "@xyflow/react";
import {
	ChevronRight,
	Code2,
	ExternalLink,
	Loader2,
	Play,
	Trash2,
} from "lucide-react";
import { memo, useState } from "react";
import {
	Button,
	Field,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import type {
	AppNodeConfig,
	ConditionalConfig,
	CustomPixelConfig,
	DatabaseEngineConfig,
	EngineOption,
	FanOutConfig,
	FunctionEngineConfig,
	ModelEngineConfig,
	StorageEngineConfig,
	TransformConfig,
	TriggerConfig,
	VectorEngineConfig,
	WorkflowNode,
	WorkflowNodeType,
} from "@/pages/workflow/workflow.types";
import { EngineSelect } from "../../workflow-form-editor/forms/shared";
import { NODE_COLORS, NODE_ICONS } from "../workflow-node-meta";
import {
	buildPixelPreview,
	extractVarRefs,
	substituteVars,
} from "../workflow-utils";
import { useWorkflowWorkspaceContext } from "../workflow-workspace-context";

// ─── data shape flowing through ReactFlow ────────────────────────────────────

export interface WorkflowNodeData extends Record<string, unknown> {
	nodeType: WorkflowNodeType;
	label: string;
	outputVar: string;
	config: Record<string, unknown>;
	onSettings?: (id: string) => void;
}

// ─── per-type inline quick-config forms ───────────────────────────────────────

function InlineTriggerForm({
	node,
	onUpdate,
}: {
	node: WorkflowNode;
	onUpdate: (n: WorkflowNode) => void;
}) {
	const config = node.config as TriggerConfig;
	const update = (c: TriggerConfig) => onUpdate({ ...node, config: c });
	return (
		<div className="flex flex-col gap-2">
			<Field>
				<FieldLabel className="text-[11px]">Trigger Mode</FieldLabel>
				<Select
					value={config.mode}
					onValueChange={(v) =>
						update({ ...config, mode: v as TriggerConfig["mode"] })
					}
				>
					<SelectTrigger className="nodrag nopan h-7 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="manual" className="text-xs">
							Manual
						</SelectItem>
						<SelectItem value="schedule" className="text-xs">
							Schedule (cron)
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			{config.mode === "schedule" && (
				<Field>
					<FieldLabel className="text-[11px]">
						Cron Expression
					</FieldLabel>
					<Input
						className="nodrag nopan h-7 font-mono text-xs"
						value={config.cronExpression}
						onChange={(e) =>
							update({
								...config,
								cronExpression: e.target.value,
							})
						}
						placeholder="0 0 6 * * ?"
					/>
				</Field>
			)}
		</div>
	);
}

function InlineDatabaseForm({
	node,
	engines,
	onUpdate,
}: {
	node: WorkflowNode;
	engines: EngineOption[];
	onUpdate: (n: WorkflowNode) => void;
}) {
	const config = node.config as DatabaseEngineConfig;
	const update = (c: DatabaseEngineConfig) =>
		onUpdate({ ...node, config: c });
	return (
		<div className="flex flex-col gap-2">
			<EngineSelect
				label="Database Engine"
				value={config.engineId}
				engines={engines}
				onChange={(v) => update({ ...config, engineId: v })}
				triggerClassName="nodrag nopan h-7 text-xs"
				labelClassName="text-[11px]"
			/>
			<Field>
				<FieldLabel className="text-[11px]">Operation</FieldLabel>
				<Select
					value={config.operation}
					onValueChange={(v) =>
						update({
							...config,
							operation: v as DatabaseEngineConfig["operation"],
						})
					}
				>
					<SelectTrigger className="nodrag nopan h-7 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="query" className="text-xs">
							Query (SELECT)
						</SelectItem>
						<SelectItem value="write" className="text-xs">
							Write (INSERT/UPDATE/DELETE)
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<Field>
				<FieldLabel className="text-[11px]">
					SQL / Pixel Expression
				</FieldLabel>
				<Textarea
					className="nodrag nopan font-mono text-[11px]"
					rows={3}
					value={config.expression}
					onChange={(e) =>
						update({ ...config, expression: e.target.value })
					}
					placeholder="SELECT * FROM table WHERE id = '${id}'"
				/>
			</Field>
		</div>
	);
}

function InlineStorageForm({
	node,
	engines,
	onUpdate,
}: {
	node: WorkflowNode;
	engines: EngineOption[];
	onUpdate: (n: WorkflowNode) => void;
}) {
	const config = node.config as StorageEngineConfig;
	const update = (c: StorageEngineConfig) => onUpdate({ ...node, config: c });
	return (
		<div className="flex flex-col gap-2">
			<EngineSelect
				label="Storage Engine"
				value={config.engineId}
				engines={engines}
				onChange={(v) => update({ ...config, engineId: v })}
				triggerClassName="nodrag nopan h-7 text-xs"
				labelClassName="text-[11px]"
			/>
			<Field>
				<FieldLabel className="text-[11px]">Operation</FieldLabel>
				<Select
					value={config.operation}
					onValueChange={(v) =>
						update({
							...config,
							operation: v as StorageEngineConfig["operation"],
						})
					}
				>
					<SelectTrigger className="nodrag nopan h-7 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="list" className="text-xs">
							List
						</SelectItem>
						<SelectItem value="download" className="text-xs">
							Download
						</SelectItem>
						<SelectItem value="upload" className="text-xs">
							Upload
						</SelectItem>
						<SelectItem value="delete" className="text-xs">
							Delete
						</SelectItem>
						<SelectItem value="read-base64" className="text-xs">
							Read as Base64
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<Field>
				<FieldLabel className="text-[11px]">Storage Path</FieldLabel>
				<Input
					className="nodrag nopan h-7 text-xs"
					value={config.storagePath}
					onChange={(e) =>
						update({ ...config, storagePath: e.target.value })
					}
					placeholder="/documents/${folder}"
				/>
			</Field>
			{(config.operation === "download" ||
				config.operation === "upload") && (
				<Field>
					<FieldLabel className="text-[11px]">
						Local File Path
					</FieldLabel>
					<Input
						className="nodrag nopan h-7 text-xs"
						value={config.filePath}
						onChange={(e) =>
							update({ ...config, filePath: e.target.value })
						}
						placeholder="/tmp/output.csv"
					/>
				</Field>
			)}
		</div>
	);
}

function InlineVectorForm({
	node,
	engines,
	onUpdate,
}: {
	node: WorkflowNode;
	engines: EngineOption[];
	onUpdate: (n: WorkflowNode) => void;
}) {
	const config = node.config as VectorEngineConfig;
	const update = (c: VectorEngineConfig) => onUpdate({ ...node, config: c });
	return (
		<div className="flex flex-col gap-2">
			<EngineSelect
				label="Vector Engine"
				value={config.engineId}
				engines={engines}
				onChange={(v) => update({ ...config, engineId: v })}
				triggerClassName="nodrag nopan h-7 text-xs"
				labelClassName="text-[11px]"
			/>
			<Field>
				<FieldLabel className="text-[11px]">Operation</FieldLabel>
				<Select
					value={config.operation}
					onValueChange={(v) =>
						update({
							...config,
							operation: v as VectorEngineConfig["operation"],
						})
					}
				>
					<SelectTrigger className="nodrag nopan h-7 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="search" className="text-xs">
							Search (semantic)
						</SelectItem>
						<SelectItem value="add-file" className="text-xs">
							Add File
						</SelectItem>
						<SelectItem value="add-csv" className="text-xs">
							Add CSV
						</SelectItem>
						<SelectItem value="list" className="text-xs">
							List Documents
						</SelectItem>
						<SelectItem value="delete" className="text-xs">
							Delete Documents
						</SelectItem>
						<SelectItem value="download" className="text-xs">
							Download Document
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			{config.operation === "search" && (
				<>
					<Field>
						<FieldLabel className="text-[11px]">
							Search Query
						</FieldLabel>
						<Input
							className="nodrag nopan h-7 text-xs"
							value={config.command}
							onChange={(e) =>
								update({ ...config, command: e.target.value })
							}
							placeholder="find documents about ${topic}"
						/>
					</Field>
					<Field>
						<FieldLabel className="text-[11px]">
							Result Limit
						</FieldLabel>
						<Input
							type="number"
							min={1}
							className="nodrag nopan h-7 text-xs"
							value={config.limit || ""}
							onChange={(e) =>
								update({
									...config,
									limit: Number(e.target.value),
								})
							}
							placeholder="5"
						/>
					</Field>
				</>
			)}
			{config.operation === "add-file" && (
				<Field>
					<FieldLabel className="text-[11px]">File Path</FieldLabel>
					<Input
						className="nodrag nopan h-7 text-xs"
						value={config.filePath}
						onChange={(e) =>
							update({ ...config, filePath: e.target.value })
						}
						placeholder="/path/to/file.pdf"
					/>
				</Field>
			)}
			{config.operation === "add-csv" && (
				<Field>
					<FieldLabel className="text-[11px]">File Paths</FieldLabel>
					<Input
						className="nodrag nopan h-7 text-xs"
						value={config.filePaths}
						onChange={(e) =>
							update({ ...config, filePaths: e.target.value })
						}
						placeholder="/data/embeddings.csv"
					/>
				</Field>
			)}
			{(config.operation === "delete" ||
				config.operation === "download") && (
				<Field>
					<FieldLabel className="text-[11px]">File Names</FieldLabel>
					<Input
						className="nodrag nopan h-7 text-xs"
						value={config.fileNames}
						onChange={(e) =>
							update({ ...config, fileNames: e.target.value })
						}
						placeholder="doc1.pdf, doc2.docx"
					/>
				</Field>
			)}
		</div>
	);
}

function InlineModelForm({
	node,
	engines,
	onUpdate,
}: {
	node: WorkflowNode;
	engines: EngineOption[];
	onUpdate: (n: WorkflowNode) => void;
}) {
	const config = node.config as ModelEngineConfig;
	const update = (c: ModelEngineConfig) => onUpdate({ ...node, config: c });
	return (
		<div className="flex flex-col gap-2">
			<EngineSelect
				label="Model Engine"
				value={config.engineId}
				engines={engines}
				onChange={(v) => update({ ...config, engineId: v })}
				triggerClassName="nodrag nopan h-7 text-xs"
				labelClassName="text-[11px]"
			/>
			<Field>
				<FieldLabel className="text-[11px]">Prompt</FieldLabel>
				<Textarea
					className="nodrag nopan font-mono text-[11px]"
					rows={3}
					value={config.command}
					onChange={(e) =>
						update({ ...config, command: e.target.value })
					}
					placeholder="Summarize: ${text}"
				/>
			</Field>
		</div>
	);
}

function InlineFunctionForm({
	node,
	engines,
	onUpdate,
}: {
	node: WorkflowNode;
	engines: EngineOption[];
	onUpdate: (n: WorkflowNode) => void;
}) {
	const config = node.config as FunctionEngineConfig;
	const update = (c: FunctionEngineConfig) =>
		onUpdate({ ...node, config: c });
	return (
		<div className="flex flex-col gap-2">
			<EngineSelect
				label="Function Engine"
				value={config.engineId}
				engines={engines}
				onChange={(v) => update({ ...config, engineId: v })}
				triggerClassName="nodrag nopan h-7 text-xs"
				labelClassName="text-[11px]"
			/>
			<Field>
				<FieldLabel className="text-[11px]">
					Parameters (JSON)
				</FieldLabel>
				<Textarea
					className="nodrag nopan font-mono text-[11px]"
					rows={2}
					value={config.params}
					onChange={(e) =>
						update({ ...config, params: e.target.value })
					}
					placeholder='{"input": "${files}"}'
				/>
			</Field>
		</div>
	);
}

function InlineAppForm({
	node,
	onUpdate,
}: {
	node: WorkflowNode;
	onUpdate: (n: WorkflowNode) => void;
}) {
	const config = node.config as AppNodeConfig;
	const update = (c: AppNodeConfig) => onUpdate({ ...node, config: c });
	return (
		<div className="flex flex-col gap-2">
			<Field>
				<FieldLabel className="text-[11px]">
					App / Project ID
				</FieldLabel>
				<Input
					className="nodrag nopan h-7 text-xs"
					value={config.appId}
					onChange={(e) =>
						update({ ...config, appId: e.target.value })
					}
					placeholder="${config.MY_APP_ID}"
				/>
			</Field>
			<Field>
				<FieldLabel className="text-[11px]">
					Pixel Expression
				</FieldLabel>
				<Textarea
					className="nodrag nopan font-mono text-[11px]"
					rows={3}
					value={config.pixel}
					onChange={(e) =>
						update({ ...config, pixel: e.target.value })
					}
					placeholder="RunSomeReactor(input='${data}')"
				/>
			</Field>
		</div>
	);
}

function InlineCustomPixelForm({
	node,
	onUpdate,
}: {
	node: WorkflowNode;
	onUpdate: (n: WorkflowNode) => void;
}) {
	const config = node.config as CustomPixelConfig;
	const update = (c: CustomPixelConfig) => onUpdate({ ...node, config: c });
	return (
		<Field>
			<FieldLabel className="text-[11px]">Pixel Expression</FieldLabel>
			<Textarea
				className="nodrag nopan font-mono text-[11px]"
				rows={4}
				value={config.pixel}
				onChange={(e) => update({ pixel: e.target.value })}
				placeholder="SyncEsrMetadata(apiUrl=&quot;${config.URL}&quot;)"
			/>
		</Field>
	);
}

function InlineFanOutForm({
	node,
	onUpdate,
}: {
	node: WorkflowNode;
	onUpdate: (n: WorkflowNode) => void;
}) {
	const config = node.config as FanOutConfig;
	const update = (c: FanOutConfig) => onUpdate({ ...node, config: c });
	return (
		<div className="flex flex-col gap-2">
			<Field>
				<FieldLabel className="text-[11px]">
					Input Array Variable
				</FieldLabel>
				<Input
					className="nodrag nopan h-7 text-xs"
					value={config.inputVar}
					onChange={(e) =>
						update({ ...config, inputVar: e.target.value })
					}
					placeholder="esr_list"
				/>
			</Field>
			<Field>
				<FieldLabel className="text-[11px]">Parallelism</FieldLabel>
				<Input
					className="nodrag nopan h-7 text-xs"
					value={config.parallelism}
					onChange={(e) =>
						update({ ...config, parallelism: e.target.value })
					}
					placeholder="8"
				/>
			</Field>
		</div>
	);
}

function InlineConditionalForm({
	node,
	onUpdate,
}: {
	node: WorkflowNode;
	onUpdate: (n: WorkflowNode) => void;
}) {
	const config = node.config as ConditionalConfig;
	const update = (c: ConditionalConfig) => onUpdate({ ...node, config: c });
	return (
		<Field>
			<FieldLabel className="text-[11px]">
				Condition Expression
			</FieldLabel>
			<Textarea
				className="nodrag nopan font-mono text-[11px]"
				rows={3}
				value={config.condition}
				onChange={(e) =>
					update({ ...config, condition: e.target.value })
				}
				placeholder="${monthly_engine} != null"
			/>
		</Field>
	);
}

function InlineTransformForm({
	node,
	onUpdate,
}: {
	node: WorkflowNode;
	onUpdate: (n: WorkflowNode) => void;
}) {
	const config = node.config as TransformConfig;
	const update = (c: TransformConfig) => onUpdate({ ...node, config: c });
	return (
		<div className="flex flex-col gap-2">
			<Field>
				<FieldLabel className="text-[11px]">Operation</FieldLabel>
				<Select
					value={config.operation}
					onValueChange={(v) =>
						update({
							...config,
							operation: v as TransformConfig["operation"],
						})
					}
				>
					<SelectTrigger className="nodrag nopan h-7 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="map" className="text-xs">
							Map
						</SelectItem>
						<SelectItem value="filter" className="text-xs">
							Filter
						</SelectItem>
						<SelectItem value="reduce" className="text-xs">
							Reduce
						</SelectItem>
						<SelectItem value="flatten" className="text-xs">
							Flatten
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<Field>
				<FieldLabel className="text-[11px]">Expression</FieldLabel>
				<Textarea
					className="nodrag nopan font-mono text-[11px]"
					rows={2}
					value={config.expression}
					onChange={(e) =>
						update({ ...config, expression: e.target.value })
					}
					placeholder="${item.name}.toLowerCase()"
				/>
			</Field>
		</div>
	);
}

// ─── inline form dispatcher ───────────────────────────────────────────────────

function InlineNodeForm({
	node,
	enginesByType,
	onUpdate,
}: {
	node: WorkflowNode;
	enginesByType: Record<string, EngineOption[]>;
	onUpdate: (n: WorkflowNode) => void;
}) {
	switch (node.type) {
		case "trigger":
			return <InlineTriggerForm node={node} onUpdate={onUpdate} />;
		case "database-engine":
			return (
				<InlineDatabaseForm
					node={node}
					engines={enginesByType.DATABASE ?? []}
					onUpdate={onUpdate}
				/>
			);
		case "storage-engine":
			return (
				<InlineStorageForm
					node={node}
					engines={enginesByType.STORAGE ?? []}
					onUpdate={onUpdate}
				/>
			);
		case "vector-engine":
			return (
				<InlineVectorForm
					node={node}
					engines={enginesByType.VECTOR ?? []}
					onUpdate={onUpdate}
				/>
			);
		case "model-engine":
			return (
				<InlineModelForm
					node={node}
					engines={enginesByType.MODEL ?? []}
					onUpdate={onUpdate}
				/>
			);
		case "function-engine":
			return (
				<InlineFunctionForm
					node={node}
					engines={enginesByType.FUNCTION ?? []}
					onUpdate={onUpdate}
				/>
			);
		case "app":
			return <InlineAppForm node={node} onUpdate={onUpdate} />;
		case "custom-pixel":
			return <InlineCustomPixelForm node={node} onUpdate={onUpdate} />;
		case "fan-out":
			return <InlineFanOutForm node={node} onUpdate={onUpdate} />;
		case "conditional":
			return <InlineConditionalForm node={node} onUpdate={onUpdate} />;
		case "transform":
			return <InlineTransformForm node={node} onUpdate={onUpdate} />;
		default:
			return null;
	}
}

// ─── collapsed summary line ───────────────────────────────────────────────────

function collapsedSummary(
	config: Record<string, unknown>,
	enginesByType: Record<string, EngineOption[]>,
	nodeType: WorkflowNodeType,
): string {
	const engineTypeMap: Partial<Record<WorkflowNodeType, string>> = {
		"database-engine": "DATABASE",
		"storage-engine": "STORAGE",
		"vector-engine": "VECTOR",
		"model-engine": "MODEL",
		"function-engine": "FUNCTION",
	};
	const eKey = engineTypeMap[nodeType];
	if (eKey && config.engineId) {
		const engines = enginesByType[eKey] ?? [];
		const found = engines.find((e) => e.engine_id === config.engineId);
		return found
			? (found.engine_display_name ?? found.engine_name)
			: String(config.engineId).slice(0, 20);
	}
	if (config.pixel) {
		const px = String(config.pixel);
		return px.length > 35 ? `${px.slice(0, 35)}…` : px;
	}
	if (config.pixelExpression) {
		const px = String(config.pixelExpression);
		return px.length > 35 ? `${px.slice(0, 35)}…` : px;
	}
	if (config.mode) return `mode: ${config.mode}`;
	if (config.operation) return `op: ${config.operation}`;
	return "";
}

// ─── node card ────────────────────────────────────────────────────────────────

export const WorkflowNodeCard = memo(({ id, data }: NodeProps) => {
	const d = data as WorkflowNodeData;
	const {
		expandedNodeId,
		setExpandedNodeId,
		enginesByType,
		getWfNode,
		onNodeUpdate,
		deleteNode,
		openSettings,
		nodeOutputs,
		setNodeOutput,
	} = useWorkflowWorkspaceContext();

	const { monolithStore } = useRootStore();
	const [running, setRunning] = useState(false);
	const [runOutput, setRunOutput] = useState<string | null>(null);
	const [mockValues, setMockValues] = useState<Record<string, string>>({});

	const isExpanded = expandedNodeId === id;
	const Icon = NODE_ICONS[d.nodeType] ?? Code2;
	const color = NODE_COLORS[d.nodeType] ?? "bg-slate-500";
	const isTrigger = d.nodeType === "trigger";
	const fullNode = getWfNode(id);
	const summary = collapsedSummary(d.config, enginesByType, d.nodeType);

	const handleRun = async () => {
		if (!fullNode) return;
		const raw = buildPixelPreview(fullNode);
		if (!raw || raw.startsWith("//")) return;

		// merge stored outputs + mock values for substitution
		const allValues = { ...nodeOutputs, ...mockValues };
		const pixel = substituteVars(raw, allValues);

		setRunning(true);
		setRunOutput(null);
		try {
			const result = await monolithStore.runQuery(pixel);
			const out = result.pixelReturn?.[0]?.output;
			const outStr =
				typeof out === "string" ? out : JSON.stringify(out, null, 2);
			setRunOutput(outStr);
			// store output so downstream nodes can reference it
			if (fullNode.outputVar) setNodeOutput(fullNode.outputVar, outStr);
		} catch (err) {
			setRunOutput(`Error: ${(err as Error).message}`);
		} finally {
			setRunning(false);
		}
	};

	const toggleExpand = (e: React.MouseEvent) => {
		e.stopPropagation();
		setExpandedNodeId(isExpanded ? null : id);
	};

	return (
		<div
			className={[
				"group relative flex flex-col rounded-lg border bg-background shadow-sm transition-all duration-150",
				isExpanded
					? "min-w-[300px] shadow-lg ring-1 ring-primary"
					: "min-w-[200px]",
				!isExpanded && "hover:shadow-md",
			]
				.filter(Boolean)
				.join(" ")}
		>
			{/* header bar — click to toggle expansion */}
			<button
				type="button"
				className={`flex w-full cursor-pointer items-center gap-2 rounded-t-lg px-3 py-2 ${color}`}
				onClick={toggleExpand}
			>
				<Icon className="h-3.5 w-3.5 flex-shrink-0 text-white/90" />
				<span className="min-w-0 flex-1 truncate font-medium text-white text-xs">
					{d.label}
				</span>
				<ChevronRight
					className={[
						"h-3 w-3 flex-shrink-0 text-white/70 transition-transform duration-150",
						isExpanded ? "rotate-90" : "",
					].join(" ")}
				/>
			</button>

			{/* ── collapsed view ── */}
			{!isExpanded && (
				<>
					{summary && (
						<div className="truncate px-3 pt-1 text-[10px] text-muted-foreground">
							{summary}
						</div>
					)}
					<div className="px-3 py-1.5">
						<span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
							{`→ \${${d.outputVar}}`}
						</span>
					</div>
					<div className="flex items-center justify-between border-t px-3 py-1 opacity-0 transition-opacity group-hover:opacity-100">
						<span className="text-[10px] text-muted-foreground">
							click to edit
						</span>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								openSettings(id);
							}}
							className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
						>
							<ExternalLink className="h-3 w-3" />
							Full Settings
						</button>
					</div>
				</>
			)}

			{/* ── expanded inline edit view ── */}
			{isExpanded && fullNode && (
				// Stop click AND pointerDown from reaching ReactFlow.
				// click-stop: prevents onNodeClick from toggling expansion.
				// pointerDown-stop: prevents ReactFlow drag tracking from starting when
				// opening a Radix Select — without this, clicking a portal dropdown option
				// at a different screen position is interpreted as a node drag.
				// biome-ignore lint/a11y/useKeyWithClickEvents: intentional propagation guard, not interactive
				// biome-ignore lint/a11y/noStaticElementInteractions: intentional propagation guard
				<div
					onClick={(e) => e.stopPropagation()}
					onPointerDown={(e) => e.stopPropagation()}
				>
					<div className="flex flex-col gap-3 px-3 pt-3 pb-2">
						{/* per-type quick form */}
						<InlineNodeForm
							node={fullNode}
							enginesByType={enginesByType}
							onUpdate={onNodeUpdate}
						/>

						{/* ── per-node test run ── */}
						{!buildPixelPreview(fullNode).startsWith("//") &&
							(() => {
								const raw = buildPixelPreview(fullNode);
								const refs = extractVarRefs(raw);
								const unresolved = refs.filter(
									(v) => !nodeOutputs[v],
								);
								return (
									<div className="flex flex-col gap-2 rounded-md border border-dashed p-2">
										<div className="flex items-center justify-between">
											<span className="font-medium text-[11px]">
												Test Run
											</span>
											<Button
												size="sm"
												variant="outline"
												className="h-6 px-2 text-[11px]"
												onClick={(e) => {
													e.stopPropagation();
													handleRun();
												}}
												disabled={running}
											>
												{running ? (
													<Loader2 className="mr-1 h-3 w-3 animate-spin" />
												) : (
													<Play className="mr-1 h-3 w-3" />
												)}
												Run
											</Button>
										</div>

										{/* mock inputs for variables not yet resolved from prior runs */}
										{unresolved.length > 0 && (
											<div className="flex flex-col gap-1">
												<p className="text-[10px] text-muted-foreground">
													Mock values for unresolved
													variables:
												</p>
												{unresolved.map((v) => (
													<div
														key={v}
														className="flex items-center gap-1.5"
													>
														<code className="w-24 shrink-0 truncate font-mono text-[10px] text-muted-foreground">
															{`\${${v}}`}
														</code>
														<Input
															className="nodrag nopan h-6 flex-1 text-[11px]"
															placeholder="mock value…"
															value={
																mockValues[v] ??
																""
															}
															onChange={(e) =>
																setMockValues(
																	(prev) => ({
																		...prev,
																		[v]: e
																			.target
																			.value,
																	}),
																)
															}
														/>
													</div>
												))}
											</div>
										)}

										{/* output */}
										{runOutput !== null && (
											<pre className="max-h-36 overflow-auto whitespace-pre-wrap break-all rounded border bg-muted/50 p-1.5 font-mono text-[10px]">
												{runOutput}
											</pre>
										)}
									</div>
								);
							})()}

						{/* label + output var */}
						<div className="flex gap-2">
							<Field className="flex-1">
								<FieldLabel className="text-[11px]">
									Label
								</FieldLabel>
								<Input
									className="nodrag nopan h-7 text-xs"
									value={fullNode.label}
									onChange={(e) =>
										onNodeUpdate({
											...fullNode,
											label: e.target.value,
										})
									}
								/>
							</Field>
							<Field className="flex-1">
								<FieldLabel className="text-[11px]">
									Output Var
								</FieldLabel>
								<Input
									className="nodrag nopan h-7 font-mono text-xs"
									value={fullNode.outputVar}
									onChange={(e) =>
										onNodeUpdate({
											...fullNode,
											outputVar: e.target.value,
										})
									}
									placeholder="my_output"
								/>
							</Field>
						</div>
					</div>

					{/* footer */}
					<div className="flex items-center justify-between border-t px-3 py-1.5">
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								deleteNode(id);
							}}
							className="flex items-center gap-1 text-[10px] text-destructive hover:underline"
						>
							<Trash2 className="h-3 w-3" />
							Delete
						</button>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								openSettings(id);
							}}
							className="flex items-center gap-1 text-[10px] text-primary hover:underline"
						>
							Full Settings
							<ExternalLink className="h-3 w-3" />
						</button>
					</div>
				</div>
			)}

			{/* handles */}
			{!isTrigger && (
				<Handle
					type="target"
					position={Position.Left}
					className="!h-3 !w-3 !rounded-full !border-2 !border-background !bg-primary"
				/>
			)}
			<Handle
				type="source"
				position={Position.Right}
				className="!h-3 !w-3 !rounded-full !border-2 !border-background !bg-primary"
			/>
		</div>
	);
});

WorkflowNodeCard.displayName = "WorkflowNodeCard";
