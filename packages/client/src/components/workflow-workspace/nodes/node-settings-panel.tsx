import {
	Check,
	ChevronDown,
	ChevronRight,
	Copy,
	Database,
	Info,
	Loader2,
	Play,
	Plus,
	RefreshCw,
	Search,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Env } from "@semoss/sdk";
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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useDatabaseStructure, useRootStore } from "@/hooks";
import type {
	ConditionalConfig,
	CustomPixelConfig,
	DatabaseEngineConfig,
	EmailConfig,
	EngineOption,
	ForEachConfig,
	FunctionEngineConfig,
	HttpRequestConfig,
	ModelEngineConfig,
	NodeConfig,
	NotificationConfig,
	OutputTransform,
	ParallelConfig,
	ProjectOption,
	RetryConfig,
	SetVariableConfig,
	StorageEngineConfig,
	SwitchConfig,
	TriggerConfig,
	TriggerMode,
	TryCatchConfig,
	VectorEngineConfig,
	WaitConfig,
	WhileLoopConfig,
	WorkflowNode,
} from "@/pages/workflow/workflow.types";
import { ConditionalStepForm } from "../../workflow-form-editor/forms/conditional-form";
import { EngineSelect } from "../../workflow-form-editor/forms/shared";
import { SubWorkflowStepForm } from "../../workflow-form-editor/forms/sub-workflow-form";
import { TransformStepForm } from "../../workflow-form-editor/forms/transform-form";
import {
	applyOutputTransform,
	buildPixelPreview,
	extractVarRefs,
	isNodeReady,
	substituteVars,
	TRANSFORM_ENABLED,
	TRANSFORM_MODES,
} from "../workflow-utils";
import { useWorkflowWorkspaceContext } from "../workflow-workspace-context";

/** Nodes where outputVar is hidden — they don't produce a meaningful downstream value. */
const NO_OUTPUT_VAR_TYPES = new Set(["trigger", "wait", "set-variable"]);

/**
 * Nodes that cannot be tested in isolation — either they run directly in the
 * workflow engine (no pixel reactor) or they are container/flow-control nodes
 * that execute sub-graphs only as part of a full run.
 *
 * Testable via pixel: database-engine, model-engine, vector-engine,
 * storage-engine, function-engine, custom-pixel, email, sub-workflow.
 */
const NO_PIXEL_TEST_TYPES = new Set([
	"http-request",
	"notification",
	"for-each",
	"while-loop",
	"try-catch",
	"conditional",
	"switch",
	"retry",
	"parallel",
	"wait",
	"set-variable",
	"transform",
]);

/** Description shown below the Output Variable field for non-obvious node types. */
function outputVarHint(type: string): string {
	switch (type) {
		case "for-each":
			return "Contains {processed, succeeded, failed, totalRows}. Per-row results are only accessible within the loop body.";
		case "parallel":
			return "Contains a JSON array of each branch's output, in order.";
		case "try-catch":
		case "conditional":
			return "Contains the last executed node's output from whichever branch ran.";
		case "while-loop":
			return "Contains the last node's output from the final iteration.";
		case "retry":
			return "Contains {attempts, succeeded}. For the actual computed result, reference an inner node's output variable.";
		case "switch":
			return "Contains {matched, switchValue, output} — the matched case label and its branch's last output.";
		default:
			return "";
	}
}

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
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [partialStart, setPartialStart] = useState(-1);

	const detect = (val: string, cursor: number) => {
		if (!upstreamVars.length) return;
		const before = val.slice(0, cursor);
		const lastOpen = before.lastIndexOf("${");
		if (lastOpen === -1 || before.slice(lastOpen + 2).includes("}")) {
			setSuggestions([]);
			return;
		}
		const filter = before.slice(lastOpen + 2).toLowerCase();
		setPartialStart(lastOpen);
		setSuggestions(
			upstreamVars.filter((v) => v.toLowerCase().includes(filter)),
		);
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		onChange(e.target.value);
		detect(
			e.target.value,
			e.target.selectionStart ?? e.target.value.length,
		);
	};

	const handleKeyUp = (
		e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		if (e.key === "Escape") {
			setSuggestions([]);
			return;
		}
		const el = e.currentTarget;
		detect(el.value, el.selectionStart ?? el.value.length);
	};

	const handleBlur = () => {
		closeTimer.current = setTimeout(() => setSuggestions([]), 150);
	};

	const handleFocus = () => {
		if (closeTimer.current) clearTimeout(closeTimer.current);
	};

	const insertVar = (v: string) => {
		const el = (mono ? textareaRef.current : inputRef.current) as
			| HTMLInputElement
			| HTMLTextAreaElement
			| null;
		if (!el || partialStart === -1) return;
		const cursor = el.selectionStart ?? value.length;
		const inserted = `\${${v}}`;
		const newVal =
			value.slice(0, partialStart) + inserted + value.slice(cursor);
		onChange(newVal);
		setSuggestions([]);
		const newCursor = partialStart + inserted.length;
		requestAnimationFrame(() => {
			el.focus();
			el.setSelectionRange(newCursor, newCursor);
		});
	};

	const sharedProps = {
		value,
		onChange: handleChange,
		onKeyUp: handleKeyUp,
		onBlur: handleBlur,
		onFocus: handleFocus,
		placeholder,
	};

	return (
		<Field>
			<FieldLabel>{label}</FieldLabel>
			<div className="relative">
				{mono ? (
					<Textarea
						ref={textareaRef}
						{...sharedProps}
						className="font-mono text-xs"
						rows={4}
					/>
				) : (
					<Input ref={inputRef} {...sharedProps} />
				)}
				{suggestions.length > 0 && (
					<div className="absolute top-full right-0 left-0 z-50 mt-0.5 max-h-40 overflow-y-auto rounded-md border bg-popover shadow-md">
						{suggestions.map((v) => (
							<button
								key={v}
								type="button"
								onMouseDown={(e) => {
									e.preventDefault(); // keep focus, prevent blur closing dropdown
									insertVar(v);
								}}
								className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-xs hover:bg-accent hover:text-accent-foreground"
							>
								<span className="text-[10px] text-muted-foreground">
									{/* biome-ignore lint/suspicious/noTemplateCurlyInString: intentional display of ${} syntax */}
									{"${}"}
								</span>
								{v}
							</button>
						))}
					</div>
				)}
			</div>
		</Field>
	);
}

// ─── smart output preview ─────────────────────────────────────────────────────

