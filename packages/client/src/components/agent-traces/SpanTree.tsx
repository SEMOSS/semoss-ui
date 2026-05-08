import {
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	Clock,
	Code,
	Copy,
	Database,
	FileText,
	Globe,
	Terminal,
	Wrench,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button, toast } from "@semoss/ui/next";
import type { AgentTraceStep } from "./types";

interface SpanTreeProps {
	steps: AgentTraceStep[];
	harnessName?: string;
	expandedStepId?: string;
}

interface StepNodeProps {
	step: AgentTraceStep;
	index: number;
	expanded: boolean;
	onToggle: () => void;
	harnessName?: string;
}

function computeDuration(step: AgentTraceStep): string {
	if (step.DURATION_MS != null && step.DURATION_MS > 0) {
		const ms = step.DURATION_MS;
		if (ms < 1000) return `${ms}ms`;
		return `${(ms / 1000).toFixed(1)}s`;
	}
	try {
		const diff =
			new Date(step.END_TIME.replace(" ", "T")).getTime() -
			new Date(step.START_TIME.replace(" ", "T")).getTime();
		if (Number.isNaN(diff) || diff < 0) return "—";
		if (diff === 0) return "< 1s";
		if (diff < 1000) return `${diff}ms`;
		return `${(diff / 1000).toFixed(1)}s`;
	} catch {
		return "—";
	}
}

function getToolIcon(step: AgentTraceStep) {
	if (step.IS_MCP) {
		if (step.ENGINE_TYPE === "DATABASE")
			return <Database className="size-3.5 text-blue-500" />;
		if (step.ENGINE_TYPE === "VECTOR")
			return <Globe className="size-3.5 text-teal-500" />;
		return <Database className="size-3.5 text-blue-500" />;
	}
	const name = step.TOOL_NAME?.toLowerCase() ?? "";
	if (name === "bash" || name === "execute")
		return <Terminal className="size-3.5 text-green-500" />;
	if (name === "read" || name === "readfile")
		return <FileText className="size-3.5 text-amber-500" />;
	if (name === "write" || name === "writefile" || name === "edit")
		return <Code className="size-3.5 text-purple-500" />;
	return <Wrench className="size-3.5 text-amber-500" />;
}

function getSourceBadge(step: AgentTraceStep, harnessName?: string) {
	// SDK-based harnesses — tools executed by external agent SDK
	const sdkHarnesses: Record<string, string> = {
		claude_code: "Claude Code SDK",
		github_copilot: "GitHub Copilot SDK",
		github_copilot_py: "GitHub Copilot SDK",
	};
	if (harnessName && sdkHarnesses[harnessName]) {
		return (
			<span className="inline-flex items-center rounded-full bg-violet-100 px-1.5 py-0.5 font-medium text-[9px] text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
				{sdkHarnesses[harnessName]}
			</span>
		);
	}

	// MCP tool routed through a SEMOSS engine (DATABASE, MODEL, VECTOR, etc.)
	if (step.IS_MCP && step.ENGINE_TYPE) {
		return (
			<span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 font-medium text-[9px] text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
				Engine MCP · {step.ENGINE_TYPE}
			</span>
		);
	}

	// MCP tool routed through a project/app (no ENGINE_TYPE means it's a project)
	if (step.IS_MCP && step.ENGINE_ID) {
		return (
			<span className="inline-flex items-center rounded-full bg-orange-100 px-1.5 py-0.5 font-medium text-[9px] text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
				App MCP
			</span>
		);
	}

	// Internal MCP (no engine routing)
	if (step.IS_MCP) {
		return (
			<span className="inline-flex items-center rounded-full bg-sky-100 px-1.5 py-0.5 font-medium text-[9px] text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
				Internal MCP
			</span>
		);
	}

	// Direct internal tool
	return (
		<span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 font-medium text-[9px] text-gray-600 dark:bg-gray-800 dark:text-gray-400">
			Internal
		</span>
	);
}

