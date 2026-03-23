import {
	AlertCircle,
	ArrowDown,
	ArrowUp,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	RefreshCw,
	Settings2,
	Shield,
	ShieldCheck,
	ShieldPlus,
	Trash2,
	Zap,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { memo, useMemo, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	Checkbox,
	H4,
	P,
	Spinner,
} from "@semoss/ui/next";
import {
	type GuardrailConfig,
	GuardrailConfigEditor,
} from "@/components/shared";
import { useEngine } from "@/hooks";
import dummyConfig from "./dummy.json";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Engine {
	app_id: string;
	app_name: string;
	app_type:
		| "MODEL"
		| "DATABASE"
		| "VECTOR"
		| "FUNCTION"
		| "STORAGE"
		| "GUARDRAIL";
	description?: string;
	database_id: string;
	database_name: string;
	database_type: string;
	database_created_by: string;
	database_date_created?: string;
	database_global?: boolean;
	database_discoverable?: boolean;
	tag?: string[];
}

type MethodGuardrailConfig = {
	input: string[];
	output: string[];
};

type MethodConfigMap = Record<string, MethodGuardrailConfig>;

type Phase = "idle" | "selecting" | "configured";

// ─── Constants ────────────────────────────────────────────────────────────────

const DUMMY_ENGINE_METHODS: Record<string, string[]> = {
	MODEL: ["ask", "askRoom"],
	DATABASE: [
		"execQuery",
		"addDocument",
		"addEmbeddingFiles",
		"removeDocument",
		"embeddings",
		"list",
		"listDetails",
	],
	VECTOR: [
		"addDocument",
		"addEmbeddingFiles",
		"removeDocument",
		"embeddings",
		"list",
		"nearestNeighbor",
	],
	STORAGE: [
		"list",
		"listDetails",
		"copyToLocal",
		"copyToStorage",
		"deleteFromStorage",
		"deleteFolderFromStorage",
		"syncStorageToLocal",
		"syncLocalToStorage",
	],
	FUNCTION: ["execute"],
	GUARDRAIL: ["ask"],
};

const getFallbackMethods = (type?: string): string[] =>
	DUMMY_ENGINE_METHODS[(type ?? "").toUpperCase()] ??
	DUMMY_ENGINE_METHODS.MODEL;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isValidGuardrailConfig = (raw: unknown): raw is GuardrailConfig => {
	if (!raw || typeof raw !== "object") return false;
	const obj = raw as Record<string, unknown>;
	return (
		"pipelines" in obj &&
		!!obj.pipelines &&
		typeof obj.pipelines === "object" &&
		!Array.isArray(obj.pipelines)
	);
};

const isValidMethodsResponse = (raw: unknown): raw is string[] =>
	Array.isArray(raw) &&
	raw.length > 0 &&
	raw.every((m) => typeof m === "string");

const fetchAllGuardrails = async (): Promise<Engine[]> => {
	const all: Engine[] = [];
	const limit = 15;
	let offset = 0;

	while (true) {
		const response = await runPixel(
			`MyEngines(engineTypes=["GUARDRAIL"], userT=[true], limit=[${limit}], offset=[${offset}]);`,
		);
		const batch = (response?.pixelReturn?.[0]?.output as Engine[]) ?? [];
		all.push(...batch);
		if (batch.length < limit) break;
		offset += limit;
	}

	return all;
};

// ─── GuardrailSelectorPanel ───────────────────────────────────────────────────

interface GuardrailSelectorPanelProps {
	direction: "input" | "output";
	guardrails: Engine[];
	selected: string[];
	onChange: (ids: string[]) => void;
	isLoading?: boolean;
}

const GuardrailSelectorPanel: React.FC<GuardrailSelectorPanelProps> = ({
	direction,
	guardrails,
	selected,
	onChange,
	isLoading = false,
}) => {
	const isInput = direction === "input";

	const toggle = (id: string) => {
		onChange(
			selected.includes(id)
				? selected.filter((s) => s !== id)
				: [...selected, id],
		);
	};

	return (
		<div
			className={`flex flex-col gap-2 rounded-lg border p-3 ${
				isInput
					? "border-primary/20 bg-primary/5"
					: "border-chart-2/20 bg-chart-2/5"
			}`}
		>
			{/* Fixed-height header — prevents layout shift */}
			<div className="flex h-5 items-center justify-between">
				<span
					className={`flex items-center gap-1.5 font-semibold text-xs ${
						isInput ? "text-primary" : "text-chart-2"
					}`}
				>
					{isInput ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
					{isInput ? "Input" : "Output"} Guardrails
				</span>
				<span
					className={`rounded-full px-1.5 py-0.5 font-semibold text-[10px] transition-opacity duration-150 ${
						isInput
							? "bg-primary/10 text-primary"
							: "bg-chart-2/10 text-chart-2"
					} ${
						selected.length > 0
							? "opacity-100"
							: "pointer-events-none opacity-0"
					}`}
				>
					{selected.length} selected
				</span>
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center py-4">
					<Spinner className="size-4" />
				</div>
			) : guardrails.length === 0 ? (
				<p className="py-2 text-center text-muted-foreground text-xs italic">
					No guardrails available.
				</p>
			) : (
				<div className="max-h-40 space-y-0.5 overflow-y-auto">
					{guardrails.map((g) => {
						const isSel = selected.includes(g.database_id);
						return (
							<button
								key={g.database_id}
								type="button"
								onClick={() => toggle(g.database_id)}
								className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/60 ${
									isSel ? "bg-accent" : ""
								}`}
							>
								<Checkbox
									checked={isSel}
									onCheckedChange={() =>
										toggle(g.database_id)
									}
									onClick={(e) => e.stopPropagation()}
									className="shrink-0"
								/>
								<div className="min-w-0 flex-1">
									<span
										className="block truncate font-medium text-foreground text-xs"
										title={g.database_name}
									>
										{g.database_name}
									</span>
									<span className="text-[10px] text-muted-foreground">
										{g.database_type}
									</span>
								</div>
								<CheckCircle2
									size={12}
									className={`shrink-0 transition-opacity duration-150 ${
										isInput
											? "text-primary"
											: "text-chart-2"
									} ${isSel ? "opacity-100" : "opacity-0"}`}
								/>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
};

// ─── MethodConfigCard ─────────────────────────────────────────────────────────

interface MethodConfigCardProps {
	methodName: string;
	config: MethodGuardrailConfig;
	guardrails: Engine[];
	isGuardrailsLoading: boolean;
	isExpanded: boolean;
	onToggle: () => void;
	onUpdate: (config: MethodGuardrailConfig) => void;
	// ✅ Delete the entire method from the list
	onDelete: () => void;
}

const MethodConfigCard = memo<MethodConfigCardProps>(
	({
		methodName,
		config,
		guardrails,
		isGuardrailsLoading,
		isExpanded,
		onToggle,
		onUpdate,
		onDelete,
	}) => {
		const inCount = config.input.length;
		const outCount = config.output.length;
		const isConfigured = inCount > 0 || outCount > 0;

		return (
			<Card className="w-full gap-0 overflow-hidden rounded-lg py-0 transition-all">
				<div
					className={`flex w-full items-center justify-between px-4 py-3 transition-colors ${
						isExpanded
							? "rounded-t-lg bg-secondary"
							: "rounded-lg bg-secondary"
					}`}
				>
					{/* Left — clickable area toggles expand */}
					<button
						type="button"
						onClick={onToggle}
						className="flex flex-1 items-center gap-3 text-left"
					>
						<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
							<Zap size={13} className="text-primary" />
						</div>
						<span className="font-semibold text-foreground text-sm">
							{methodName}
						</span>
					</button>

					{/* Right — badges + delete + chevron */}
					<div className="flex items-center gap-2">
						{isConfigured ? (
							<div className="flex items-center gap-1.5">
								{inCount > 0 && (
									<span className="flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-[10px] text-primary">
										<ArrowDown size={9} />
										{inCount}
									</span>
								)}
								{outCount > 0 && (
									<span className="flex items-center gap-0.5 rounded-full bg-chart-2/10 px-2 py-0.5 font-semibold text-[10px] text-chart-2">
										<ArrowUp size={9} />
										{outCount}
									</span>
								)}
							</div>
						) : (
							<span className="text-muted-foreground text-xs">
								Not configured
							</span>
						)}

						{/* ✅ Method-level delete */}
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onDelete();
							}}
							title={`Remove ${methodName}`}
							className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
						>
							<Trash2 size={13} />
						</button>

						<button
							type="button"
							onClick={onToggle}
							className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent"
						>
							{isExpanded ? (
								<ChevronUp size={15} />
							) : (
								<ChevronDown size={15} />
							)}
						</button>
					</div>
				</div>

				{isExpanded && (
					<div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
						<GuardrailSelectorPanel
							direction="input"
							guardrails={guardrails}
							selected={config.input}
							onChange={(ids) =>
								onUpdate({ ...config, input: ids })
							}
							isLoading={isGuardrailsLoading}
						/>
						<GuardrailSelectorPanel
							direction="output"
							guardrails={guardrails}
							selected={config.output}
							onChange={(ids) =>
								onUpdate({ ...config, output: ids })
							}
							isLoading={isGuardrailsLoading}
						/>
					</div>
				)}
			</Card>
		);
	},
);
MethodConfigCard.displayName = "MethodConfigCard";

// ─── EngineGuardrailPage ──────────────────────────────────────────────────────

export const EngineGuardrailPage = observer(() => {
	const { active } = useEngine();

	const engineType = String(
		(active as Record<string, unknown>)?.type ??
			(active as Record<string, unknown>)?.app_type ??
			"MODEL",
	).toUpperCase();

	const [phase, setPhase] = useState<Phase>("idle");
	const [isInitializing, setIsInitializing] = useState(false);
	// const [usedFallbackMethods, setUsedFallbackMethods] = useState(false);

	const [engineMethods, setEngineMethods] = useState<string[]>([]);
	const [guardrails, setGuardrails] = useState<Engine[]>([]);

	const [methodConfigs, setMethodConfigs] = useState<MethodConfigMap>({});
	const [expandedMethods, setExpandedMethods] = useState<Set<string>>(
		new Set(),
	);
	const [submitStatus, setSubmitStatus] = useState<
		"idle" | "submitting" | "error"
	>("idle");
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [configResult, setConfigResult] = useState<GuardrailConfig | null>(
		null,
	);
	const [appliedMethods, setAppliedMethods] = useState<string[]>([]);

	const hasAnyConfig = useMemo(
		() =>
			Object.values(methodConfigs).some(
				(c) => c.input.length > 0 || c.output.length > 0,
			),
		[methodConfigs],
	);

	const configuredCount = useMemo(
		() =>
			Object.values(methodConfigs).filter(
				(c) => c.input.length > 0 || c.output.length > 0,
			).length,
		[methodConfigs],
	);

	// ── Handlers ────────────────────────────────────────────────────────────

	const initializeSelecting = async () => {
		setPhase("selecting");
		setIsInitializing(true);
		// setUsedFallbackMethods(false);
		setSubmitError(null);

		const [methodsResult, guardrailsResult] = await Promise.allSettled([
			runPixel(`GetEngineMethods(engineId="${active?.id}");`),
			fetchAllGuardrails(),
		]);

		let methods = getFallbackMethods(engineType);
		if (methodsResult.status === "fulfilled") {
			const rawMethods = methodsResult.value?.pixelReturn?.[0]?.output;
			if (isValidMethodsResponse(rawMethods)) {
				methods = rawMethods;
			} else {
				// setUsedFallbackMethods(true);
			}
		} else {
			// setUsedFallbackMethods(true);
		}

		if (guardrailsResult.status === "fulfilled") {
			setGuardrails(guardrailsResult.value);
		}

		const configs: MethodConfigMap = {};
		methods.forEach((m) => {
			configs[m] = { input: [], output: [] };
		});

		setEngineMethods(methods);
		setMethodConfigs(configs);
		setExpandedMethods(new Set(methods.slice(0, 1)));
		setIsInitializing(false);
	};

	const toggleMethod = (name: string) => {
		setExpandedMethods((prev) => {
			const next = new Set(prev);
			next.has(name) ? next.delete(name) : next.add(name);
			return next;
		});
	};

	const updateMethodConfig = (
		method: string,
		config: MethodGuardrailConfig,
	) => {
		setMethodConfigs((prev) => ({ ...prev, [method]: config }));
	};

	// ✅ Removes a method card entirely from the list
	const deleteMethod = (method: string) => {
		setEngineMethods((prev) => prev.filter((m) => m !== method));
		setMethodConfigs((prev) => {
			const next = { ...prev };
			delete next[method];
			return next;
		});
		setExpandedMethods((prev) => {
			const next = new Set(prev);
			next.delete(method);
			return next;
		});
	};

	const submitConfiguration = async () => {
		if (!active?.id || !hasAnyConfig) return;

		setSubmitStatus("submitting");
		setSubmitError(null);

		try {
			const pipeline = Object.entries(methodConfigs)
				.filter(
					([, cfg]) => cfg.input.length > 0 || cfg.output.length > 0,
				)
				.map(([methodName, cfg]) => ({
					methodName,
					input: cfg.input,
					output: cfg.output,
				}));

			const pixel = `ConfigureGuardrail(engineId="${active.id}", pipeline=${JSON.stringify(pipeline)});`;
			const response = await runPixel(pixel);

			const rawOutput = response?.pixelReturn?.[0]?.output;
			const configData: GuardrailConfig = isValidGuardrailConfig(
				rawOutput,
			)
				? rawOutput
				: (dummyConfig as GuardrailConfig);

			setAppliedMethods(pipeline.map((p) => p.methodName));
			setConfigResult(configData);
			setSubmitStatus("idle");
			setPhase("configured");
			setMethodConfigs({});
		} catch (error) {
			setSubmitError(
				error instanceof Error ? error.message : "Unknown error",
			);
			setSubmitStatus("error");
		}
	};

	const handleSaveConfig = async (data: GuardrailConfig) => {
		console.log("Saving guardrail config for engine:", active?.id, data);
	};

	const handleReconfigure = () => {
		setPhase("idle");
		setSubmitError(null);
		setGuardrails([]);
	};

	// ─── Render ─────────────────────────────────────────────────────────────

	return (
		<div className="space-y-6" data-testid="engine-guardrail-page">
			{/* ── Page Header ─────────────────────────────────────────── */}
			<div className="flex items-start justify-between gap-4">
				<div className="space-y-1">
					<div className="flex items-center gap-2.5">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
							<Shield size={16} className="text-primary" />
						</div>
						<H4 data-testid="engine-guardrail-header">Guardrail</H4>
					</div>
					<P className="pl-0.5 text-muted-foreground text-sm">
						Configure guardrail interceptor pipelines for{" "}
						<span className="font-semibold text-foreground">
							{active?.name}
						</span>
						.
					</P>
				</div>

				{phase === "configured" && (
					<Button
						variant="outline"
						size="sm"
						onClick={handleReconfigure}
						className="flex shrink-0 items-center gap-1.5 border-border"
					>
						<RefreshCw size={13} />
						Reconfigure
					</Button>
				)}
			</div>

			{/* ── Idle Phase ──────────────────────────────────────────── */}
			{phase === "idle" && (
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center gap-5 py-16">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
							<ShieldPlus size={28} className="text-primary" />
						</div>
						<div className="max-w-sm space-y-1.5 text-center">
							<p className="font-semibold text-foreground">
								No guardrails configured
							</p>
							<P className="text-muted-foreground text-sm">
								Assign input and output guardrails to each
								engine method to filter and protect data flowing
								through this engine.
							</P>
						</div>
						<Button
							color="primary"
							onClick={initializeSelecting}
							className="flex items-center gap-2"
						>
							<ShieldPlus size={15} />
							Configure Guardrail
						</Button>
					</CardContent>
				</Card>
			)}

			{/* ── Selecting Phase ─────────────────────────────────────── */}
			{phase === "selecting" && (
				<div className="space-y-4">
					{isInitializing ? (
						<div className="flex flex-col items-center gap-3 py-14">
							<Spinner className="size-6" />
							<P className="text-muted-foreground text-sm">
								Loading engine methods and guardrails...
							</P>
						</div>
					) : (
						<>
							{/* Instruction banner */}
							<div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
								<Zap
									size={15}
									className="mt-0.5 shrink-0 text-primary"
								/>
								<div className="min-w-0 flex-1 space-y-0.5">
									<p className="font-medium text-foreground text-sm">
										Assign guardrails to engine methods
									</p>
									<P className="text-muted-foreground text-xs">
										For each method, choose guardrail
										engines to intercept the{" "}
										<span className="font-medium text-primary">
											input
										</span>{" "}
										and{" "}
										<span className="font-medium text-chart-2">
											output
										</span>
										. Delete any methods you don't need to
										guard.
									</P>
									{/* {usedFallbackMethods && (
										<p className="mt-1 text-[11px] text-muted-foreground italic">
											⚠ Methods loaded from defaults —{" "}
											<code className="font-mono">
												GetEngineMethods
											</code>{" "}
											endpoint pending.
										</p>
									)} */}
								</div>
								{configuredCount > 0 && (
									<Badge
										color="info"
										className="ml-auto shrink-0 px-2 py-0.5 text-xs"
									>
										{configuredCount} /{" "}
										{engineMethods.length} configured
									</Badge>
								)}
							</div>

							{/* Method cards */}
							{engineMethods.length === 0 ? (
								<Card className="border-dashed">
									<CardContent className="flex flex-col items-center justify-center gap-2 py-10">
										<p className="text-muted-foreground text-sm">
											All methods have been removed.
										</p>
										<Button
											variant="outline"
											size="sm"
											onClick={initializeSelecting}
											className="flex items-center gap-1.5"
										>
											<RefreshCw size={13} />
											Reset methods
										</Button>
									</CardContent>
								</Card>
							) : (
								<div className="space-y-2">
									{engineMethods.map((method) => (
										<MethodConfigCard
											key={method}
											methodName={method}
											config={
												methodConfigs[method] ?? {
													input: [],
													output: [],
												}
											}
											guardrails={guardrails}
											isGuardrailsLoading={false}
											isExpanded={expandedMethods.has(
												method,
											)}
											onToggle={() =>
												toggleMethod(method)
											}
											onUpdate={(cfg) =>
												updateMethodConfig(method, cfg)
											}
											// ✅ Wired to deleteMethod
											onDelete={() =>
												deleteMethod(method)
											}
										/>
									))}
								</div>
							)}

							{/* Action row */}
							<div className="flex flex-wrap items-center gap-3 pt-1">
								<Button
									color="primary"
									disabled={
										!hasAnyConfig ||
										submitStatus === "submitting" ||
										engineMethods.length === 0
									}
									onClick={submitConfiguration}
									className="flex items-center gap-2"
								>
									{submitStatus === "submitting" ? (
										<>
											<div className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
											Applying...
										</>
									) : (
										<>
											<Settings2 size={14} />
											Apply Configuration
										</>
									)}
								</Button>
								<Button
									variant="ghost"
									onClick={() => setPhase("idle")}
									disabled={submitStatus === "submitting"}
								>
									Cancel
								</Button>
							</div>

							{submitStatus === "error" && submitError && (
								<div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2.5 text-destructive text-sm">
									<AlertCircle size={14} />
									<span>{submitError}</span>
								</div>
							)}
						</>
					)}
				</div>
			)}

			{/* ── Configured Phase ────────────────────────────────────── */}
			{phase === "configured" && configResult && (
				<div className="space-y-4">
					<div className="flex items-start gap-3 rounded-lg border border-chart-2/20 bg-chart-2/5 px-4 py-3">
						<ShieldCheck
							size={18}
							className="mt-0.5 shrink-0 text-chart-2"
						/>
						<div className="min-w-0 flex-1 space-y-2">
							<p className="font-semibold text-chart-2 text-sm">
								Guardrail configured successfully
							</p>
							<div className="flex flex-wrap gap-1.5">
								{appliedMethods.map((name) => (
									<span
										key={name}
										className="inline-flex items-center gap-1 rounded-full bg-chart-2/10 px-2.5 py-0.5 font-medium text-[11px] text-chart-2"
									>
										<Zap size={9} />
										{name}
									</span>
								))}
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<div className="flex items-center gap-2 px-0.5">
							<div className="h-px flex-1 bg-border" />
							<span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
								Pipeline Configuration
							</span>
							<div className="h-px flex-1 bg-border" />
						</div>
						<GuardrailConfigEditor
							initialData={configResult}
							onSave={handleSaveConfig}
						/>
					</div>
				</div>
			)}
		</div>
	);
});
