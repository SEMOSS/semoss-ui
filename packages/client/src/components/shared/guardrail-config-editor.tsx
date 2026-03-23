import {
	AlertCircle,
	ArrowDown,
	ArrowUp,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Code2,
	LayoutGrid,
	Lock,
	Maximize2,
	Minimize2,
	Pencil,
	Save,
	Search,
	Shield,
	Trash2,
	X,
} from "lucide-react";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	Input,
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	InputGroupText,
	Label,
	P,
	Textarea,
} from "@semoss/ui/next";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PipelineReactor = {
	reactorClass: string;
	params: Record<string, unknown>;
};

export type PipelineStep = {
	input: PipelineReactor[];
	output: PipelineReactor[];
};

export type GuardrailConfig = {
	pipelines: Record<string, PipelineStep>;
};

export type GuardrailConfigEditorProps = {
	initialData: GuardrailConfig;
	onSave?: (data: GuardrailConfig) => Promise<void> | void;
	readOnly?: boolean;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

const useDebounce = <T,>(value: T, delay = 400): T => {
	const [dv, setDv] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setDv(value), delay);
		return () => clearTimeout(t);
	}, [value, delay]);
	return dv;
};

const useKeyboardShortcut = (
	key: string,
	cb: () => void,
	deps: unknown[] = [],
) => {
	useEffect(() => {
		const h = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === key) {
				e.preventDefault();
				cb();
			}
		};
		window.addEventListener("keydown", h);
		return () => window.removeEventListener("keydown", h);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toShortName = (cls: string) => cls.split(".").pop() ?? cls;

// ─── ParamField ───────────────────────────────────────────────────────────────

const ParamField: React.FC<{
	paramKey: string;
	value: unknown;
	onChange: (key: string, val: unknown) => void;
	disabled?: boolean;
}> = ({ paramKey, value, onChange, disabled = false }) => {
	const isArr = Array.isArray(value);
	const isObj = !isArr && typeof value === "object" && value !== null;
	const isComplex = isArr || isObj;

	const [jsonText, setJsonText] = useState(() =>
		isComplex ? JSON.stringify(value, null, 2) : "",
	);
	const [jsonError, setJsonError] = useState<string | null>(null);

	const handleJson = (text: string) => {
		setJsonText(text);
		try {
			onChange(paramKey, JSON.parse(text));
			setJsonError(null);
		} catch (e) {
			setJsonError(e instanceof Error ? e.message : "Invalid JSON");
		}
	};

	if (isComplex) {
		return (
			<div className="space-y-1">
				<Textarea
					value={jsonText}
					onChange={(e) => handleJson(e.target.value)}
					disabled={disabled}
					rows={3}
					style={{ height: "5rem" }}
					className={`w-full resize-y font-mono text-xs ${
						jsonError
							? "border-destructive focus:border-destructive"
							: "border-border"
					} ${disabled ? "cursor-not-allowed bg-muted opacity-60" : ""}`}
					placeholder={
						isArr ? '["item1", "item2"]' : '{"key": "value"}'
					}
				/>
				{jsonError ? (
					<div className="flex items-center gap-1 text-[11px] text-destructive">
						<AlertCircle size={11} />
						<span className="truncate">{jsonError}</span>
					</div>
				) : (
					<div className="flex items-center gap-1 text-[11px] text-chart-2">
						<CheckCircle2 size={11} />
						<span>Valid JSON</span>
					</div>
				)}
			</div>
		);
	}

	if (typeof value === "boolean") {
		return (
			<select
				value={String(value)}
				onChange={(e) => onChange(paramKey, e.target.value === "true")}
				disabled={disabled}
				className={`h-8 w-full rounded border border-border bg-card px-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
					disabled ? "cursor-not-allowed opacity-60" : ""
				}`}
			>
				<option value="true">true</option>
				<option value="false">false</option>
			</select>
		);
	}

	if (typeof value === "number") {
		return (
			<Input
				type="number"
				value={String(value ?? "")}
				onChange={(e) => onChange(paramKey, Number(e.target.value))}
				disabled={disabled}
				className={`w-full text-sm ${
					disabled ? "cursor-not-allowed bg-muted opacity-60" : ""
				}`}
			/>
		);
	}

	return (
		<Input
			value={String(value ?? "")}
			onChange={(e) => onChange(paramKey, e.target.value)}
			disabled={disabled}
			className={`w-full text-sm ${
				disabled ? "cursor-not-allowed bg-muted opacity-60" : ""
			}`}
		/>
	);
};

// ─── ReactorCard ──────────────────────────────────────────────────────────────

interface ReactorCardProps {
	reactor: PipelineReactor;
	direction: "input" | "output";
	disabled?: boolean;
	onUpdate: (updated: PipelineReactor) => void;
	onDelete: () => void;
}

const ReactorCard = memo<ReactorCardProps>(
	({ reactor, direction, disabled, onUpdate, onDelete }) => {
		const [expanded, setExpanded] = useState(false);
		const name = toShortName(reactor.reactorClass ?? "");
		const accentBorder =
			direction === "input" ? "border-l-primary" : "border-l-chart-2";

		const handleParamChange = (key: string, val: unknown) => {
			onUpdate({
				...reactor,
				params: { ...(reactor.params ?? {}), [key]: val },
			});
		};

		const handleHeaderInteract = (
			e: React.MouseEvent | React.KeyboardEvent,
		) => {
			if (
				(e.target as HTMLElement).closest(
					'button[data-action="delete"]',
				)
			) {
				return;
			}
			if (
				e.type === "keydown" &&
				(e as React.KeyboardEvent).key !== "Enter"
			) {
				return;
			}
			setExpanded((v) => !v);
		};

		const params = reactor.params ?? {};

		return (
			<div
				className={`rounded-md border border-border border-l-2 ${accentBorder} bg-card transition-all`}
			>
				{/* Header */}
				<button
					type="button"
					onClick={handleHeaderInteract}
					onKeyDown={handleHeaderInteract}
					className="flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent"
				>
					<div className="min-w-0 flex-1">
						<span
							className="block truncate font-medium text-foreground text-sm"
							title={name}
						>
							{name}
						</span>
						<span
							className="block truncate text-[11px] text-muted-foreground"
							title={reactor.reactorClass}
						>
							{reactor.reactorClass}
						</span>
					</div>
					<div className="flex shrink-0 items-center gap-1.5">
						<span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
							{Object.keys(params).length}p
						</span>
						{!disabled && (
							<button
								type="button"
								data-action="delete"
								onClick={(e) => {
									e.stopPropagation();
									onDelete();
								}}
								title="Remove interceptor"
								className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
							>
								<Trash2 size={12} />
							</button>
						)}
						{expanded ? (
							<ChevronUp
								size={13}
								className="text-muted-foreground"
							/>
						) : (
							<ChevronDown
								size={13}
								className="text-muted-foreground"
							/>
						)}
					</div>
				</button>

				{/* Body */}
				{expanded && (
					<div className="space-y-3 border-border border-t px-3 py-3">
						{/* Reactor Class — always read-only */}
						<div className="space-y-1.5">
							<div className="flex items-center gap-1.5">
								<Label className="block font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
									Reactor Class
								</Label>
								<span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
									<Lock size={9} />
									read-only
								</span>
							</div>
							<Input
								value={reactor.reactorClass ?? ""}
								disabled={true}
								className="w-full cursor-not-allowed bg-muted font-mono text-xs opacity-60"
							/>
						</div>

						{/* Params */}
						{Object.keys(params).length > 0 && (
							<div className="space-y-2">
								<Label className="block font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
									Parameters
								</Label>
								<div className="grid gap-3">
									{Object.entries(params).map(
										([key, val]) => {
											const isEditable =
												key === "directParameters" &&
												!disabled;

											return (
												<div
													key={key}
													className={`grid grid-cols-[140px_1fr] items-start gap-2 rounded-md p-1.5 transition-colors ${
														isEditable
															? "bg-primary/5 ring-1 ring-primary/20"
															: ""
													}`}
												>
													<div className="pt-1">
														<div className="flex flex-wrap items-center gap-1">
															<span
																className="block truncate font-mono text-foreground text-xs"
																title={key}
															>
																{key}
															</span>
															{isEditable ? (
																<span className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1 py-0.5 font-semibold text-[9px] text-primary">
																	<Pencil
																		size={8}
																	/>
																	editable
																</span>
															) : (
																<span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
																	<Lock
																		size={8}
																	/>
																</span>
															)}
														</div>
														<span className="text-[10px] text-muted-foreground">
															{Array.isArray(val)
																? "array"
																: typeof val}
														</span>
													</div>
													<ParamField
														paramKey={key}
														value={val}
														onChange={
															handleParamChange
														}
														disabled={!isEditable}
													/>
												</div>
											);
										},
									)}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		);
	},
);
ReactorCard.displayName = "ReactorCard";

// ─── PipelineCard ─────────────────────────────────────────────────────────────

interface PipelineCardProps {
	name: string;
	pipeline: PipelineStep;
	isExpanded: boolean;
	onToggle: () => void;
	onUpdate: (updated: PipelineStep) => void;
	// ✅ Pipeline-level delete
	onDelete: () => void;
	disabled?: boolean;
}

const PipelineCard = memo<PipelineCardProps>(
	({
		name,
		pipeline,
		isExpanded,
		onToggle,
		onUpdate,
		onDelete,
		disabled,
	}) => {
		const inputList = pipeline?.input ?? [];
		const outputList = pipeline?.output ?? [];

		const updateReactor = (
			dir: "input" | "output",
			idx: number,
			updated: PipelineReactor,
		) => {
			const list = dir === "input" ? inputList : outputList;
			onUpdate({
				...pipeline,
				[dir]: list.map((r, i) => (i === idx ? updated : r)),
			});
		};

		const deleteReactor = (dir: "input" | "output", idx: number) => {
			const list = dir === "input" ? inputList : outputList;
			onUpdate({
				...pipeline,
				[dir]: list.filter((_, i) => i !== idx),
			});
		};

		const totalReactors = inputList.length + outputList.length;

		return (
			<Card className="mb-3 w-full gap-0 overflow-hidden rounded-lg py-0 transition-all">
				{/* Pipeline Header — split so delete doesn't trigger expand */}
				<div
					className={`flex w-full items-center justify-between px-4 py-3 transition-colors ${
						isExpanded
							? "rounded-t-lg bg-secondary"
							: "rounded-lg bg-secondary"
					}`}
				>
					{/* Left — clicks toggle expand */}
					<button
						type="button"
						onClick={onToggle}
						className="flex flex-1 items-center gap-3 text-left hover:opacity-80"
					>
						<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
							<Shield size={15} className="text-primary" />
						</div>
						<div className="text-left">
							<span className="block font-semibold text-foreground text-sm">
								{name}
							</span>
							<span className="text-[11px] text-muted-foreground">
								{totalReactors} total reactor
								{totalReactors !== 1 ? "s" : ""}
							</span>
						</div>
					</button>

					{/* Right — counters + delete + chevron */}
					<div className="flex items-center gap-2">
						<div className="flex gap-2 text-xs">
							<span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
								<ArrowDown size={10} />
								{inputList.length}
							</span>
							<span className="flex items-center gap-1 rounded-full bg-chart-2/10 px-2 py-0.5 text-chart-2">
								<ArrowUp size={10} />
								{outputList.length}
							</span>
						</div>

						{/* ✅ Pipeline-level delete — hidden when globally readOnly */}
						{!disabled && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onDelete();
								}}
								title={`Remove "${name}" pipeline`}
								className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
							>
								<Trash2 size={14} />
							</button>
						)}

						<button
							type="button"
							onClick={onToggle}
							className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent"
						>
							{isExpanded ? (
								<ChevronUp size={16} />
							) : (
								<ChevronDown size={16} />
							)}
						</button>
					</div>
				</div>

				{/* Pipeline Body */}
				{isExpanded && (
					<div className="space-y-4 p-4">
						{/* Input Section */}
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<span className="flex items-center gap-1.5 font-semibold text-primary text-sm">
									<ArrowDown size={13} />
									Input Interceptors
								</span>
								<span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-[11px] text-primary">
									{inputList.length}
								</span>
							</div>
							{inputList.length === 0 ? (
								<p className="px-2 text-muted-foreground text-xs italic">
									No input interceptors configured.
								</p>
							) : (
								<div className="space-y-2 border-primary/30 border-l-2 pl-3">
									{inputList.map((r, idx) => (
										<ReactorCard
											key={`input-${r.reactorClass}-${idx}`}
											reactor={r}
											direction="input"
											disabled={disabled}
											onUpdate={(u) =>
												updateReactor("input", idx, u)
											}
											onDelete={() =>
												deleteReactor("input", idx)
											}
										/>
									))}
								</div>
							)}
						</div>

						<div className="border-border border-t border-dashed" />

						{/* Output Section */}
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<span className="flex items-center gap-1.5 font-semibold text-chart-2 text-sm">
									<ArrowUp size={13} />
									Output Interceptors
								</span>
								<span className="rounded-full bg-chart-2/10 px-2 py-0.5 font-medium text-[11px] text-chart-2">
									{outputList.length}
								</span>
							</div>
							{outputList.length === 0 ? (
								<p className="px-2 text-muted-foreground text-xs italic">
									No output interceptors configured.
								</p>
							) : (
								<div className="space-y-2 border-chart-2/30 border-l-2 pl-3">
									{outputList.map((r, idx) => (
										<ReactorCard
											key={`output-${r.reactorClass}-${idx}`}
											reactor={r}
											direction="output"
											disabled={disabled}
											onUpdate={(u) =>
												updateReactor("output", idx, u)
											}
											onDelete={() =>
												deleteReactor("output", idx)
											}
										/>
									))}
								</div>
							)}
						</div>
					</div>
				)}
			</Card>
		);
	},
);
PipelineCard.displayName = "PipelineCard";

// ─── GuardrailConfigEditor ────────────────────────────────────────────────────

export const GuardrailConfigEditor: React.FC<GuardrailConfigEditorProps> = ({
	initialData,
	onSave,
	readOnly = false,
}) => {
	const [data, setData] = useState<GuardrailConfig>(() => ({
		pipelines: initialData?.pipelines ?? {},
	}));
	const [viewMode, setViewMode] = useState<"gui" | "json">("gui");
	const [jsonText, setJsonText] = useState(() =>
		JSON.stringify({ pipelines: initialData?.pipelines ?? {} }, null, 2),
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedPipelines, setExpandedPipelines] = useState<Set<string>>(
		() => new Set(Object.keys(initialData?.pipelines ?? {}).slice(0, 1)),
	);
	const [expandAll, setExpandAll] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);
	const [saving, setSaving] = useState(false);
	const [initialSnapshot] = useState(() =>
		JSON.stringify({ pipelines: initialData?.pipelines ?? {} }),
	);

	const debouncedSearch = useDebounce(searchQuery, 400);
	const safePipelines = data?.pipelines ?? {};

	useEffect(() => {
		setHasChanges(JSON.stringify(data) !== initialSnapshot);
	}, [data, initialSnapshot]);

	useEffect(() => {
		setJsonText(JSON.stringify(data, null, 2));
	}, [data]);

	useKeyboardShortcut("s", () => {
		if (hasChanges && !readOnly) handleSave();
	}, [hasChanges, data, readOnly]);

	const handleSave = useCallback(async () => {
		if (!onSave) return;
		setSaving(true);
		try {
			await onSave(data);
		} finally {
			setSaving(false);
		}
	}, [data, onSave]);

	const toggleExpandAll = () => {
		const next = !expandAll;
		setExpandAll(next);
		setExpandedPipelines(
			next ? new Set(Object.keys(safePipelines)) : new Set(),
		);
	};

	const togglePipeline = (name: string) => {
		setExpandedPipelines((prev) => {
			const next = new Set(prev);
			next.has(name) ? next.delete(name) : next.add(name);
			return next;
		});
	};

	const updatePipeline = useCallback(
		(name: string, updated: PipelineStep) => {
			setData((d) => ({
				...d,
				pipelines: { ...(d?.pipelines ?? {}), [name]: updated },
			}));
		},
		[],
	);

	// ✅ Pipeline-level delete
	const deletePipeline = useCallback((name: string) => {
		setData((d) => {
			const next = { ...(d?.pipelines ?? {}) };
			delete next[name];
			return { ...d, pipelines: next };
		});
		setExpandedPipelines((prev) => {
			const next = new Set(prev);
			next.delete(name);
			return next;
		});
	}, []);

	const filteredPipelines = useMemo(() => {
		const entries = Object.entries(safePipelines);
		if (!debouncedSearch) return entries;
		return entries.filter(([n]) =>
			n.toLowerCase().includes(debouncedSearch.toLowerCase()),
		);
	}, [safePipelines, debouncedSearch]);

	const pipelineCount = Object.keys(safePipelines).length;

	const totalReactors = useMemo(
		() =>
			Object.values(safePipelines).reduce(
				(s, p) =>
					s + (p?.input?.length ?? 0) + (p?.output?.length ?? 0),
				0,
			),
		[safePipelines],
	);

	return (
		<div className="space-y-4">
			{/* ── Sticky Header ─────────────────────────────────────────── */}
			<div className="sticky top-0 z-40 rounded-lg border border-border bg-card/95 p-4 shadow-sm backdrop-blur-sm">
				<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
					<div className="flex flex-wrap items-center gap-2">
						<Badge color="info" className="px-2 py-1 text-xs">
							{pipelineCount}{" "}
							{pipelineCount === 1 ? "Pipeline" : "Pipelines"}
						</Badge>
						<Badge className="border-border bg-muted px-2 py-1 text-muted-foreground text-xs">
							{totalReactors} Reactors
						</Badge>
						{!readOnly && (
							<span className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 font-medium text-[10px] text-primary">
								<Pencil size={9} />
								directParameters editable
							</span>
						)}
						{debouncedSearch && (
							<span className="text-muted-foreground text-xs italic">
								(filtered)
							</span>
						)}
					</div>

					<div className="flex items-center gap-2">
						{viewMode === "gui" && (
							<Button
								variant="outline"
								size="sm"
								onClick={toggleExpandAll}
								className="flex items-center gap-1.5 border-border bg-background text-foreground hover:bg-accent hover:text-foreground"
							>
								{expandAll ? (
									<Minimize2 size={13} />
								) : (
									<Maximize2 size={13} />
								)}
								<span className="hidden sm:inline">
									{expandAll ? "Collapse All" : "Expand All"}
								</span>
							</Button>
						)}

						<div className="flex overflow-hidden rounded-md border border-border">
							{(["gui", "json"] as const).map((mode) => (
								<button
									key={mode}
									type="button"
									onClick={() => setViewMode(mode)}
									className={`flex items-center gap-1.5 px-3 py-1.5 font-medium text-xs transition-colors ${
										viewMode === mode
											? "bg-primary text-primary-foreground"
											: "bg-background text-foreground hover:bg-accent"
									}`}
								>
									{mode === "gui" ? (
										<LayoutGrid size={13} />
									) : (
										<Code2 size={13} />
									)}
									{mode.toUpperCase()}
								</button>
							))}
						</div>

						{!readOnly && (
							<Button
								size="sm"
								color="primary"
								onClick={handleSave}
								disabled={!hasChanges || saving}
								title="Ctrl+S / Cmd+S"
								className="flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
							>
								{saving ? (
									<div className="size-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
								) : (
									<Save size={13} />
								)}
								<span>{saving ? "Saving..." : "Save"}</span>
							</Button>
						)}
					</div>
				</div>

				{viewMode === "gui" && (
					<InputGroup>
						<InputGroupAddon align="inline-start">
							<InputGroupText>
								<Search
									size={16}
									className="text-muted-foreground"
								/>
							</InputGroupText>
						</InputGroupAddon>
						<InputGroupInput
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search pipelines by name..."
							className="text-foreground text-sm"
						/>
						{searchQuery && (
							<InputGroupAddon align="inline-end">
								<InputGroupButton
									size="icon-xs"
									variant="ghost"
									onClick={() => setSearchQuery("")}
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									<X size={16} />
								</InputGroupButton>
							</InputGroupAddon>
						)}
					</InputGroup>
				)}
			</div>

			{/* ── JSON Mode (read-only view) ─────────────────────────────── */}
			{viewMode === "json" && (
				<div className="space-y-2">
					<div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-muted-foreground text-xs">
						<Lock size={12} className="shrink-0" />
						<span>
							JSON view is read-only. Switch to{" "}
							<button
								type="button"
								onClick={() => setViewMode("gui")}
								className="font-semibold text-primary underline-offset-2 hover:underline"
							>
								GUI mode
							</button>{" "}
							to edit{" "}
							<code className="font-mono text-foreground">
								directParameters
							</code>{" "}
							or remove interceptors and pipelines.
						</span>
					</div>
					<Textarea
						value={jsonText}
						disabled={true}
						rows={30}
						className="w-full cursor-not-allowed resize-y rounded-lg border border-border bg-muted font-mono text-xs leading-relaxed opacity-80"
					/>
				</div>
			)}

			{/* ── GUI Mode ──────────────────────────────────────────────── */}
			{viewMode === "gui" && (
				<div>
					{filteredPipelines.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center gap-3 py-12">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
									<Shield
										size={22}
										className="text-muted-foreground/50"
									/>
								</div>
								<P className="text-muted-foreground text-sm">
									{debouncedSearch
										? `No pipelines match "${debouncedSearch}".`
										: "No pipelines configured."}
								</P>
							</CardContent>
						</Card>
					) : (
						filteredPipelines.map(([name, pipeline]) => (
							<PipelineCard
								key={name}
								name={name}
								pipeline={pipeline}
								isExpanded={expandedPipelines.has(name)}
								onToggle={() => togglePipeline(name)}
								onUpdate={(updated) =>
									updatePipeline(name, updated)
								}
								// ✅ Pipeline-level delete wired
								onDelete={() => deletePipeline(name)}
								disabled={readOnly}
							/>
						))
					)}
				</div>
			)}
		</div>
	);
};