function OutputPreview({ value }: { value: string }) {
	const parsed = (() => {
		try {
			return JSON.parse(value);
		} catch {
			return null;
		}
	})();

	// Array of objects → table
	if (
		Array.isArray(parsed) &&
		parsed.length > 0 &&
		typeof parsed[0] === "object" &&
		parsed[0] !== null
	) {
		const keys = Object.keys(parsed[0] as object);
		return (
			<div className="max-h-64 overflow-auto rounded border text-[11px]">
				<table className="w-full border-collapse">
					<thead>
						<tr className="sticky top-0 border-b bg-muted/50">
							{keys.map((k) => (
								<th
									key={k}
									className="whitespace-nowrap px-2 py-1.5 text-left font-semibold text-foreground"
								>
									{k}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{(parsed as Record<string, unknown>[]).map((row, i) => (
							<tr
								key={JSON.stringify(row) || i}
								className="border-muted/40 border-b last:border-0"
							>
								{keys.map((k) => (
									<td
										key={k}
										className="max-w-[200px] truncate px-2 py-1 text-foreground"
										title={
											row[k] != null ? String(row[k]) : ""
										}
									>
										{row[k] != null ? String(row[k]) : "—"}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	}

	// LLM / markdown text
	if (
		typeof parsed === "string" &&
		(value.includes("**") || value.includes("\n#") || value.includes("\n-"))
	) {
		return (
			<pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words font-sans text-[11px] text-foreground">
				{value}
			</pre>
		);
	}

	// Default: raw JSON / text
	return (
		<pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px]">
			{value}
		</pre>
	);
}

// ─── per-node output transform section ───────────────────────────────────────

function OutputTransformSection({
	node,
	onUpdate,
}: {
	node: WorkflowNode;
	onUpdate: (n: WorkflowNode) => void;
}) {
	const t = node.outputTransform;
	const set = (patch: Partial<OutputTransform> | undefined) =>
		onUpdate({
			...node,
			outputTransform:
				patch === undefined
					? undefined
					: { mode: "raw", ...t, ...patch },
		});

	return (
		<details className="group rounded-md border border-border">
			<summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-muted-foreground text-xs hover:text-foreground">
				<span className="flex items-center gap-1.5">
					Output Transform
					{t && t.mode !== "raw" && (
						<span className="rounded bg-primary/10 px-1.5 py-0.5 font-medium text-[10px] text-primary">
							{
								TRANSFORM_MODES.find((m) => m.value === t.mode)
									?.label
							}
						</span>
					)}
				</span>
				<span className="text-[10px]">▸</span>
			</summary>
			<div className="flex flex-col gap-3 border-border border-t p-3">
				<p className="text-[10px] text-muted-foreground">
					Reshape the raw output before it's stored in the variable.
					Applied in both test runs and full workflow runs.
				</p>
				<Field>
					<FieldLabel>Mode</FieldLabel>
					<Select
						value={t?.mode ?? "raw"}
						onValueChange={(v) =>
							set(
								v === "raw"
									? undefined
									: { mode: v as OutputTransform["mode"] },
							)
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{TRANSFORM_MODES.map((m) => (
								<SelectItem key={m.value} value={m.value}>
									{m.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
				{t?.mode === "column" && (
					<Field>
						<FieldLabel>Column Name</FieldLabel>
						<Input
							value={t.column ?? ""}
							onChange={(e) => set({ column: e.target.value })}
							placeholder="column_name"
							className="font-mono text-xs"
						/>
					</Field>
				)}
				{t?.mode === "jsonpath" && (
					<Field>
						<FieldLabel>Path</FieldLabel>
						<Input
							value={t.path ?? ""}
							onChange={(e) => set({ path: e.target.value })}
							placeholder="data.results"
							className="font-mono text-xs"
						/>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Dot-notation path, e.g. <code>data.results</code> or{" "}
							<code>$.items.0.name</code>
						</p>
					</Field>
				)}
			</div>
		</details>
	);
}

// ─── per-node config forms ────────────────────────────────────────────────────

function CopyButton({ value, label }: { value: string; label?: string }) {
	const [copied, setCopied] = useState(false);
	return (
		<button
			type="button"
			onClick={() => {
				navigator.clipboard.writeText(value);
				setCopied(true);
				setTimeout(() => setCopied(false), 1500);
			}}
			className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
		>
			{copied ? (
				<Check className="h-3 w-3 text-emerald-500" />
			) : (
				<Copy className="h-3 w-3" />
			)}
			{label ?? "Copy"}
		</button>
	);
}

const TRIGGER_MODE_OPTIONS: {
	value: TriggerMode;
	label: string;
	description: string;
}[] = [
	{
		value: "manual",
		label: "Manual",
		description: "Run manually via the UI or pixel call",
	},
	{
		value: "schedule",
		label: "Scheduled",
		description: "Run on a Quartz cron expression",
	},
	{
		value: "webhook",
		label: "Webhook",
		description: "Run via an HTTP POST with a secret",
	},
	{
		value: "storage-poll",
		label: "Storage Watch",
		description: "Run when new files appear in a storage path",
	},
	{
		value: "db-poll",
		label: "Database Watch",
		description: "Run when a query result changes",
	},
];

function TriggerForm({
	config,
	appId,
	engines,
	onChange,
	onScheduleActivate,
	onScheduleDeactivate,
	onGenerateWebhookSecret,
}: {
	config: TriggerConfig;
	appId: string;
	engines: Record<string, EngineOption[]>;
	onChange: (c: TriggerConfig) => void;
	onScheduleActivate: (
		cron: string,
		timezone: string,
		recipe: string,
	) => Promise<string | null>;
	onScheduleDeactivate: (jobId: string) => Promise<void>;
	onGenerateWebhookSecret: () => Promise<string | null>;
}) {
	const [activatingSchedule, setActivatingSchedule] = useState(false);
	const [generatingSecret, setGeneratingSecret] = useState(false);
	const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
	const [pollActivating, setPollActivating] = useState(false);

	const pixelCall = `TriggerWorkflow(project=["${appId}"])`;
	const webhookUrl = `${window.location.origin}${Env.MODULE}/api/workflow/${appId}/trigger`;

	const activateSchedule = async () => {
		if (!config.cronExpression.trim()) return;
		setActivatingSchedule(true);
		try {
			// Remove existing job first — "Apply changes" is an update, not a second registration
			if (config.quartzJobId) {
				await onScheduleDeactivate(config.quartzJobId);
			}
			const recipe = `TriggerWorkflow(project=["${appId}"])`;
			const jobId = await onScheduleActivate(
				config.cronExpression,
				config.cronTimezone ?? "UTC",
				recipe,
			);
			if (jobId) onChange({ ...config, quartzJobId: jobId });
		} finally {
			setActivatingSchedule(false);
		}
	};

	const deactivateSchedule = async () => {
		if (!config.quartzJobId) return;
		setActivatingSchedule(true);
		try {
			await onScheduleDeactivate(config.quartzJobId);
			onChange({ ...config, quartzJobId: undefined });
		} finally {
			setActivatingSchedule(false);
		}
	};

	const generateSecret = async () => {
		setGeneratingSecret(true);
		try {
			const secret = await onGenerateWebhookSecret();
			if (secret) {
				setRevealedSecret(secret);
				onChange({ ...config, webhookSecret: secret });
			}
		} finally {
			setGeneratingSecret(false);
		}
	};

	const activatePoll = async (pollType: "storage-poll" | "db-poll") => {
		const intervalCron =
			pollType === "storage-poll"
				? config.storagePollIntervalCron
				: config.dbPollIntervalCron;
		if (!intervalCron?.trim()) return;
		setPollActivating(true);
		try {
			// Remove existing poll job first before registering updated one
			const existingJobId =
				pollType === "storage-poll"
					? config.storagePollJobId
					: config.dbPollJobId;
			if (existingJobId) {
				await onScheduleDeactivate(existingJobId);
			}
			const recipe = `CheckWorkflowPollTrigger(project=["${appId}"], type=["${pollType}"])`;
			const jobId = await onScheduleActivate(intervalCron, "UTC", recipe);
			if (jobId) {
				if (pollType === "storage-poll")
					onChange({ ...config, storagePollJobId: jobId });
				else onChange({ ...config, dbPollJobId: jobId });
			}
		} finally {
			setPollActivating(false);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			{/* Mode selector */}
			<Field>
				<FieldLabel>Trigger Mode</FieldLabel>
				<Select
					value={config.mode}
					onValueChange={(v) =>
						onChange({ ...config, mode: v as TriggerMode })
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{TRIGGER_MODE_OPTIONS.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								<span className="flex flex-col gap-0.5">
									<span>{opt.label}</span>
									<span className="text-[10px] text-muted-foreground">
										{opt.description}
									</span>
								</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Field>

			{/* Manual — pixel call reference */}
			{config.mode === "manual" && (
				<div className="rounded-md border border-border bg-muted/30 p-3">
					<p className="mb-1.5 font-medium text-xs">
						Pixel call (from any app or custom pixel node)
					</p>
					<div className="flex items-center gap-2">
						<code className="flex-1 break-all rounded bg-muted px-2 py-1 font-mono text-[10px]">
							{pixelCall}
						</code>
						<CopyButton value={pixelCall} />
					</div>
					<p className="mt-1.5 text-[10px] text-muted-foreground">
						Use this in a button's pixel expression or any app
						insight to trigger this workflow on demand.
					</p>
				</div>
			)}

			{/* Schedule */}
			{config.mode === "schedule" && (
				<>
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
						<p className="mt-1 text-[10px] text-muted-foreground">
							Quartz format. Daily at 6 AM:{" "}
							<code>0 0 6 * * ?</code> · Weekdays 9 AM:{" "}
							<code>0 0 9 ? * MON-FRI</code>
						</p>
					</Field>
					<Field>
						<FieldLabel>Timezone</FieldLabel>
						<Input
							value={config.cronTimezone ?? "UTC"}
							onChange={(e) =>
								onChange({
									...config,
									cronTimezone: e.target.value,
								})
							}
							placeholder="UTC"
						/>
					</Field>

					{/* enable / disable toggle */}
					<div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
						<div className="flex flex-col gap-0.5">
							<span className="font-medium text-sm">
								{config.quartzJobId ? "Enabled" : "Disabled"}
							</span>
							<span className="text-[10px] text-muted-foreground">
								{config.quartzJobId
									? `Job ${config.quartzJobId.slice(0, 8)}…`
									: "Schedule will not run"}
							</span>
						</div>
						{activatingSchedule ? (
							<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						) : (
							<button
								type="button"
								role="switch"
								aria-checked={!!config.quartzJobId}
								onClick={
									config.quartzJobId
										? deactivateSchedule
										: activateSchedule
								}
								disabled={
									activatingSchedule ||
									(!config.quartzJobId &&
										!config.cronExpression.trim())
								}
								title={
									config.quartzJobId
										? "Disable schedule"
										: "Enable schedule"
								}
								className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 ${
									config.quartzJobId
										? "bg-primary"
										: "bg-input"
								}`}
							>
								<span
									className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
										config.quartzJobId
											? "translate-x-6"
											: "translate-x-1"
									}`}
								/>
							</button>
						)}
					</div>

					{/* apply changes — shown when schedule is active and cron/tz edits haven't been pushed yet */}
					{config.quartzJobId && (
						<Button
							size="sm"
							variant="outline"
							onClick={activateSchedule}
							disabled={
								activatingSchedule ||
								!config.cronExpression.trim()
							}
							className="w-full"
						>
							{activatingSchedule ? (
								<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
							) : (
								<RefreshCw className="mr-1.5 h-3.5 w-3.5" />
							)}
							Apply Changes
						</Button>
					)}
				</>
			)}

			{/* Webhook */}
			{config.mode === "webhook" && (
				<>
					<div className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3">
						<p className="font-medium text-xs">Webhook URL</p>
						<div className="flex items-center gap-2">
							<code className="flex-1 break-all rounded bg-muted px-2 py-1 font-mono text-[10px]">
								POST {webhookUrl}
							</code>
							<CopyButton value={webhookUrl} />
						</div>
					</div>
					<div className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3">
						<p className="font-medium text-xs">Webhook Secret</p>

						{revealedSecret ? (
							<>
								<div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
									Copy this now — it won't be shown again
									after you leave this panel.
								</div>
								<div className="flex items-center gap-2">
									<code className="flex-1 select-all break-all rounded bg-muted px-2 py-1.5 font-mono text-[11px]">
										{revealedSecret}
									</code>
									<CopyButton value={revealedSecret} />
								</div>
							</>
						) : config.webhookSecret ? (
							<p className="text-[10px] text-muted-foreground">
								A secret is configured. Rotate it below to
								generate a new one — the current secret will
								stop working.
							</p>
						) : (
							<p className="text-[10px] text-muted-foreground">
								No secret yet. Generate one — it will be shown
								once so you can copy it.
							</p>
						)}

						<Button
							size="sm"
							variant="outline"
							onClick={generateSecret}
							disabled={generatingSecret}
						>
							{generatingSecret ? (
								<Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
							) : (
								<RefreshCw className="mr-1.5 h-3 w-3" />
							)}
							{config.webhookSecret
								? "Rotate Secret"
								: "Generate Secret"}
						</Button>
					</div>
					<div className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/30 p-3">
						<p className="font-medium text-xs">Example curl</p>
						<div className="flex items-start gap-2">
							<code className="flex-1 whitespace-pre-wrap break-all rounded bg-muted px-2 py-1.5 font-mono text-[10px]">
								{`curl -X POST ${webhookUrl} \\\n  -H "X-Webhook-Secret: ${revealedSecret ?? (config.webhookSecret ? "<your-secret>" : "<generate-a-secret-above>")}"`}
							</code>
							<CopyButton
								value={`curl -X POST ${webhookUrl} -H "X-Webhook-Secret: ${revealedSecret ?? (config.webhookSecret ? "<your-secret>" : "<generate-a-secret-above>")}"`}
							/>
						</div>
					</div>
				</>
			)}

			{/* Storage Poll */}
			{config.mode === "storage-poll" && (
				<>
					<EngineSelect
						label="Storage Engine"
						value={config.storagePollEngineId ?? ""}
						engines={engines.STORAGE ?? []}
						onChange={(v) =>
							onChange({ ...config, storagePollEngineId: v })
						}
						triggerClassName=""
						labelClassName=""
					/>
					<Field>
						<FieldLabel>Watch Path</FieldLabel>
						<Input
							value={config.storagePollPath ?? ""}
							onChange={(e) =>
								onChange({
									...config,
									storagePollPath: e.target.value,
								})
							}
							placeholder="/uploads/incoming"
						/>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Workflow fires when the file list in this path
							changes (files added or removed).
						</p>
					</Field>
					<Field>
						<FieldLabel>Poll Frequency (Quartz cron)</FieldLabel>
						<Input
							value={
								config.storagePollIntervalCron ?? "0 * * * * ?"
							}
							onChange={(e) =>
								onChange({
									...config,
									storagePollIntervalCron: e.target.value,
								})
							}
							placeholder="0 * * * * ?"
							className="font-mono text-sm"
						/>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Every minute: <code>0 * * * * ?</code> · Every 5
							min: <code>0 0/5 * * * ?</code>
						</p>
					</Field>
					{config.storagePollJobId ? (
						<div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 text-xs dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
							Poll active · Job ID:{" "}
							<code className="font-mono">
								{config.storagePollJobId.slice(0, 8)}…
							</code>
						</div>
					) : (
						<Button
							size="sm"
							onClick={() => activatePoll("storage-poll")}
							disabled={
								pollActivating ||
								!config.storagePollEngineId ||
								!config.storagePollPath ||
								!config.storagePollIntervalCron
							}
							className="w-full"
						>
							{pollActivating ? (
								<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
							) : null}
							Activate Storage Watch
						</Button>
					)}
				</>
			)}

			{/* DB Poll */}
			{config.mode === "db-poll" && (
				<>
					<EngineSelect
						label="Database Engine"
						value={config.dbPollEngineId ?? ""}
						engines={engines.DATABASE ?? []}
						onChange={(v) =>
							onChange({ ...config, dbPollEngineId: v })
						}
						triggerClassName=""
						labelClassName=""
					/>
					<Field>
						<FieldLabel>Change Detection Query</FieldLabel>
						<Textarea
							value={config.dbPollQuery ?? ""}
							onChange={(e) =>
								onChange({
									...config,
									dbPollQuery: e.target.value,
								})
							}
							placeholder="SELECT MAX(updated_at) FROM orders"
							className="font-mono text-xs"
							rows={3}
						/>
						<p className="mt-1 text-[10px] text-muted-foreground">
							The workflow fires when this query's result changes
							between polls. Good patterns:{" "}
							<code>MAX(updated_at)</code>, <code>COUNT(*)</code>.
						</p>
					</Field>
					<Field>
						<FieldLabel>Poll Frequency (Quartz cron)</FieldLabel>
						<Input
							value={config.dbPollIntervalCron ?? "0 * * * * ?"}
							onChange={(e) =>
								onChange({
									...config,
									dbPollIntervalCron: e.target.value,
								})
							}
							placeholder="0 * * * * ?"
							className="font-mono text-sm"
						/>
					</Field>
					{config.dbPollJobId ? (
						<div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 text-xs dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
							Poll active · Job ID:{" "}
							<code className="font-mono">
								{config.dbPollJobId.slice(0, 8)}…
							</code>
						</div>
					) : (
						<Button
							size="sm"
							onClick={() => activatePoll("db-poll")}
							disabled={
								pollActivating ||
								!config.dbPollEngineId ||
								!config.dbPollQuery ||
								!config.dbPollIntervalCron
							}
							className="w-full"
						>
							{pollActivating ? (
								<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
							) : null}
							Activate DB Watch
						</Button>
					)}
				</>
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
	const {
		searchedStructure,
		searchTerm,
		setSearchTerm,
		expandedTables,
		toggleTable,
		isLoading: schemaLoading,
	} = useDatabaseStructure(config.engineId ?? "");

	const insertTable = (table: string) =>
		onChange({ ...config, expression: `SELECT * FROM ${table}` });

	const insertColumn = (table: string, column: string) =>
		onChange({ ...config, expression: `SELECT ${column} FROM ${table}` });

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

			{/* schema browser — only when an engine is selected */}
			{config.engineId && (
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<span className="font-medium text-muted-foreground text-xs">
							Schema
						</span>
						{schemaLoading && (
							<Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
						)}
						<span className="ml-auto text-[10px] text-muted-foreground/60">
							click to insert
						</span>
					</div>

					<div className="relative">
						<Search className="-translate-y-1/2 absolute top-1/2 left-2 h-3 w-3 text-muted-foreground/60" />
						<Input
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Filter tables & columns…"
							className="h-7 pl-6 text-xs"
						/>
					</div>

					<div className="max-h-52 overflow-y-auto rounded border text-xs">
						{schemaLoading && searchedStructure.length === 0 ? (
							<div className="flex items-center justify-center py-6 text-muted-foreground">
								<Loader2 className="h-4 w-4 animate-spin" />
							</div>
						) : searchedStructure.length === 0 ? (
							<p className="py-4 text-center text-muted-foreground">
								No tables found
							</p>
						) : (
							searchedStructure.map((table) => (
								<div
									key={table.table}
									className="border-b last:border-0"
								>
									{/* table row */}
									<div className="flex items-center">
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												toggleTable(table.table);
											}}
											className="flex items-center px-1.5 py-1.5 text-muted-foreground hover:text-foreground"
										>
											{expandedTables[table.table] ? (
												<ChevronDown className="h-3 w-3" />
											) : (
												<ChevronRight className="h-3 w-3" />
											)}
										</button>
										<button
											type="button"
											onClick={() =>
												insertTable(table.table)
											}
											className="flex flex-1 items-center gap-1.5 py-1.5 pr-2 text-left hover:bg-muted/50"
											title={`SELECT * FROM ${table.table}`}
										>
											<Database className="h-3 w-3 shrink-0 text-blue-500" />
											<span className="font-medium">
												{table.table}
											</span>
										</button>
									</div>

									{/* column rows */}
									{expandedTables[table.table] && (
										<div className="border-t bg-muted/10">
											{table.columns.map((col) => (
												<button
													key={col.column}
													type="button"
													onClick={() =>
														insertColumn(
															table.table,
															col.column,
														)
													}
													className="flex w-full items-center gap-1.5 py-1 pr-2 pl-7 text-left hover:bg-muted/50"
													title={`SELECT ${col.column} FROM ${table.table}`}
												>
													<span className="flex-1 font-mono text-foreground/80">
														{col.column}
													</span>
													<span className="shrink-0 text-[10px] text-muted-foreground/60">
														{col.type}
													</span>
												</button>
											))}
										</div>
									)}
								</div>
							))
						)}
					</div>
				</div>
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

function CustomPixelForm({
	config,
	projects,
	upstreamVars,
	onChange,
}: {
	config: CustomPixelConfig;
	projects: ProjectOption[];
	upstreamVars: string[];
	onChange: (c: CustomPixelConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<Field>
				<FieldLabel>App / Project Context (optional)</FieldLabel>
				<Select
					value={config.appId ?? ""}
					onValueChange={(v) =>
						onChange({
							...config,
							appId: v === "__none__" ? "" : v,
						})
					}
				>
					<SelectTrigger>
						<SelectValue placeholder="Run in default context" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="__none__">
							<span className="text-muted-foreground">
								None (default context)
							</span>
						</SelectItem>
						{projects.map((p) => (
							<SelectItem
								key={p.project_id}
								value={p.project_id}
								className="py-1.5 text-xs"
							>
								<span className="flex flex-col gap-0.5">
									<span>
										{p.project_display_name ??
											p.project_name}
									</span>
									<span className="font-mono text-[10px] text-muted-foreground">
										{p.project_id}
									</span>
								</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<p className="mt-1 text-muted-foreground text-xs">
					When set, the pixel runs inside this app's insight context.
				</p>
			</Field>
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
					onChange={(e) =>
						onChange({ ...config, pixel: e.target.value })
					}
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
										...config,
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

function ForEachForm({
	config,
	upstreamVars,
	onChange,
}: {
	config: ForEachConfig;
	upstreamVars: string[];
	onChange: (c: ForEachConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<BoundInput
				label="Source Array Variable"
				value={config.sourceVar}
				placeholder="db_out"
				onChange={(v) => onChange({ ...config, sourceVar: v })}
				upstreamVars={upstreamVars}
			/>
			<Field>
				<FieldLabel>Iterator Variable Name</FieldLabel>
				<Input
					value={config.iteratorVar}
					onChange={(e) =>
						onChange({ ...config, iteratorVar: e.target.value })
					}
					placeholder="row"
				/>
				<p className="mt-1 text-muted-foreground text-xs">
					Each element is available as{" "}
					<code className="rounded bg-muted px-1">{`\${${config.iteratorVar || "row"}.fieldName}`}</code>{" "}
					in inner nodes.
				</p>
			</Field>
			<div className="space-y-1.5 rounded-md border border-border border-dashed p-3 text-muted-foreground text-xs">
				<p className="font-medium text-foreground text-xs">
					How For Each works
				</p>
				<p>
					Iterates over each object in{" "}
					<code className="rounded bg-muted px-1">{`\${${config.sourceVar || "sourceVar"}}`}</code>{" "}
					and runs the inner pipeline for each one. Results collect
					into the output variable as an array.
				</p>
				<p>
					Example: A database query returns 50 records → For Each
					enriches each via an LLM call → 50 enriched results.
				</p>
			</div>
		</div>
	);
}

function WhileLoopForm({
	config,
	upstreamVars,
	onChange,
}: {
	config: WhileLoopConfig;
	upstreamVars: string[];
	onChange: (c: WhileLoopConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<BoundInput
				label="Condition (JS expression)"
				value={config.condition}
				placeholder="${row_count} > 0"
				onChange={(v) => onChange({ ...config, condition: v })}
				upstreamVars={upstreamVars}
			/>
			<Field>
				<FieldLabel>Max Iterations (safety cap)</FieldLabel>
				<Input
					type="number"
					min={1}
					max={10000}
					value={config.maxIterations ?? 100}
					onChange={(e) =>
						onChange({
							...config,
							maxIterations: Number(e.target.value),
						})
					}
					placeholder="100"
				/>
				<p className="mt-1 text-muted-foreground text-xs">
					Execution stops after this many iterations even if the
					condition is still true.
				</p>
			</Field>
			<div className="space-y-1.5 rounded-md border border-border border-dashed p-3 text-muted-foreground text-xs">
				<p className="font-medium text-foreground text-xs">
					How While Loop works
				</p>
				<p>
					Before each iteration the condition is evaluated. If true,
					the inner sub-pipeline runs. Repeats until the condition is
					false or max iterations is reached.
				</p>
				<p>
					Build the inner pipeline steps using the workflow editor
					after placing this node on the canvas.
				</p>
			</div>
		</div>
	);
}

function TryCatchForm({
	config,
	upstreamVars: _upstreamVars,
	onChange,
}: {
	config: TryCatchConfig;
	upstreamVars: string[];
	onChange: (c: TryCatchConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<Field>
				<FieldLabel>Error Variable Name</FieldLabel>
				<Input
					value={config.errorVar}
					onChange={(e) =>
						onChange({ ...config, errorVar: e.target.value })
					}
					placeholder="error"
					className="font-mono text-sm"
				/>
				<p className="mt-1 text-muted-foreground text-xs">
					On failure, the error message is injected into scope as{" "}
					<code className="rounded bg-muted px-1">{`\${${config.errorVar || "error"}}`}</code>{" "}
					so your Catch branch can reference it.
				</p>
			</Field>
			<div className="space-y-1.5 rounded-md border border-border border-dashed p-3 text-muted-foreground text-xs">
				<p className="font-medium text-foreground text-xs">
					How Try / Catch works
				</p>
				<p>
					The <span className="font-medium text-foreground">Try</span>{" "}
					branch runs first. If any node fails, execution moves to the{" "}
					<span className="font-medium text-foreground">Catch</span>{" "}
					branch. Success in Try means Catch never runs.
				</p>
				<p>
					Build the Try and Catch sub-pipelines using the workflow
					editor after placing this node on the canvas.
				</p>
			</div>
		</div>
	);
}

function WaitForm({
	config,
	upstreamVars,
	onChange,
}: {
	config: WaitConfig;
	upstreamVars: string[];
	onChange: (c: WaitConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<BoundInput
				label="Seconds to Wait"
				value={config.seconds}
				placeholder="30"
				onChange={(v) => onChange({ ...config, seconds: v })}
				upstreamVars={upstreamVars}
			/>
			<p className="text-muted-foreground text-xs">
				Supports{" "}
				<code className="rounded bg-muted px-1">
					{/* biome-ignore lint/suspicious/noTemplateCurlyInString: literal */}
					{"${var}"}
				</code>{" "}
				templates. Maximum 3600 seconds (1 hour). Use{" "}
				<code className="rounded bg-muted px-1">
					{/* biome-ignore lint/suspicious/noTemplateCurlyInString: literal */}
					{"${config.POLL_INTERVAL}"}
				</code>{" "}
				for configurable delays.
			</p>
		</div>
	);
}

/** Autocomplete for a variable name field — suggests from `suggestions` on plain typing. */
function VarNameInput({
	value,
	suggestions,
	onChange,
}: {
	value: string;
	suggestions: string[];
	onChange: (v: string) => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [open, setOpen] = useState(false);

	const filtered = suggestions.filter(
		(s) => s !== value && s.toLowerCase().includes(value.toLowerCase()),
	);

	const pick = (v: string) => {
		onChange(v);
		setOpen(false);
		requestAnimationFrame(() => inputRef.current?.focus());
	};

	return (
		<div className="relative flex-1">
			<Input
				ref={inputRef}
				value={value}
				onChange={(e) => {
					onChange(e.target.value);
					setOpen(true);
				}}
				onKeyUp={(e) => {
					if (e.key === "Escape") setOpen(false);
				}}
				onFocus={() => {
					if (closeTimer.current) clearTimeout(closeTimer.current);
					setOpen(true);
				}}
				onBlur={() => {
					closeTimer.current = setTimeout(() => setOpen(false), 150);
				}}
				placeholder="variableName"
				className="font-mono text-xs"
			/>
			{open && filtered.length > 0 && (
				<div className="absolute top-full right-0 left-0 z-50 mt-0.5 max-h-40 overflow-y-auto rounded-md border bg-popover shadow-md">
					{filtered.map((s) => (
						<button
							key={s}
							type="button"
							onMouseDown={(e) => {
								e.preventDefault();
								pick(s);
							}}
							className="flex w-full items-center px-3 py-1.5 text-left font-mono text-xs hover:bg-accent hover:text-accent-foreground"
						>
							{s}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

/** Autocomplete for a variable value field — suggests from `vars` when typing `${`. */
function VarValueInput({
	value,
	vars,
	onChange,
}: {
	value: string;
	vars: string[];
	onChange: (v: string) => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [partialStart, setPartialStart] = useState(-1);

	const detect = (val: string, cursor: number) => {
		if (!vars.length) return;
		const before = val.slice(0, cursor);
		const lastOpen = before.lastIndexOf("${");
		if (lastOpen === -1 || before.slice(lastOpen + 2).includes("}")) {
			setSuggestions([]);
			return;
		}
		const filter = before.slice(lastOpen + 2).toLowerCase();
		setPartialStart(lastOpen);
		setSuggestions(vars.filter((v) => v.toLowerCase().includes(filter)));
	};

	const insertVar = (v: string) => {
		const el = inputRef.current;
		if (!el || partialStart === -1) return;
		const cursor = el.selectionStart ?? value.length;
		const inserted = `\${${v}}`;
		const newVal =
			value.slice(0, partialStart) + inserted + value.slice(cursor);
		onChange(newVal);
		setSuggestions([]);
		const newCursor = partialStart + inserted.length;
		requestAnimationFrame(() => {
			el.focus();
			el.setSelectionRange(newCursor, newCursor);
		});
	};

	return (
		<div className="relative">
			<Input
				ref={inputRef}
				value={value}
				onChange={(e) => {
					onChange(e.target.value);
					detect(
						e.target.value,
						e.target.selectionStart ?? e.target.value.length,
					);
				}}
				onKeyUp={(e) => {
					if (e.key === "Escape") {
						setSuggestions([]);
						return;
					}
					detect(
						e.currentTarget.value,
						e.currentTarget.selectionStart ??
							e.currentTarget.value.length,
					);
				}}
				onFocus={() => {
					if (closeTimer.current) clearTimeout(closeTimer.current);
				}}
				onBlur={() => {
					closeTimer.current = setTimeout(
						() => setSuggestions([]),
						150,
					);
				}}
				placeholder="${var}, literal, or math: ${counter} - 1"
				className="font-mono text-xs"
			/>
			{suggestions.length > 0 && (
				<div className="absolute top-full right-0 left-0 z-50 mt-0.5 max-h-40 overflow-y-auto rounded-md border bg-popover shadow-md">
					{suggestions.map((v) => (
						<button
							key={v}
							type="button"
							onMouseDown={(e) => {
								e.preventDefault();
								insertVar(v);
							}}
							className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-xs hover:bg-accent hover:text-accent-foreground"
						>
							<span className="text-[10px] text-muted-foreground">
								{/* biome-ignore lint/suspicious/noTemplateCurlyInString: intentional display of ${} syntax */}
								{"${}"}
							</span>
							{v}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

function SetVariableForm({
	config,
	upstreamVars,
	knownVarNames = [],
	onChange,
}: {
	config: SetVariableConfig;
	upstreamVars: string[];
	knownVarNames?: string[];
	onChange: (c: SetVariableConfig) => void;
}) {
	const entries = Object.entries(config.variables ?? {});
	// include this node's own declared variable names in both autocompletes
	const ownKeys = entries.map(([k]) => k).filter(Boolean);
	const keySuggestions = [...new Set([...knownVarNames, ...ownKeys])];
	const valueSuggestions = [...new Set([...upstreamVars, ...ownKeys])];

	const setEntry = (idx: number, key: string, value: string) => {
		const next: Record<string, string> = {};
		entries.forEach(([k, v], i) => {
			if (i === idx) next[key] = value;
			else next[k] = v;
		});
		onChange({ ...config, variables: next });
	};

	const addEntry = () => {
		const newKey = `var_${entries.length + 1}`;
		onChange({
			...config,
			variables: { ...config.variables, [newKey]: "" },
		});
	};

	const removeEntry = (idx: number) => {
		const next: Record<string, string> = {};
		entries.forEach(([k, v], i) => {
			if (i !== idx) next[k] = v;
		});
		onChange({ ...config, variables: next });
	};

	return (
		<div className="flex flex-col gap-3">
			{entries.length === 0 && (
				<p className="text-muted-foreground text-xs">
					No variables yet. Add one below.
				</p>
			)}
			{entries.map(([key, value], idx) => (
				<div
					key={key || idx}
					className="flex flex-col gap-1.5 rounded-md border border-border p-2"
				>
					<div className="flex items-center gap-1">
						<VarNameInput
							value={key}
							suggestions={keySuggestions}
							onChange={(k) => setEntry(idx, k, value)}
						/>
						<button
							type="button"
							onClick={() => removeEntry(idx)}
							className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
						>
							<Trash2 className="h-3.5 w-3.5" />
						</button>
					</div>
					<VarValueInput
						value={value}
						vars={valueSuggestions}
						onChange={(v) => setEntry(idx, key, v)}
					/>
				</div>
			))}
			<button
				type="button"
				onClick={addEntry}
				className="flex items-center gap-1.5 rounded-md border border-border border-dashed px-3 py-2 text-muted-foreground text-xs hover:bg-accent hover:text-foreground"
			>
				<Plus className="h-3.5 w-3.5" />
				Add Variable
			</button>
		</div>
	);
}

function EmailForm({
	config,
	upstreamVars,
	onChange,
}: {
	config: EmailConfig;
	upstreamVars: string[];
	onChange: (c: EmailConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<BoundInput
				label="To"
				value={config.to}
				placeholder="user@company.com"
				onChange={(v) => onChange({ ...config, to: v })}
				upstreamVars={upstreamVars}
			/>
			<BoundInput
				label="CC (optional)"
				value={config.cc ?? ""}
				placeholder="manager@company.com"
				onChange={(v) => onChange({ ...config, cc: v })}
				upstreamVars={upstreamVars}
			/>
			<BoundInput
				label="Subject"
				value={config.subject}
				placeholder="Report for ${report_date}"
				onChange={(v) => onChange({ ...config, subject: v })}
				upstreamVars={upstreamVars}
			/>
			<Field>
				<FieldLabel>Body</FieldLabel>
				<div className="relative">
					<Textarea
						value={config.body}
						onChange={(e) =>
							onChange({ ...config, body: e.target.value })
						}
						placeholder="Hello,&#10;&#10;Here are today's results: ${model_out}"
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
											...config,
											body: `${config.body}\${${v}}`,
										})
									}
								>
									{`\${${v}}`}
								</button>
							))}
						</div>
					)}
				</div>
			</Field>
			<Field>
				<div className="flex items-center gap-2">
					{/* biome-ignore lint/correctness/useUniqueElementIds: single email form instance per panel */}
					<input
						type="checkbox"
						id="email-html"
						checked={config.isHtml ?? false}
						onChange={(e) =>
							onChange({ ...config, isHtml: e.target.checked })
						}
						className="h-3.5 w-3.5 rounded"
					/>
					<label
						htmlFor="email-html"
						className="cursor-pointer text-sm"
					>
						HTML email
					</label>
				</div>
				<p className="mt-1 text-[10px] text-muted-foreground">
					Check this if your body contains HTML markup. Leave
					unchecked for plain text.
				</p>
			</Field>
		</div>
	);
}

function HttpRequestForm({
	config,
	upstreamVars,
	onChange,
}: {
	config: HttpRequestConfig;
	upstreamVars: string[];
	onChange: (c: HttpRequestConfig) => void;
}) {
	const showBody = ["POST", "PUT", "PATCH"].includes(config.method);
	return (
		<div className="flex flex-col gap-4">
			<div className="flex gap-2">
				<Field className="w-28 shrink-0">
					<FieldLabel>Method</FieldLabel>
					<Select
						value={config.method}
						onValueChange={(v) =>
							onChange({
								...config,
								method: v as HttpRequestConfig["method"],
							})
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{(
								[
									"GET",
									"POST",
									"PUT",
									"PATCH",
									"DELETE",
								] as const
							).map((m) => (
								<SelectItem key={m} value={m}>
									{m}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
				<BoundInput
					label="URL"
					value={config.url}
					placeholder="https://api.example.com/v1/data"
					onChange={(v) => onChange({ ...config, url: v })}
					upstreamVars={upstreamVars}
				/>
			</div>
			<Field>
				<FieldLabel>Headers (JSON)</FieldLabel>
				<Textarea
					value={config.headers ?? ""}
					onChange={(e) =>
						onChange({ ...config, headers: e.target.value })
					}
					placeholder={
						// biome-ignore lint/suspicious/noTemplateCurlyInString: placeholder shows ${token} as example
						'{"Content-Type": "application/json", "Authorization": "Bearer ${token}"}'
					}
					className="font-mono text-xs"
					rows={3}
				/>
			</Field>
			{showBody && (
				<Field>
					<FieldLabel>Body</FieldLabel>
					<div className="relative">
						<Textarea
							value={config.body ?? ""}
							onChange={(e) =>
								onChange({ ...config, body: e.target.value })
							}
							// biome-ignore lint/suspicious/noTemplateCurlyInString: placeholder shows ${upstream_var} as example
							placeholder={'{"key": "${upstream_var}"}'}
							className="font-mono text-xs"
							rows={5}
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
												...config,
												body: `${config.body ?? ""}\${${v}}`,
											})
										}
									>
										{`\${${v}}`}
									</button>
								))}
							</div>
						)}
					</div>
				</Field>
			)}
			<details className="group rounded-md border border-border">
				<summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-muted-foreground text-xs hover:text-foreground">
					<span>Basic Auth (optional)</span>
					<span className="text-[10px]">▸</span>
				</summary>
				<div className="flex flex-col gap-3 border-border border-t p-3">
					<Field>
						<FieldLabel>Username</FieldLabel>
						<Input
							value={config.username ?? ""}
							onChange={(e) =>
								onChange({
									...config,
									username: e.target.value,
								})
							}
							placeholder="api_user"
						/>
					</Field>
					<Field>
						<FieldLabel>Password</FieldLabel>
						<Input
							type="password"
							value={config.password ?? ""}
							onChange={(e) =>
								onChange({
									...config,
									password: e.target.value,
								})
							}
							placeholder="••••••••"
						/>
					</Field>
				</div>
			</details>
		</div>
	);
}

function NotificationForm({
	config,
	upstreamVars,
	onChange,
}: {
	config: NotificationConfig;
	upstreamVars: string[];
	onChange: (c: NotificationConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<BoundInput
				label="Recipient User ID"
				value={config.recipientId}
				placeholder="${user_id} or a literal SEMOSS user ID"
				onChange={(v) => onChange({ ...config, recipientId: v })}
				upstreamVars={upstreamVars}
			/>
			<BoundInput
				label="Title"
				value={config.title}
				placeholder="Workflow completed: ${run_id}"
				onChange={(v) => onChange({ ...config, title: v })}
				upstreamVars={upstreamVars}
			/>
			<Field>
				<FieldLabel>Message</FieldLabel>
				<div className="relative">
					<Textarea
						value={config.message}
						onChange={(e) =>
							onChange({ ...config, message: e.target.value })
						}
						placeholder="Processed ${row_count} records. See workflow run for details."
						rows={3}
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
											...config,
											message: `${config.message}\${${v}}`,
										})
									}
								>
									{`\${${v}}`}
								</button>
							))}
						</div>
					)}
				</div>
			</Field>
			<Field>
				<FieldLabel>Priority</FieldLabel>
				<Select
					value={config.priority ?? "MEDIUM"}
					onValueChange={(v) =>
						onChange({
							...config,
							priority: v as NotificationConfig["priority"],
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="HIGH">High</SelectItem>
						<SelectItem value="MEDIUM">Medium</SelectItem>
						<SelectItem value="LOW">Low</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<div className="rounded-md border border-border border-dashed p-3 text-[10px] text-muted-foreground">
				The recipient sees this notification in the SEMOSS notification
				bell. They must have a SEMOSS account — use their exact user ID.
			</div>
		</div>
	);
}

function SwitchForm({
	config,
	upstreamVars: _upstreamVars,
	onChange,
}: {
	config: SwitchConfig;
	upstreamVars: string[];
	onChange: (c: SwitchConfig) => void;
}) {
	const cases = config.cases ?? [];

	const addCase = () =>
		onChange({
			...config,
			cases: [...cases, { value: "", label: `Case ${cases.length + 1}` }],
		});

	const updateCase = (idx: number, field: "value" | "label", val: string) =>
		onChange({
			...config,
			cases: cases.map((c, i) =>
				i === idx ? { ...c, [field]: val } : c,
			),
		});

	const removeCase = (idx: number) =>
		onChange({ ...config, cases: cases.filter((_, i) => i !== idx) });

	return (
		<div className="flex flex-col gap-4">
			<Field>
				<FieldLabel>Switch On Variable</FieldLabel>
				<Input
					value={config.switchVar}
					onChange={(e) =>
						onChange({ ...config, switchVar: e.target.value })
					}
					placeholder="doc_type"
					className="font-mono text-sm"
				/>
				<p className="mt-1 text-[10px] text-muted-foreground">
					The value of{" "}
					<code className="rounded bg-muted px-1">{`\${${config.switchVar || "var"}}`}</code>{" "}
					is matched against the cases below.
				</p>
			</Field>
			<div className="flex flex-col gap-2">
				<p className="font-medium text-xs">Cases</p>
				{cases.length === 0 && (
					<p className="text-[10px] text-muted-foreground">
						No cases yet. Add one below.
					</p>
				)}
				{cases.map((c, idx) => (
					<div
						key={c.value || idx}
						className="flex items-center gap-2 rounded-md border border-border p-2"
					>
						<div className="flex flex-1 flex-col gap-1">
							<Input
								value={c.value}
								onChange={(e) =>
									updateCase(idx, "value", e.target.value)
								}
								placeholder="match value"
								className="font-mono text-xs"
							/>
							<Input
								value={c.label}
								onChange={(e) =>
									updateCase(idx, "label", e.target.value)
								}
								placeholder="branch label"
								className="text-xs"
							/>
						</div>
						<button
							type="button"
							onClick={() => removeCase(idx)}
							className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
						>
							<Trash2 className="h-3.5 w-3.5" />
						</button>
					</div>
				))}
				<button
					type="button"
					onClick={addCase}
					className="flex items-center gap-1.5 rounded-md border border-border border-dashed px-3 py-2 text-muted-foreground text-xs hover:bg-accent hover:text-foreground"
				>
					<Plus className="h-3.5 w-3.5" />
					Add Case
				</button>
			</div>
			<div className="rounded-md border border-border border-dashed p-3 text-[10px] text-muted-foreground">
				A <span className="font-medium text-foreground">Default</span>{" "}
				branch handles values that don't match any case. Build
				sub-pipelines for each case in the workflow editor after placing
				this node on the canvas.
			</div>
		</div>
	);
}

function RetryForm({
	config,
	onChange,
}: {
	config: RetryConfig;
	onChange: (c: RetryConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<Field>
				<FieldLabel>Max Attempts</FieldLabel>
				<Input
					type="number"
					min={1}
					max={20}
					value={config.maxAttempts ?? 3}
					onChange={(e) =>
						onChange({
							...config,
							maxAttempts: Number(e.target.value),
						})
					}
					placeholder="3"
				/>
			</Field>
			<Field>
				<FieldLabel>Backoff Between Attempts (seconds)</FieldLabel>
				<Input
					type="number"
					min={0}
					max={300}
					value={config.backoffSeconds ?? 5}
					onChange={(e) =>
						onChange({
							...config,
							backoffSeconds: Number(e.target.value),
						})
					}
					placeholder="5"
				/>
			</Field>
			<Field>
				<div className="flex items-center gap-2">
					{/* biome-ignore lint/correctness/useUniqueElementIds: single retry form instance per panel */}
					<input
						type="checkbox"
						id="retry-exp"
						checked={config.exponential ?? false}
						onChange={(e) =>
							onChange({
								...config,
								exponential: e.target.checked,
							})
						}
						className="h-3.5 w-3.5 rounded"
					/>
					<label
						htmlFor="retry-exp"
						className="cursor-pointer text-sm"
					>
						Exponential backoff
					</label>
				</div>
				<p className="mt-1 text-[10px] text-muted-foreground">
					When checked, wait multiplies by the attempt number: attempt
					1 → {config.backoffSeconds ?? 5}s, attempt 2 →{" "}
					{(config.backoffSeconds ?? 5) * 2}s, etc. Capped at 5
					minutes.
				</p>
			</Field>
			<div className="space-y-1.5 rounded-md border border-border border-dashed p-3 text-[10px] text-muted-foreground">
				<p className="font-medium text-foreground text-xs">
					How Retry works
				</p>
				<p>
					Wraps a sub-pipeline. On failure the sub-pipeline is re-run
					from the start. Scope changes from a failed attempt are
					discarded before each retry.
				</p>
				<p>
					Build the inner sub-pipeline using the workflow editor after
					placing this node on the canvas.
				</p>
			</div>
		</div>
	);
}

function ParallelForm({
	config,
	onChange,
}: {
	config: ParallelConfig;
	onChange: (c: ParallelConfig) => void;
}) {
	const branches = config.branches ?? [];

	const addBranch = () =>
		onChange({
			...config,
			branches: [
				...branches,
				{
					label: `Branch ${String.fromCharCode(65 + branches.length)}`,
					outputVar: `branch_${String.fromCharCode(97 + branches.length)}_out`,
				},
			],
		});

	const updateBranch = (
		idx: number,
		field: "label" | "outputVar",
		val: string,
	) =>
		onChange({
			...config,
			branches: branches.map((b, i) =>
				i === idx ? { ...b, [field]: val } : b,
			),
		});

	const removeBranch = (idx: number) =>
		onChange({ ...config, branches: branches.filter((_, i) => i !== idx) });

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<p className="font-medium text-xs">Branches</p>
				{branches.map((b, idx) => (
					<div
						key={b.outputVar || b.label || idx}
						className="flex items-center gap-2 rounded-md border border-border p-2"
					>
						<div className="flex flex-1 flex-col gap-1">
							<Input
								value={b.label}
								onChange={(e) =>
									updateBranch(idx, "label", e.target.value)
								}
								placeholder="Branch A"
								className="text-xs"
							/>
							<Input
								value={b.outputVar}
								onChange={(e) =>
									updateBranch(
										idx,
										"outputVar",
										e.target.value,
									)
								}
								placeholder="branch_a_out"
								className="font-mono text-xs"
							/>
						</div>
						<button
							type="button"
							onClick={() => removeBranch(idx)}
							className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
						>
							<Trash2 className="h-3.5 w-3.5" />
						</button>
					</div>
				))}
				<button
					type="button"
					onClick={addBranch}
					className="flex items-center gap-1.5 rounded-md border border-border border-dashed px-3 py-2 text-muted-foreground text-xs hover:bg-accent hover:text-foreground"
				>
					<Plus className="h-3.5 w-3.5" />
					Add Branch
				</button>
			</div>
			<div className="space-y-1.5 rounded-md border border-border border-dashed p-3 text-[10px] text-muted-foreground">
				<p className="font-medium text-foreground text-xs">
					How Parallel works
				</p>
				<p>
					Each branch runs its own sub-pipeline and writes results to
					its output variable. After all branches complete, their
					outputs are available to downstream nodes.
				</p>
				<p>
					Build each branch's sub-pipeline using the workflow editor
					after placing this node on the canvas.
				</p>
			</div>
		</div>
	);
}

// ─── main settings panel ──────────────────────────────────────────────────────

interface NodeSettingsPanelProps {
	node: WorkflowNode;
	appId: string;
	upstreamVars: string[];
	knownVarNames?: string[];
	enginesByType: Record<string, EngineOption[]>;
	projects: ProjectOption[];
	onUpdate: (updated: WorkflowNode) => void;
	onClose: () => void;
}

export function NodeSettingsPanel({
	node,
	appId,
	upstreamVars,
	knownVarNames = [],
	enginesByType,
	projects,
	onUpdate,
	onClose,
}: NodeSettingsPanelProps) {
	const { monolithStore } = useRootStore();
	const { testOutputs, setTestOutput, testScope } =
		useWorkflowWorkspaceContext();

	const handleScheduleActivate = useCallback(
		async (
			cron: string,
			timezone: string,
			recipe: string,
		): Promise<string | null> => {
			const jobName = `wf_${appId}_${Date.now()}`;
			const pixel = `ScheduleJob(jobGroup=["WORKFLOW_TRIGGERS"], jobName=["${jobName}"], cronExpression=["${cron}"], recipe=["${recipe.replace(/"/g, '\\"')}"], frequency=["cron"], timeZone=["${timezone}"]);`;
			try {
				const result = await monolithStore.runQuery(pixel);
				// ScheduleJob returns the Quartz UUID under "-jobId" (JobConfigKeys.JOB_ID has a dash prefix)
				const output = result.pixelReturn?.[0]?.output as
					| Record<string, unknown>
					| undefined;
				return (output?.["-jobId"] as string) ?? jobName;
			} catch {
				return null;
			}
		},
		[appId, monolithStore],
	);

	const handleScheduleDeactivate = useCallback(
		async (jobId: string): Promise<void> => {
			// RemoveJobFromDB requires both jobId AND jobGroup or the size-check throws
			const pixel = `RemoveJobFromDB(jobId=["${jobId}"], jobGroup=["WORKFLOW_TRIGGERS"]);`;
			try {
				await monolithStore.runQuery(pixel);
			} catch {
				// best-effort
			}
		},
		[monolithStore],
	);

	const handleGenerateWebhookSecret = useCallback(async (): Promise<
		string | null
	> => {
		const pixel = `GenerateWorkflowWebhookSecret(project=["${appId}"]);`;
		try {
			const result = await monolithStore.runQuery(pixel);
			return (result.pixelReturn?.[0]?.output?.secret as string) ?? null;
		} catch {
			return null;
		}
	}, [appId, monolithStore]);
	const testOutput = testOutputs[node.id] ?? null;
	const [testing, setTesting] = useState(false);
	const [testPixel, setTestPixel] = useState(() => buildPixelPreview(node));
	const [showAdvanced, setShowAdvanced] = useState(false);
	const outputRef = useRef<HTMLDivElement>(null);

	// Sync pixel preview whenever node config changes.
	useEffect(() => {
		setTestPixel(buildPixelPreview(node));
	}, [node]);

	useEffect(() => {
		if (testOutput !== null) {
			outputRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
			});
		}
	}, [testOutput]);

	const pixelPreview = buildPixelPreview(node);

	// Vars referenced in the current pixel expression
	const varRefs = useMemo(() => extractVarRefs(testPixel), [testPixel]);

	const runTest = async () => {
		if (!testPixel.trim() || !isNodeReady(node)) return;
		setTesting(true);
		setTestOutput(node.id, null);
		try {
			const resolvedPixel = substituteVars(testPixel, testScope);
			const result = await monolithStore.runQuery(resolvedPixel);
			const output = result.pixelReturn?.[0]?.output;
			const raw = JSON.stringify(output, null, 2);
			const transformed = applyOutputTransform(raw, node.outputTransform);
			setTestOutput(node.id, transformed);
		} catch (err) {
			setTestOutput(node.id, `Error: ${(err as Error).message}`);
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
					{!NO_OUTPUT_VAR_TYPES.has(node.type) && (
						<Field>
							<div className="flex items-center gap-1">
								<FieldLabel>Output Variable Name</FieldLabel>
								{outputVarHint(node.type) && (
									<Tooltip>
										<TooltipTrigger asChild>
											<Info className="h-3 w-3 text-muted-foreground" />
										</TooltipTrigger>
										<TooltipContent
											side="right"
											className="max-w-60 text-xs"
										>
											{outputVarHint(node.type)}
										</TooltipContent>
									</Tooltip>
								)}
							</div>
							<Input
								value={node.outputVar}
								onChange={(e) =>
									updateOutputVar(e.target.value)
								}
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
					)}
				</div>

				<Separator className="mb-4" />

				{/* per-type form */}
				{node.type === "trigger" && (
					<TriggerForm
						config={node.config as TriggerConfig}
						appId={appId}
						engines={enginesByType}
						onChange={update}
						onScheduleActivate={handleScheduleActivate}
						onScheduleDeactivate={handleScheduleDeactivate}
						onGenerateWebhookSecret={handleGenerateWebhookSecret}
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
				{node.type === "custom-pixel" && (
					<CustomPixelForm
						config={node.config as CustomPixelConfig}
						projects={projects}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "sub-workflow" && (
					<SubWorkflowStepForm
						step={node}
						projects={projects}
						upstreamVars={upstreamVars}
						onUpdate={onUpdate}
					/>
				)}
				{node.type === "for-each" && (
					<ForEachForm
						config={node.config as ForEachConfig}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "conditional" && (
					<ConditionalStepForm
						step={node}
						enginesByType={enginesByType}
						projects={projects}
						upstreamVars={upstreamVars}
						onUpdate={(updated) =>
							update(updated.config as ConditionalConfig)
						}
					/>
				)}
				{node.type === "while-loop" && (
					<WhileLoopForm
						config={node.config as WhileLoopConfig}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "try-catch" && (
					<TryCatchForm
						config={node.config as TryCatchConfig}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "wait" && (
					<WaitForm
						config={node.config as WaitConfig}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "set-variable" && (
					<SetVariableForm
						config={node.config as SetVariableConfig}
						upstreamVars={upstreamVars}
						knownVarNames={knownVarNames}
						onChange={update}
					/>
				)}
				{node.type === "email" && (
					<EmailForm
						config={node.config as EmailConfig}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "http-request" && (
					<HttpRequestForm
						config={node.config as HttpRequestConfig}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "notification" && (
					<NotificationForm
						config={node.config as NotificationConfig}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "switch" && (
					<SwitchForm
						config={node.config as SwitchConfig}
						upstreamVars={upstreamVars}
						onChange={update}
					/>
				)}
				{node.type === "retry" && (
					<RetryForm
						config={node.config as RetryConfig}
						onChange={update}
					/>
				)}
				{node.type === "parallel" && (
					<ParallelForm
						config={node.config as ParallelConfig}
						onChange={update}
					/>
				)}
				{node.type === "transform" && (
					<TransformStepForm
						step={node}
						upstreamVars={upstreamVars}
						onUpdate={onUpdate}
					/>
				)}

				{/* Output transform — per-node reshaping for data-producing nodes */}
				{TRANSFORM_ENABLED.has(node.type) && (
					<>
						<Separator className="my-2" />
						<OutputTransformSection
							node={node}
							onUpdate={onUpdate}
						/>
					</>
				)}

				{node.type !== "trigger" && (
					<>
						<Separator className="my-4" />
						<div className="flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<span className="font-medium text-sm">
									Test Node
								</span>
								{!NO_PIXEL_TEST_TYPES.has(node.type) && (
									<div className="flex items-center gap-2">
										<button
											type="button"
											onClick={() =>
												setShowAdvanced((v) => !v)
											}
											className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
											title="Show pixel expression"
										>
											<ChevronDown
												className={`h-3 w-3 transition-transform duration-150 ${showAdvanced ? "" : "-rotate-90"}`}
											/>
											pixel
										</button>
										<Button
											size="sm"
											variant="outline"
											onClick={runTest}
											disabled={
												testing || !isNodeReady(node)
											}
										>
											{testing ? (
												<Loader2 className="mr-1 h-3 w-3 animate-spin" />
											) : (
												<Play className="mr-1 h-3 w-3" />
											)}
											Run
										</Button>
									</div>
								)}
							</div>

							{NO_PIXEL_TEST_TYPES.has(node.type) ? (
								<p className="rounded-md border bg-muted/30 px-3 py-2 text-muted-foreground text-xs">
									This node runs directly in the workflow
									engine and cannot be tested in isolation.
									Use <strong>Run Now</strong> in the History
									tab to test it as part of the full workflow.
								</p>
							) : (
								<>
									{/* var scope chips — show which ${vars} are resolved vs. missing */}
									{varRefs.length > 0 && (
										<div className="flex flex-wrap gap-1">
											{varRefs.map((v) => {
												const resolved = v in testScope;
												return (
													<span
														key={v}
														title={
															resolved
																? `= ${String(testScope[v]).slice(0, 120)}`
																: "Not in scope — test the upstream node first"
														}
														className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] ${
															resolved
																? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
																: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
														}`}
													>
														{resolved ? (
															<Check className="h-2.5 w-2.5" />
														) : (
															<span className="font-bold">
																?
															</span>
														)}
														{`\${${v}}`}
													</span>
												);
											})}
										</div>
									)}

									{showAdvanced && (
										<div className="relative">
											<Textarea
												value={testPixel}
												onChange={(e) =>
													setTestPixel(e.target.value)
												}
												className="font-mono text-[11px] leading-relaxed"
												rows={4}
												placeholder="Pixel expression to test…"
											/>
											<button
												type="button"
												className="absolute top-1 right-1 rounded px-1 py-0.5 text-[9px] text-muted-foreground hover:bg-muted"
												onClick={() =>
													setTestPixel(pixelPreview)
												}
												title="Reset to node pixel"
											>
												reset
											</button>
										</div>
									)}
									{testOutput !== null && (
										<div
											ref={outputRef}
											className="rounded-md border bg-muted/50 p-2"
										>
											<div className="mb-1.5 flex items-center justify-between">
												<span className="text-[10px] text-muted-foreground">
													Output
												</span>
												<button
													type="button"
													onClick={() =>
														setTestOutput(
															node.id,
															null,
														)
													}
													className="text-[10px] text-muted-foreground hover:text-foreground"
													title="Clear output (removes it from test scope — other nodes can no longer reference this var)"
												>
													<X className="h-3 w-3" />
												</button>
											</div>
											<OutputPreview value={testOutput} />
										</div>
									)}
								</>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
}