// Interactive JSON tree viewer (inspired by audit logs JSONTreeView)
function JsonViewer({
	data,
	defaultExpanded = true,
}: {
	data: unknown;
	defaultExpanded?: boolean;
}) {
	const [expanded, setExpanded] = useState(defaultExpanded);

	if (data === null) return <span className="text-blue-500">null</span>;
	if (data === undefined)
		return <span className="text-blue-500">undefined</span>;
	if (typeof data === "string") {
		const str = data as string;
		const charCount = str.length;
		return (
			<span className="text-rose-600 dark:text-rose-400">
				"{str}"
				<span className="ml-1 text-[10px] text-muted-foreground">
					({charCount} char{charCount === 1 ? "" : "s"})
				</span>
			</span>
		);
	}
	if (typeof data === "number")
		return (
			<span className="text-emerald-600 dark:text-emerald-400">
				{data}
				<span className="ml-1 text-[10px] text-muted-foreground">
					(number)
				</span>
			</span>
		);
	if (typeof data === "boolean")
		return (
			<span className="text-blue-600 dark:text-blue-400">
				{data.toString()}
				<span className="ml-1 text-[10px] text-muted-foreground">
					(bool)
				</span>
			</span>
		);

	const isArray = Array.isArray(data);
	const entries = Object.entries(data as Record<string, unknown>);
	const isEmpty = entries.length === 0;

	if (isEmpty)
		return (
			<span className="text-muted-foreground">
				{isArray ? "[]" : "{}"}
			</span>
		);

	// Build first-key preview for non-empty containers
	const firstKeyHint = entries.length > 0 ? entries[0][0] : "";
	const previewLabel = isArray
		? `[${entries.length} item${entries.length === 1 ? "" : "s"}]`
		: `{${entries.length} field${entries.length === 1 ? "" : "s"}${firstKeyHint ? `: ${firstKeyHint}` : ""}${entries.length > 1 ? ", ..." : ""}}`;

	return (
		<div className="ml-0">
			<button
				type="button"
				className="inline-flex items-center gap-0.5 font-mono text-muted-foreground hover:text-foreground"
				onClick={() => setExpanded(!expanded)}
			>
				{expanded ? (
					<ChevronDown className="inline size-3" />
				) : (
					<ChevronRight className="inline size-3" />
				)}
				<span
					className={
						isArray
							? "text-cyan-600 dark:text-cyan-400"
							: "text-amber-600 dark:text-amber-400"
					}
				>
					{previewLabel}
				</span>
			</button>
			{expanded && (
				<div className="ml-4 border-border/50 border-l pl-2">
					{entries.map(([key, value]) => (
						<div key={key} className="my-0.5">
							{!isArray && (
								<span className="text-sky-600 dark:text-sky-400">
									"{key}"
								</span>
							)}
							{!isArray && (
								<span className="text-muted-foreground">
									:{" "}
								</span>
							)}
							{isArray && (
								<span className="mr-1 text-[10px] text-muted-foreground">
									{key}.
								</span>
							)}
							{value !== null && typeof value === "object" ? (
								<JsonViewer
									data={value}
									defaultExpanded={false}
								/>
							) : (
								<JsonViewer data={value} />
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function parseJsonSafe(input: string): unknown | null {
	try {
		return JSON.parse(input);
	} catch {
		return null;
	}
}

function tryExtractSummary(json: string): string | null {
	try {
		const parsed = JSON.parse(json);
		if (typeof parsed === "string")
			return parsed.length > 120 ? `${parsed.slice(0, 120)}…` : parsed;
		if (parsed.command) return parsed.command;
		if (parsed.query) return parsed.query;
		if (parsed.path) return parsed.path;
		if (parsed.file_path) return parsed.file_path;
		if (parsed.content)
			return typeof parsed.content === "string"
				? parsed.content.slice(0, 80)
				: null;
		return null;
	} catch {
		return json.length > 120 ? `${json.slice(0, 120)}…` : json;
	}
}

const StepNode = ({
	step,
	index,
	expanded,
	onToggle,
	harnessName,
}: StepNodeProps) => {
	const isSuccess = step.STATUS === "SUCCESS";
	const handleCopyInput = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			try {
				navigator.clipboard.writeText(step.TOOL_INPUT_JSON || "");
				toast.success("Input copied to clipboard");
			} catch {
				toast.error("Failed to copy input");
			}
		},
		[step.TOOL_INPUT_JSON],
	);

	const handleCopyOutput = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			try {
				navigator.clipboard.writeText(step.OUTPUT_TEXT || "");
				toast.success("Output copied to clipboard");
			} catch {
				toast.error("Failed to copy output");
			}
		},
		[step.OUTPUT_TEXT],
	);

	const handleCopyId = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			try {
				navigator.clipboard.writeText(step.ENGINE_ID || "");
				toast.success("Engine ID copied to clipboard");
			} catch {
				toast.error("Failed to copy Engine ID");
			}
		},
		[step.ENGINE_ID],
	);

	const inputSummary = step.TOOL_INPUT_JSON
		? tryExtractSummary(step.TOOL_INPUT_JSON)
		: null;

	console.log(step);
	return (
		<div className="border-border border-b last:border-b-0">
			<button
				type="button"
				className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
				onClick={onToggle}
			>
				<span className="w-4 shrink-0 text-muted-foreground">
					{expanded ? (
						<ChevronDown className="size-3.5" />
					) : (
						<ChevronRight className="size-3.5" />
					)}
				</span>

				{/* Step number */}
				<span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted font-mono text-[10px] text-muted-foreground">
					{index + 1}
				</span>

				{/* Status */}
				{isSuccess ? (
					<CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
				) : (
					<XCircle className="size-3.5 shrink-0 text-red-500" />
				)}

				{/* Tool icon */}
				{getToolIcon(step)}

				{/* Tool name */}
				<span className="shrink-0 font-semibold text-sm">
					{step.TOOL_NAME?.split("_").pop() ?? step.TOOL_NAME}
				</span>

				{/* Source badge */}
				{getSourceBadge(step, harnessName)}

				{/* Input summary (inline preview) */}
				{inputSummary && (
					<span className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">
						{inputSummary}
					</span>
				)}

				{/* Duration */}
				<span className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
					<Clock className="size-3" />
					{computeDuration(step)}
				</span>
			</button>

			{expanded && (
				<div className="space-y-3 border-border border-t bg-muted/10 px-4 py-3">
					{/* Metadata grid */}
					<div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
						<div>
							<p className="font-medium text-muted-foreground">
								Tool Call ID
							</p>
							<p className="truncate font-mono">
								{step.TOOL_CALL_ID}
							</p>
						</div>
						<div>
							<p className="font-medium text-muted-foreground">
								Step
							</p>
							<p>
								#{step.STEP_NUMBER + 1} · {step.STEP_TYPE}
							</p>
						</div>
						<div>
							<p className="font-medium text-muted-foreground">
								Source
							</p>
							<p>
								{(() => {
									const sdkNames: Record<string, string> = {
										claude_code: "Claude Code SDK",
										github_copilot: "GitHub Copilot SDK",
										github_copilot_py: "GitHub Copilot SDK",
									};
									if (harnessName && sdkNames[harnessName])
										return sdkNames[harnessName];
									if (step.IS_MCP && step.ENGINE_TYPE)
										return `Engine MCP (${step.ENGINE_TYPE})`;
									if (step.IS_MCP && step.ENGINE_ID)
										return "App MCP";
									if (step.IS_MCP) return "Internal MCP";
									return "Internal";
								})()}
							</p>
						</div>
						{step.ENGINE_ID && (
							<div>
								<p className="font-medium text-muted-foreground">
									Engine ID
								</p>
								<div className="flex min-w-0 items-center gap-1">
									<span className="truncate font-mono">
										{step.ENGINE_ID}
									</span>
									<Button
										variant="ghost"
										size="icon-sm"
										className="h-6 w-6"
										onClick={handleCopyId}
										aria-label="Copy engine ID"
										title="Copy engine ID"
									>
										<Copy className="size-3.5" />
									</Button>
								</div>
							</div>
						)}
						<div>
							<p className="font-medium text-muted-foreground">
								Start
							</p>
							<div className="mt-1 flex min-w-0 items-center gap-1">
								<span className="font-mono">
									{step.START_TIME}
								</span>
							</div>
						</div>
						<div>
							<p className="font-medium text-muted-foreground">
								End
							</p>
							<div className="mt-1 flex min-w-0 items-center gap-1">
								<span className="font-mono">
									{step.END_TIME}
								</span>
							</div>
						</div>
						{step.TOOL_GIT_COMMIT && (
							<div>
								<p className="font-medium text-muted-foreground">
									Tool Git Commit
								</p>
								<div className="flex min-w-0 items-center gap-1">
									<span className="truncate font-mono">
										{step.TOOL_GIT_COMMIT}
									</span>
								</div>
							</div>
						)}
					</div>

					{/* Input */}
					{step.TOOL_INPUT_JSON && (
						<div>
							<div className="mb-1.5 flex items-center justify-between">
								<p className="font-semibold text-xs">Input</p>
								<button
									type="button"
									onClick={handleCopyInput}
									className="text-muted-foreground text-xs transition-colors hover:text-foreground"
								>
									Copy
								</button>
							</div>
							<div className="max-h-64 overflow-auto rounded-md border border-border bg-background p-3 font-mono text-[12px] leading-relaxed">
								{(() => {
									const parsed = parseJsonSafe(
										step.TOOL_INPUT_JSON,
									);
									if (parsed !== null) {
										return (
											<JsonViewer
												data={parsed}
												defaultExpanded={true}
											/>
										);
									}
									return (
										<pre className="whitespace-pre-wrap">
											{step.TOOL_INPUT_JSON}
										</pre>
									);
								})()}
							</div>
						</div>
					)}

					{/* Output */}
					{step.OUTPUT_TEXT && (
						<div>
							<div className="mb-1.5 flex items-center justify-between">
								<p className="font-semibold text-xs">Output</p>
								<button
									type="button"
									onClick={handleCopyOutput}
									className="text-muted-foreground text-xs transition-colors hover:text-foreground"
								>
									Copy
								</button>
							</div>
							<div className="max-h-72 overflow-auto rounded-md border border-border bg-background p-3 font-mono text-[12px] leading-relaxed">
								{(() => {
									const parsed = parseJsonSafe(
										step.OUTPUT_TEXT,
									);
									if (parsed !== null) {
										return (
											<JsonViewer
												data={parsed}
												defaultExpanded={false}
											/>
										);
									}
									return (
										<pre className="whitespace-pre-wrap">
											{step.OUTPUT_TEXT.length > 3000
												? `${step.OUTPUT_TEXT.slice(0, 3000)}\n\n… (truncated ${step.OUTPUT_TEXT.length - 3000} chars)`
												: step.OUTPUT_TEXT}
										</pre>
									);
								})()}
							</div>
						</div>
					)}

					{/* Error */}
					{step.ERROR_MESSAGE && (
						<div>
							<p className="mb-1.5 font-semibold text-red-600 text-xs">
								Error
							</p>
							<pre className="max-h-40 overflow-auto rounded-md border border-red-200 bg-red-50 p-3 font-mono text-[11px] text-red-700 leading-relaxed dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
								{step.ERROR_MESSAGE}
							</pre>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export const SpanTree = ({
	steps,
	harnessName,
	expandedStepId,
}: SpanTreeProps) => {
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

	useEffect(() => {
		if (expandedStepId) {
			setExpandedIds(new Set([expandedStepId]));
		}
	}, [expandedStepId]);

	if (!steps || steps.length === 0) {
		return (
			<p className="py-4 text-center text-muted-foreground text-sm">
				No tool steps recorded for this trace.
			</p>
		);
	}

	const toggle = (id: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	// Sort by step number (chronological — earliest first)
	const sorted = [...steps].sort((a, b) => a.STEP_NUMBER - b.STEP_NUMBER);

	return (
		<div className="divide-y-0 rounded-lg border border-border bg-card">
			{sorted.map((step, i) => (
				<StepNode
					key={step.STEP_ID}
					step={step}
					index={i}
					expanded={expandedIds.has(step.STEP_ID)}
					onToggle={() => toggle(step.STEP_ID)}
					harnessName={harnessName}
				/>
			))}
		</div>
	);
};
