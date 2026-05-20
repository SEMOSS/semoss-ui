import { RefreshCw } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import { Button, H4, P, toast } from "@semoss/ui/next";
import {
	type EngineMethod,
	GuardrailSelectingView,
	type MethodConfigMap,
	type MethodGuardrailConfig,
	type Phase,
} from "@/components/settings";
import type { GuardrailConfig } from "@/components/shared";
import { useEngine } from "@/hooks";

// --- Helpers ------------------------------------------------------------------

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

const isValidMethodsResponse = (raw: unknown): raw is EngineMethod[] =>
	Array.isArray(raw) &&
	raw.length > 0 &&
	raw.every(
		(m) =>
			typeof m === "object" &&
			m !== null &&
			typeof (m as Record<string, unknown>).methodName === "string" &&
			typeof (m as Record<string, unknown>).deprecated === "boolean",
	);

const normalizeGuardrailConfig = (raw: unknown): GuardrailConfig | null => {
	if (isValidGuardrailConfig(raw)) {
		return raw;
	}

	if (typeof raw === "string") {
		try {
			const parsed = JSON.parse(raw) as unknown;
			return isValidGuardrailConfig(parsed) ? parsed : null;
		} catch {
			return null;
		}
	}

	return null;
};

const extractSelectedIdsFromReactors = (
	reactorsRaw: unknown,
	validIds: Set<string>,
): string[] => {
	if (!Array.isArray(reactorsRaw) || validIds.size === 0) {
		return [];
	}

	const selected = new Set<string>();
	for (const reactorRaw of reactorsRaw) {
		if (!reactorRaw || typeof reactorRaw !== "object") continue;
		const params = (reactorRaw as Record<string, unknown>).params as
			| Record<string, unknown>
			| undefined;
		if (!params) continue;

		const singleGuardrailId = params.guardrailEngineId;
		if (
			typeof singleGuardrailId === "string" &&
			validIds.has(singleGuardrailId)
		) {
			selected.add(singleGuardrailId);
		}

		const multiGuardrailIds = params.guardrailEngineIds;
		if (Array.isArray(multiGuardrailIds)) {
			for (const id of multiGuardrailIds) {
				if (typeof id === "string" && validIds.has(id)) {
					selected.add(id);
				}
			}
		}
	}

	return Array.from(selected);
};

const buildMethodConfigsFromPipelineResponse = (
	config: GuardrailConfig,
	methods: EngineMethod[],
	guardrails: unknown[],
): MethodConfigMap => {
	const validIds = new Set(
		guardrails
			.map((g) => {
				if (!g || typeof g !== "object") return "";
				return String((g as Record<string, unknown>).database_id ?? "");
			})
			.filter(Boolean),
	);

	const pipelines = config.pipelines as Record<string, unknown>;
	const configs: MethodConfigMap = {};

	for (const method of methods) {
		const methodPipeline = pipelines[method.methodName] as
			| Record<string, unknown>
			| undefined;

		configs[method.methodName] = {
			input: extractSelectedIdsFromReactors(
				methodPipeline?.input,
				validIds,
			),
			output: extractSelectedIdsFromReactors(
				methodPipeline?.output,
				validIds,
			),
		};
	}

	return configs;
};

const buildEmptyMethodConfigs = (methods: EngineMethod[]): MethodConfigMap => {
	const configs: MethodConfigMap = {};
	for (const method of methods) {
		configs[method.methodName] = { input: [], output: [] };
	}
	return configs;
};

const fetchAllGuardrails = async (): Promise<unknown[]> => {
	const all: unknown[] = [];
	const limit = 15;
	let offset = 0;

	while (true) {
		const response = await runPixel(
			`MyEngines(engineTypes=["GUARDRAIL"], userT=[true], limit=[${limit}], offset=[${offset}]);`,
		);
		const batch = (response?.pixelReturn?.[0]?.output as unknown[]) ?? [];
		all.push(...batch);
		if (batch.length < limit) break;
		offset += limit;
	}

	return all;
};

const fetchExistingGuardrailConfig = async (
	engineId: string,
): Promise<GuardrailConfig | null> => {
	try {
		const response = await runPixel(
			`GetEngineAssets(filePath=["/pipeline.json"], engine=["${engineId}"]);`,
		);
		return normalizeGuardrailConfig(response?.pixelReturn?.[0]?.output);
	} catch {
		return null;
	}
};

// --- EngineGuardrailPage ------------------------------------------------------

