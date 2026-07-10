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
import { ConditionalStepForm } from "../../workflow-form-editor/forms/conditional-form";
import { EngineSelect } from "../../workflow-form-editor/forms/shared";
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
				triggerClassName=""
				labelClassName=""
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
						<SelectItem value="write">
							Write (INSERT/UPDATE/DELETE)
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<BoundInput
				label="SQL Expression"
				value={config.expression}
				placeholder="SELECT * FROM table WHERE id = '${id}'"
				onChange={(v) => onChange({ ...config, expression: v })}
				upstreamVars={upstreamVars}
				mono
			/>
			{config.operation === "query" && (
				<Field>
					<FieldLabel>Row Limit</FieldLabel>
					<Input
						type="number"
						min={1}
						value={config.limit ?? 50}
						onChange={(e) =>
							onChange({
								...config,
								limit: Number(e.target.value),
							})
						}
						placeholder="50"
					/>
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
				triggerClassName=""
				labelClassName=""
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
						<SelectItem value="download">Download</SelectItem>
						<SelectItem value="upload">Upload</SelectItem>
						<SelectItem value="delete">Delete</SelectItem>
						<SelectItem value="read-base64">
							Read as Base64
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<BoundInput
				label="Storage Path"
				value={config.storagePath}
				placeholder="/documents/${folder}"
				onChange={(v) => onChange({ ...config, storagePath: v })}
				upstreamVars={upstreamVars}
			/>
			{(config.operation === "download" ||
				config.operation === "upload") && (
				<BoundInput
					label="Local File Path"
					value={config.filePath}
					placeholder="/tmp/output.csv"
					onChange={(v) => onChange({ ...config, filePath: v })}
					upstreamVars={upstreamVars}
				/>
			)}
			{config.operation === "upload" && (
				<BoundInput
					label="Metadata (JSON, optional)"
					value={config.metadata}
					placeholder='{"key": "value"}'
					onChange={(v) => onChange({ ...config, metadata: v })}
					upstreamVars={upstreamVars}
					mono
				/>
			)}
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
				triggerClassName=""
				labelClassName=""
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
						<SelectItem value="search">
							Search (semantic)
						</SelectItem>
						<SelectItem value="add-file">Add File</SelectItem>
						<SelectItem value="add-csv">Add CSV</SelectItem>
						<SelectItem value="list">List Documents</SelectItem>
						<SelectItem value="delete">Delete Documents</SelectItem>
						<SelectItem value="download">
							Download Document
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			{config.operation === "search" && (
				<>
					<BoundInput
						label="Search Query"
						value={config.command}
						placeholder="find documents about ${topic}"
						onChange={(v) => onChange({ ...config, command: v })}
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
					<BoundInput
						label="Filters (JSON, optional)"
						value={config.filters}
						placeholder='{"category": "reports"}'
						onChange={(v) => onChange({ ...config, filters: v })}
						upstreamVars={upstreamVars}
						mono
					/>
				</>
			)}
			{config.operation === "add-file" && (
				<>
					<BoundInput
						label="File Path"
						value={config.filePath}
						placeholder="/path/to/file.pdf"
						onChange={(v) => onChange({ ...config, filePath: v })}
						upstreamVars={upstreamVars}
					/>
					<BoundInput
						label="Source (optional)"
						value={config.source}
						placeholder="internal-docs"
						onChange={(v) => onChange({ ...config, source: v })}
						upstreamVars={upstreamVars}
					/>
					<BoundInput
						label="Space (optional)"
						value={config.space}
						placeholder="finance"
						onChange={(v) => onChange({ ...config, space: v })}
						upstreamVars={upstreamVars}
					/>
				</>
			)}
			{config.operation === "add-csv" && (
				<>
					<BoundInput
						label="File Paths (comma-separated)"
						value={config.filePaths}
						placeholder="/data/embeddings.csv"
						onChange={(v) => onChange({ ...config, filePaths: v })}
						upstreamVars={upstreamVars}
					/>
					<BoundInput
						label="Param Values (JSON, optional)"
						value={config.paramValues}
						placeholder='{"delimiter": ","}'
						onChange={(v) =>
							onChange({ ...config, paramValues: v })
						}
						upstreamVars={upstreamVars}
						mono
					/>
				</>
			)}
			{(config.operation === "delete" ||
				config.operation === "download") && (
				<BoundInput
					label="File Names (comma-separated)"
					value={config.fileNames}
					placeholder="doc1.pdf, doc2.docx"
					onChange={(v) => onChange({ ...config, fileNames: v })}
					upstreamVars={upstreamVars}
				/>
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
				triggerClassName=""
				labelClassName=""
			/>
			<Field>
				<FieldLabel>Operation</FieldLabel>
				<Select
					value={config.operation}
					onValueChange={(v) =>
						onChange({
							...config,
							operation: v as ModelEngineConfig["operation"],
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="llm">LLM (chat)</SelectItem>
						<SelectItem value="embeddings">Embeddings</SelectItem>
						<SelectItem value="vision">Vision</SelectItem>
						<SelectItem value="ner">NER</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			{config.operation === "llm" && (
				<>
					<BoundInput
						label="Prompt"
						value={config.command}
						placeholder="Summarize: ${text}"
						onChange={(v) => onChange({ ...config, command: v })}
						upstreamVars={upstreamVars}
						mono
					/>
					<BoundInput
						label="Context (optional)"
						value={config.context}
						placeholder="You are a helpful assistant."
						onChange={(v) => onChange({ ...config, context: v })}
						upstreamVars={upstreamVars}
						mono
					/>
					<BoundInput
						label="Param Values (JSON, optional)"
						value={config.paramValues}
						placeholder='{"temperature": 0.7, "maxTokens": 1000}'
						onChange={(v) =>
							onChange({ ...config, paramValues: v })
						}
						upstreamVars={upstreamVars}
						mono
					/>
				</>
			)}
			{config.operation === "embeddings" && (
				<BoundInput
					label="Values"
					value={config.values}
					placeholder="${text_to_embed}"
					onChange={(v) => onChange({ ...config, values: v })}
					upstreamVars={upstreamVars}
				/>
			)}
			{config.operation === "vision" && (
				<>
					<BoundInput
						label="Command"
						value={config.command}
						placeholder="Describe what you see in this image."
						onChange={(v) => onChange({ ...config, command: v })}
						upstreamVars={upstreamVars}
						mono
					/>
					<BoundInput
						label="Image URL / Path"
						value={config.image}
						placeholder="${image_url}"
						onChange={(v) => onChange({ ...config, image: v })}
						upstreamVars={upstreamVars}
					/>
				</>
			)}
			{config.operation === "ner" && (
				<>
					<BoundInput
						label="Prompt"
						value={config.prompt}
						placeholder="Extract entities from: ${text}"
						onChange={(v) => onChange({ ...config, prompt: v })}
						upstreamVars={upstreamVars}
						mono
					/>
					<BoundInput
						label="Entities (JSON)"
						value={config.entities}
						placeholder='["PERSON", "ORG", "DATE"]'
						onChange={(v) => onChange({ ...config, entities: v })}
						upstreamVars={upstreamVars}
						mono
					/>
				</>
			)}
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
				triggerClassName=""
				labelClassName=""
			/>
			<Field>
				<FieldLabel>Operation</FieldLabel>
				<Select
					value={config.operation}
					onValueChange={(v) =>
						onChange({
							...config,
							operation: v as FunctionEngineConfig["operation"],
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="execute">Execute</SelectItem>
						<SelectItem value="streaming">Streaming</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<BoundInput
				label="Parameters (JSON)"
				value={config.params}
				placeholder='{"input": "${files}"}'
				onChange={(v) => onChange({ ...config, params: v })}
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
				value={config.pixel}
				placeholder="RunSomeReactor(input='${data}')"
				onChange={(v) => onChange({ ...config, pixel: v })}
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
						{/* biome-ignore lint/suspicious/noTemplateCurlyInString: literal example */}
						{"${varName}"}
					</code>{" "}
					to reference upstream outputs or{" "}
					<code className="rounded bg-muted px-1">
						{/* biome-ignore lint/suspicious/noTemplateCurlyInString: literal example */}
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
						<SelectItem value="convert-to-objects">
							Convert to Objects
						</SelectItem>
						<SelectItem value="extract-field">
							Extract Field
						</SelectItem>
						<SelectItem value="map">
							Map (transform each item)
						</SelectItem>
						<SelectItem value="filter">
							Filter (keep matching items)
						</SelectItem>
						<SelectItem value="flatten">
							Flatten (merge nested arrays)
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<BoundInput
				label="Input Variable"
				value={config.inputVar}
				placeholder="source_data"
				onChange={(v) => onChange({ ...config, inputVar: v })}
				upstreamVars={upstreamVars}
			/>
			<BoundInput
				label="Expression"
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
					<ConditionalStepForm
						step={node}
						enginesByType={enginesByType}
						projects={[]}
						upstreamVars={upstreamVars}
						onUpdate={(updated) =>
							update(updated.config as ConditionalConfig)
						}
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
