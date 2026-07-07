import { Loader2, Play, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
	Separator,
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
	NodeConfig,
	StorageEngineConfig,
	TransformConfig,
	TriggerConfig,
	VectorEngineConfig,
	WorkflowNode,
} from "@/pages/workflow/workflow.types";
import { buildPixelPreview } from "../workflow-utils";

// ─── variable binding helper ──────────────────────────────────────────────────

function BoundInput({
	label,
	value,
	placeholder,
	onChange,
	upstreamVars,
	mono,
}: {
	label: string;
	value: string;
	placeholder?: string;
	onChange: (v: string) => void;
	upstreamVars: string[];
	mono?: boolean;
}) {
	return (
		<Field>
			<FieldLabel>{label}</FieldLabel>
			<div className="relative">
				{mono ? (
					<Textarea
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder={placeholder}
						className="font-mono text-xs"
						rows={4}
					/>
				) : (
					<Input
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder={placeholder}
						className="pr-8"
					/>
				)}
				{upstreamVars.length > 0 && !mono && (
					<div className="-translate-y-1/2 absolute top-1/2 right-1">
						<select
							className="h-6 w-6 cursor-pointer appearance-none rounded border border-border bg-muted px-0.5 text-[9px] text-muted-foreground"
							title="Insert variable"
							value=""
							onChange={(e) => {
								if (e.target.value) {
									onChange(`${value}\${${e.target.value}}`);
								}
							}}
						>
							<option value="">{"{}"}</option>
							{upstreamVars.map((v) => (
								<option key={v} value={v}>
									{v}
								</option>
							))}
						</select>
					</div>
				)}
			</div>
		</Field>
	);
}