export const EngineGuardrailPage = observer(() => {
	const { active } = useEngine();

	const [phase, setPhase] = useState<Phase>("idle");
	const [engineMethods, setEngineMethods] = useState<EngineMethod[]>([]);
	const [guardrails, setGuardrails] = useState<unknown[]>([]);
	const [methodConfigs, setMethodConfigs] = useState<MethodConfigMap>({});
	const [expandedMethods, setExpandedMethods] = useState<Set<string>>(
		new Set(),
	);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [configResult, setConfigResult] = useState<GuardrailConfig | null>(
		null,
	);

	const { hasAnyConfig, configuredCount } = useMemo(() => {
		let count = 0;
		for (const c of Object.values(methodConfigs)) {
			if (c.input.length > 0 || c.output.length > 0) count++;
		}
		return { hasAnyConfig: count > 0, configuredCount: count };
	}, [methodConfigs]);

	const loadSelectingState = useCallback(
		async (restoredConfig: GuardrailConfig | null = null) => {
			if (!active?.id) {
				return;
			}

			setPhase("loading");
			setSubmitError(null);

			const [methodsResult, guardrailsResult] = await Promise.allSettled([
				runPixel(`GetEngineMethods(engine=["${active?.id}"]);`),
				fetchAllGuardrails(),
			]);

			let methods: EngineMethod[] = [];
			if (methodsResult.status === "fulfilled") {
				const rawMethods = methodsResult.value?.pixelReturn?.[0]?.output;
				if (isValidMethodsResponse(rawMethods)) {
					methods = rawMethods;
				}
			}

			const guardrailItems =
				guardrailsResult.status === "fulfilled"
					? guardrailsResult.value
					: [];

			setEngineMethods(methods);
			setGuardrails(guardrailItems);

			if (restoredConfig) {
				const restoredConfigs = buildMethodConfigsFromPipelineResponse(
					restoredConfig,
					methods,
					guardrailItems,
				);
				const configuredMethods = Object.entries(restoredConfigs)
					.filter(([_, cfg]) => cfg.input.length > 0 || cfg.output.length > 0)
					.map(([name]) => name);

				setConfigResult(restoredConfig);
				setMethodConfigs(restoredConfigs);
				setExpandedMethods(
					new Set(
						configuredMethods.length > 0
							? configuredMethods
							: methods.slice(0, 1).map((m) => m.methodName),
					),
				);
				setPhase("selecting");
				return;
			}

			const configs = buildEmptyMethodConfigs(methods);

			setConfigResult(null);
			setMethodConfigs(configs);
			setExpandedMethods(
				new Set(methods.slice(0, 1).map((m) => m.methodName)),
			);
			setPhase("selecting");
		},
		[active?.id],
	);

	// Handlers ------------------------------------------------------------------

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

	const submitConfiguration = async () => {
		if (!active?.id || !hasAnyConfig) return;

		setPhase("submitting");
		setSubmitError(null);

		try {
			const map = Object.entries(methodConfigs)
				.filter(
					([, cfg]) => cfg.input.length > 0 || cfg.output.length > 0,
				)
				.map(([methodName, cfg]) => ({
					methodName,
					input: cfg.input,
					output: cfg.output,
				}));

			const pixel = `GenerateGuardrailEnginePipelineConfig(engine=["${active.id}"], map=${JSON.stringify(map)});`;
			const response = await runPixel(pixel);

			const rawOutput = response?.pixelReturn?.[0]?.output;
			if (!isValidGuardrailConfig(rawOutput)) {
				throw new Error(
					"Failed to apply configuration: invalid response from server.",
				);
			}

			setConfigResult(rawOutput);
			setPhase("configured");
			setMethodConfigs({});
		} catch (error) {
			setSubmitError(
				error instanceof Error ? error.message : "Unknown error",
			);
			setPhase("selecting");
		}
	};

	const handleSaveConfig = async (data: GuardrailConfig) => {
		if (!active?.id) {
			throw new Error("Cannot save configuration: engine is unavailable.");
		}

		try {
			await runPixel(
				`SaveEngineAssets(engine=["${active.id}"], filePath=["/pipeline.json"], content=["<encode>${JSON.stringify(
					data,
					null,
					2,
				)}</encode>"]);`,
			);
			setConfigResult(data);
			toast.success("Guardrail configuration saved");
		} catch (error) {
			console.error("Failed to save guardrail config", error);
			toast.error("Failed to save guardrail configuration");
			throw error;
		}
	};

	const handleReconfigure = () => {
		void loadSelectingState(configResult);
	};

	useEffect(() => {
		if (!active?.id) {
			setPhase("idle");
			setConfigResult(null);
			setMethodConfigs({});
			setEngineMethods([]);
			setGuardrails([]);
			setExpandedMethods(new Set());
			return;
		}

		let cancelled = false;

		const initializePage = async () => {
			setPhase("loading");
			setSubmitError(null);
			setConfigResult(null);

			const existingConfig = await fetchExistingGuardrailConfig(active.id);
			if (cancelled) return;

			if (existingConfig) {
				setConfigResult(existingConfig);
				setPhase("configured");
				return;
			}

			await loadSelectingState();
		};

		void initializePage();

		return () => {
			cancelled = true;
		};
	}, [active?.id, loadSelectingState]);

	// Render --------------------------------------------------------------------

	return (
		<div className="space-y-6" data-testid="engine-guardrail-page">
			{/* Page Header */}
			<div className="flex items-start justify-between gap-4">
				<div className="space-y-1">
						<H4 data-testid="engine-guardrail-header">Guardrail</H4>
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

			{phase !== "idle" && (
				<GuardrailSelectingView
					phase={phase}
					engineMethods={engineMethods}
					guardrails={guardrails}
					methodConfigs={methodConfigs}
					expandedMethods={expandedMethods}
					configuredCount={configuredCount}
					hasAnyConfig={hasAnyConfig}
					submitError={submitError}
					configResult={configResult}
					onSubmit={submitConfiguration}
					onReset={() => {
						void loadSelectingState();
					}}
					onToggleMethod={toggleMethod}
					onUpdateMethod={updateMethodConfig}
					onSave={handleSaveConfig}
				/>
			)}
		</div>
	);
});