function EngineSelect({
	label,
	value,
	engines,
	onChange,
}: {
	label: string;
	value: string;
	engines: EngineOption[];
	onChange: (v: string) => void;
}) {
	return (
		<Field>
			<FieldLabel>{label}</FieldLabel>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger>
					<SelectValue
						placeholder={`Select ${label.toLowerCase()}…`}
					/>
				</SelectTrigger>
				<SelectContent>
					{engines.map((e) => (
						<SelectItem key={e.engine_id} value={e.engine_id}>
							{e.engine_display_name ?? e.engine_name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</Field>
	);
}

// ─── per-node config forms ────────────────────────────────────────────────────

function TriggerForm({
	config,
	onChange,
}: {
	config: TriggerConfig;
	onChange: (c: TriggerConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<Field>
				<FieldLabel>Trigger Mode</FieldLabel>
				<Select
					value={config.mode}
					onValueChange={(v) =>
						onChange({
							...config,
							mode: v as TriggerConfig["mode"],
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="manual">Manual</SelectItem>
						<SelectItem value="schedule">
							Schedule (cron)
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			{config.mode === "schedule" && (
				<Field>
					<FieldLabel>Cron Expression</FieldLabel>
					<Input
						value={config.cronExpression}
						onChange={(e) =>
							onChange({
								...config,
								cronExpression: e.target.value,
							})
						}
						placeholder="0 0 6 * * ?"
						className="font-mono text-sm"
					/>
					<p className="mt-1 text-muted-foreground text-xs">
						Quartz format. E.g. daily at 6am:{" "}
						<code>0 0 6 * * ?</code>
					</p>
				</Field>
			)}
		</div>
	);
}

function DatabaseEngineForm({
	config,
	engines,
	upstreamVars,
	onChange,
}: {
	config: DatabaseEngineConfig;
	engines: EngineOption[];
	upstreamVars: string[];
	onChange: (c: DatabaseEngineConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<EngineSelect
				label="Database Engine"
				value={config.engineId}
				engines={engines}
				onChange={(v) => onChange({ ...config, engineId: v })}
			/>
			<Field>
				<FieldLabel>Operation</FieldLabel>
				<Select
					value={config.operation}
					onValueChange={(v) =>
						onChange({
							...config,
							operation: v as DatabaseEngineConfig["operation"],
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="query">Query (SELECT)</SelectItem>
						<SelectItem value="insert">Insert</SelectItem>
						<SelectItem value="update">Update</SelectItem>
						<SelectItem value="delete">Delete</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<BoundInput
				label="SQL / Pixel Expression"
				value={config.expression}
				placeholder="SELECT * FROM table WHERE id = '${id}'"
				onChange={(v) => onChange({ ...config, expression: v })}
				upstreamVars={upstreamVars}
				mono
			/>
			{config.operation === "query" && (
				<Field>
					<FieldLabel>Output Shape</FieldLabel>
					<Select
						value={config.outputShape}
						onValueChange={(v) =>
							onChange({
								...config,
								outputShape:
									v as DatabaseEngineConfig["outputShape"],
							})
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="rows">
								Rows (array of objects)
							</SelectItem>
							<SelectItem value="count">
								Count (number)
							</SelectItem>
							<SelectItem value="scalar">
								Scalar (single value)
							</SelectItem>
						</SelectContent>
					</Select>
				</Field>
			)}
		</div>
	);
}

function StorageEngineForm({
	config,
	engines,
	upstreamVars,
	onChange,
}: {
	config: StorageEngineConfig;
	engines: EngineOption[];
	upstreamVars: string[];
	onChange: (c: StorageEngineConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<EngineSelect
				label="Storage Engine"
				value={config.engineId}
				engines={engines}
				onChange={(v) => onChange({ ...config, engineId: v })}
			/>
			<Field>
				<FieldLabel>Operation</FieldLabel>
				<Select
					value={config.operation}
					onValueChange={(v) =>
						onChange({
							...config,
							operation: v as StorageEngineConfig["operation"],
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="list">List</SelectItem>
						<SelectItem value="read">Read (download)</SelectItem>
						<SelectItem value="put">Put (upload)</SelectItem>
						<SelectItem value="delete">Delete</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<BoundInput
				label="Path"
				value={config.path}
				placeholder="/documents/${folder}"
				onChange={(v) => onChange({ ...config, path: v })}
				upstreamVars={upstreamVars}
			/>
		</div>
	);
}

function VectorEngineForm({
	config,
	engines,
	upstreamVars,
	onChange,
}: {
	config: VectorEngineConfig;
	engines: EngineOption[];
	upstreamVars: string[];
	onChange: (c: VectorEngineConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<EngineSelect
				label="Vector Engine"
				value={config.engineId}
				engines={engines}
				onChange={(v) => onChange({ ...config, engineId: v })}
			/>
			<Field>
				<FieldLabel>Operation</FieldLabel>
				<Select
					value={config.operation}
					onValueChange={(v) =>
						onChange({
							...config,
							operation: v as VectorEngineConfig["operation"],
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="add">Add Documents</SelectItem>
						<SelectItem value="remove">Remove Documents</SelectItem>
						<SelectItem value="list">List Documents</SelectItem>
						<SelectItem value="query">
							Query (semantic search)
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<Separator />
			{config.operation === "query" ? (
				<>
					<BoundInput
						label="Search Query"
						value={config.searchQuery}
						placeholder="find documents about ${topic}"
						onChange={(v) =>
							onChange({ ...config, searchQuery: v })
						}
						upstreamVars={upstreamVars}
					/>
					<Field>
						<FieldLabel>Result Limit</FieldLabel>
						<Input
							type="number"
							min={1}
							value={config.limit || ""}
							onChange={(e) =>
								onChange({
									...config,
									limit: Number(e.target.value),
								})
							}
							placeholder="5"
						/>
					</Field>
				</>
			) : (
				<>
					<div className="grid grid-cols-2 gap-3">
						<Field>
							<FieldLabel>Chunk Size</FieldLabel>
							<Input
								type="number"
								min={0}
								value={config.chunkSize || ""}
								onChange={(e) =>
									onChange({
										...config,
										chunkSize: Number(e.target.value),
									})
								}
								placeholder="512"
							/>
						</Field>
						<Field>
							<FieldLabel>Overlap</FieldLabel>
							<Input
								type="number"
								min={0}
								value={config.chunkOverlap || ""}
								onChange={(e) =>
									onChange({
										...config,
										chunkOverlap: Number(e.target.value),
									})
								}
								placeholder="0"
							/>
						</Field>
					</div>
					<BoundInput
						label="Allowed Extensions"
						value={config.allowedExtensions}
						placeholder="pdf, docx, txt"
						onChange={(v) =>
							onChange({ ...config, allowedExtensions: v })
						}
						upstreamVars={upstreamVars}
					/>
					<BoundInput
						label="Metadata Template (JSON)"
						value={config.metadataTemplate}
						placeholder='{"id": "${item_id}"}'
						onChange={(v) =>
							onChange({ ...config, metadataTemplate: v })
						}
						upstreamVars={upstreamVars}
						mono
					/>
				</>
			)}
		</div>
	);
}

function ModelEngineForm({
	config,
	engines,
	upstreamVars,
	onChange,
}: {
	config: ModelEngineConfig;
	engines: EngineOption[];
	upstreamVars: string[];
	onChange: (c: ModelEngineConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<EngineSelect
				label="Model Engine"
				value={config.engineId}
				engines={engines}
				onChange={(v) => onChange({ ...config, engineId: v })}
			/>
			<BoundInput
				label="Prompt Template"
				value={config.promptTemplate}
				placeholder="Summarize: ${text}"
				onChange={(v) => onChange({ ...config, promptTemplate: v })}
				upstreamVars={upstreamVars}
				mono
			/>
		</div>
	);
}

function FunctionEngineForm({
	config,
	engines,
	upstreamVars,
	onChange,
}: {
	config: FunctionEngineConfig;
	engines: EngineOption[];
	upstreamVars: string[];
	onChange: (c: FunctionEngineConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<EngineSelect
				label="Function Engine"
				value={config.engineId}
				engines={engines}
				onChange={(v) => onChange({ ...config, engineId: v })}
			/>
			<BoundInput
				label="Parameters (JSON / expression)"
				value={config.paramsExpression}
				placeholder='{"input": "${files}"}'
				onChange={(v) => onChange({ ...config, paramsExpression: v })}
				upstreamVars={upstreamVars}
				mono
			/>
		</div>
	);
}

function AppNodeForm({
	config,
	upstreamVars,
	onChange,
}: {
	config: AppNodeConfig;
	upstreamVars: string[];
	onChange: (c: AppNodeConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<BoundInput
				label="App / Project ID"
				value={config.appId}
				placeholder="${config.MY_APP_ID}"
				onChange={(v) => onChange({ ...config, appId: v })}
				upstreamVars={upstreamVars}
			/>
			<BoundInput
				label="Pixel Expression"
				value={config.pixelExpression}
				placeholder="RunSomeReactor(input='${data}')"
				onChange={(v) => onChange({ ...config, pixelExpression: v })}
				upstreamVars={upstreamVars}
				mono
			/>
		</div>
	);
}

function CustomPixelForm({
	config,
	upstreamVars,
	onChange,
}: {
	config: CustomPixelConfig;
	upstreamVars: string[];
	onChange: (c: CustomPixelConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<Field>
				<FieldLabel>Pixel Expression</FieldLabel>
				<p className="mb-1 text-muted-foreground text-xs">
					Use{" "}
					<code className="rounded bg-muted px-1">
						{"${varName}"}
					</code>{" "}
					to reference upstream outputs or{" "}
					<code className="rounded bg-muted px-1">
						{"${config.KEY}"}
					</code>{" "}
					for SMSS config.
				</p>
				<Textarea
					value={config.pixel}
					onChange={(e) => onChange({ pixel: e.target.value })}
					placeholder="SyncEsrMetadata(apiUrl=&quot;${config.MIRTH_API_URL}&quot;)"
					className="font-mono text-xs"
					rows={6}
				/>
				{upstreamVars.length > 0 && (
					<div className="mt-1 flex flex-wrap gap-1">
						{upstreamVars.map((v) => (
							<button
								key={v}
								type="button"
								className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-accent"
								onClick={() =>
									onChange({
										pixel: `${config.pixel}\${${v}}`,
									})
								}
							>
								{`\${${v}}`}
							</button>
						))}
					</div>
				)}
			</Field>
		</div>
	);
}

function FanOutForm({
	config,
	upstreamVars,
	onChange,
}: {
	config: FanOutConfig;
	upstreamVars: string[];
	onChange: (c: FanOutConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<BoundInput
				label="Input Array Variable"
				value={config.inputVar}
				placeholder="esr_list"
				onChange={(v) => onChange({ ...config, inputVar: v })}
				upstreamVars={upstreamVars}
			/>
			<Field>
				<FieldLabel>Item Alias</FieldLabel>
				<Input
					value={config.itemAlias}
					onChange={(e) =>
						onChange({ ...config, itemAlias: e.target.value })
					}
					placeholder="item"
				/>
				<p className="mt-1 text-muted-foreground text-xs">
					Name for each array element inside the sub-graph.
				</p>
			</Field>
			<BoundInput
				label="Parallelism"
				value={config.parallelism}
				placeholder="16 or ${config.THREAD_POOL_SIZE}"
				onChange={(v) => onChange({ ...config, parallelism: v })}
				upstreamVars={upstreamVars}
			/>
			<div className="rounded-md border border-border border-dashed p-3 text-center text-muted-foreground text-xs">
				Sub-graph editing opens in the canvas. Double-click the Fan-out
				node on the canvas to expand.
			</div>
		</div>
	);
}

function ConditionalForm({
	config,
	upstreamVars,
	onChange,
}: {
	config: ConditionalConfig;
	upstreamVars: string[];
	onChange: (c: ConditionalConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<BoundInput
				label="Condition Expression"
				value={config.condition}
				placeholder="${monthly_engine} != null"
				onChange={(v) => onChange({ ...config, condition: v })}
				upstreamVars={upstreamVars}
				mono
			/>
			<div className="rounded-md border border-border border-dashed p-3 text-center text-muted-foreground text-xs">
				True / False sub-graphs open in the canvas. Double-click the
				Conditional node to expand.
			</div>
		</div>
	);
}

function TransformForm({
	config,
	upstreamVars,
	onChange,
}: {
	config: TransformConfig;
	upstreamVars: string[];
	onChange: (c: TransformConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<Field>
				<FieldLabel>Operation</FieldLabel>
				<Select
					value={config.operation}
					onValueChange={(v) =>
						onChange({
							...config,
							operation: v as TransformConfig["operation"],
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="map">
							Map (transform each item)
						</SelectItem>
						<SelectItem value="filter">
							Filter (keep matching items)
						</SelectItem>
						<SelectItem value="reduce">
							Reduce (collapse to single value)
						</SelectItem>
						<SelectItem value="flatten">
							Flatten (merge nested arrays)
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<BoundInput
				label="Expression (per item = ${item})"
				value={config.expression}
				placeholder="${item.name}.toLowerCase()"
				onChange={(v) => onChange({ ...config, expression: v })}
				upstreamVars={[...upstreamVars, "item"]}
				mono
			/>
		</div>
	);
}

// ─── main settings panel ──────────────────────────────────────────────────────

interface NodeSettingsPanelProps {
	node: WorkflowNode;
	upstreamVars: string[];
	enginesByType: Record<string, EngineOption[]>;
	onUpdate: (updated: WorkflowNode) => void;
	onClose: () => void;
}

export function NodeSettingsPanel({
	node,
	upstreamVars,
	enginesByType,
	onUpdate,
	onClose,
}: NodeSettingsPanelProps) {
	const { monolithStore } = useRootStore();
	const [testing, setTesting] = useState(false);
	const [testPixel, setTestPixel] = useState(() => buildPixelPreview(node));
	const [testOutput, setTestOutput] = useState<string | null>(null);

	// Auto-sync testPixel whenever the node's config changes.
	// The user can still manually edit the textarea; the next config
	// change will re-sync it (same UX as most formula editors).
	useEffect(() => {
		setTestPixel(buildPixelPreview(node));
		setTestOutput(null);
	}, [node]);

	const pixelPreview = buildPixelPreview(node);

	const runTest = async () => {
		if (!testPixel.trim() || testPixel.startsWith("//")) return;
		setTesting(true);
		setTestOutput(null);
		try {
			const result = await monolithStore.runQuery(testPixel);
			const output = result.pixelReturn?.[0]?.output;
			setTestOutput(JSON.stringify(output, null, 2));
		} catch (err) {
			setTestOutput(`Error: ${(err as Error).message}`);
		} finally {
			setTesting(false);
		}
	};

	const update = useCallback(
		(config: NodeConfig) => onUpdate({ ...node, config }),
		[node, onUpdate],
	);

	const updateLabel = (label: string) => onUpdate({ ...node, label });
	const updateOutputVar = (outputVar: string) =>
		onUpdate({ ...node, outputVar });

	return (
		<div className="flex h-full flex-col overflow-hidden border-l bg-background">
			{/* header */}
			<div className="flex items-center justify-between border-b px-4 py-3">
				<h3 className="font-semibold text-sm">Node Settings</h3>
				<Button variant="ghost" size="icon-sm" onClick={onClose}>
					<X className="h-4 w-4" />
				</Button>
			</div>

			<div className="flex-1 overflow-y-auto px-4 py-4">
				{/* common fields */}
				<div className="mb-4 flex flex-col gap-3">
					<Field>
						<FieldLabel>Label</FieldLabel>
						<Input
							value={node.label}
							onChange={(e) => updateLabel(e.target.value)}
						/>
					</Field>
					<Field>
						<FieldLabel>Output Variable Name</FieldLabel>
						<Input
							value={node.outputVar}
							onChange={(e) => updateOutputVar(e.target.value)}
							className="font-mono text-sm"
							placeholder="my_output"
						/>
						<p className="mt-1 text-muted-foreground text-xs">
							Downstream nodes reference this as{" "}
							<code className="rounded bg-muted px-1">
								{`\${${node.outputVar}}`}
							</code>
						</p>
					</Field>
				</div>

				<Separator className="mb-4" />

				{/* per-type form */}
				{node.type === "trigger" && (
					<TriggerForm
						config={node.config as TriggerConfig}
						onChange={update}
					/>
				)}
				{node.type === "database-engine" && (
					<DatabaseEngineForm
						config={node.config as DatabaseEngineConfig}
						engines={enginesByType.DATABASE ?? []}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "storage-engine" && (
					<StorageEngineForm
						config={node.config as StorageEngineConfig}
						engines={enginesByType.STORAGE ?? []}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "vector-engine" && (
					<VectorEngineForm
						config={node.config as VectorEngineConfig}
						engines={enginesByType.VECTOR ?? []}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "model-engine" && (
					<ModelEngineForm
						config={node.config as ModelEngineConfig}
						engines={enginesByType.MODEL ?? []}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "function-engine" && (
					<FunctionEngineForm
						config={node.config as FunctionEngineConfig}
						engines={enginesByType.FUNCTION ?? []}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "app" && (
					<AppNodeForm
						config={node.config as AppNodeConfig}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "custom-pixel" && (
					<CustomPixelForm
						config={node.config as CustomPixelConfig}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "fan-out" && (
					<FanOutForm
						config={node.config as FanOutConfig}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "conditional" && (
					<ConditionalForm
						config={node.config as ConditionalConfig}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "transform" && (
					<TransformForm
						config={node.config as TransformConfig}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}

				<Separator className="my-4" />
				<div className="flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<span className="font-medium text-sm">Test Node</span>
						<Button
							size="sm"
							variant="outline"
							onClick={runTest}
							disabled={testing || testPixel.startsWith("//")}
						>
							{testing ? (
								<Loader2 className="mr-1 h-3 w-3 animate-spin" />
							) : (
								<Play className="mr-1 h-3 w-3" />
							)}
							Run
						</Button>
					</div>
					<div className="relative">
						<Textarea
							value={testPixel}
							onChange={(e) => setTestPixel(e.target.value)}
							className="font-mono text-[11px] leading-relaxed"
							rows={4}
							placeholder="Pixel expression to test…"
						/>
						<button
							type="button"
							className="absolute top-1 right-1 rounded px-1 py-0.5 text-[9px] text-muted-foreground hover:bg-muted"
							onClick={() => setTestPixel(pixelPreview)}
							title="Reset to node pixel"
						>
							reset
						</button>
					</div>
					{testOutput !== null && (
						<div className="rounded-md border bg-muted/50 p-2">
							<pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px]">
								{testOutput}
							</pre>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
