/**
 * Types and pure helpers for the model engine Guardrails settings editor.
 * The editor reads/writes the pipeline.json contract used by the backend
 * guardrail proxy via GetModelGuardrailConfig / UpdateModelGuardrailConfig.
 */

export const GUARDRAIL_INPUT_REACTOR =
	"prerna.reactor.interceptor.GenericGuardrailInputReactor";
export const GUARDRAIL_INPUT_OUTPUT_REACTOR =
	"prerna.reactor.interceptor.GenericGuardrailInputOutputReactor";

export const DEFAULT_MASK_TARGET_PARAM = "prompt";

export type GuardrailPhase = "input" | "output";

/** Reactor classes legal per phase - the output slot is instantiated as an
 * output reactor by the backend, so the input-only class is not allowed
 * there. */
export const GUARDRAIL_REACTOR_OPTIONS: Record<
	GuardrailPhase,
	Array<{ value: string; label: string }>
> = {
	input: [
		{ value: GUARDRAIL_INPUT_REACTOR, label: "Check input only" },
		{
			value: GUARDRAIL_INPUT_OUTPUT_REACTOR,
			label: "Check input and output",
		},
	],
	output: [
		{
			value: GUARDRAIL_INPUT_OUTPUT_REACTOR,
			label: "Check input and output",
		},
	],
};

export interface GuardrailEngineDetails {
	name: string | null;
	exists: boolean;
	type: string | null;
	subtype: string | null;
	userCanView: boolean;
}

/** Response shape of GetModelGuardrailConfig. */
export interface GetModelGuardrailConfigResponse {
	engineId: string;
	configured: boolean;
	pipelineFileName: string | null;
	fileExists: boolean;
	parseError: string | null;
	rawContent: string | null;
	pipelines: Record<string, unknown>;
	guardrailEngines: Record<string, GuardrailEngineDetails>;
	allowedReactorClasses: { input: string[]; output: string[] };
}

export interface GuardrailMappingEntryFormValue {
	id: string;
	/** Guardrail parameter name (e.g. prompt) */
	key: string;
	/** Intercepted argument name(s), comma separated in the editor */
	args: string;
}

export interface GuardrailDirectParamFormValue {
	id: string;
	key: string;
	type: "string" | "number" | "boolean";
	value: string;
}

export interface GuardrailReactorFormValue {
	id: string;
	reactorClass: string;
	guardrailEngineId: string;
	blockOnGuardrailFailure: boolean;
	maskOnGuardrailFailure: boolean;
	maskTargetParam: string;
	inputMapping: GuardrailMappingEntryFormValue[];
	directParameters: GuardrailDirectParamFormValue[];
}

export interface GuardrailPipelineFormValue {
	id: string;
	/** Engine method to intercept, or "*" for every method */
	method: string;
	input: GuardrailReactorFormValue[];
	output: GuardrailReactorFormValue[];
}

export interface GuardrailConfigFormValue {
	pipelines: GuardrailPipelineFormValue[];
}

let guardrailFieldIdSeed = 0;
const nextGuardrailFieldId = () => {
	guardrailFieldIdSeed += 1;
	return `guardrail-field-${guardrailFieldIdSeed}`;
};

export const createGuardrailMappingEntry = (
	key = "",
	args = "",
): GuardrailMappingEntryFormValue => ({
	id: nextGuardrailFieldId(),
	key,
	args,
});

export const createGuardrailDirectParam =
	(): GuardrailDirectParamFormValue => ({
		id: nextGuardrailFieldId(),
		key: "",
		type: "string",
		value: "",
	});

export const createGuardrailReactor = (
	phase: GuardrailPhase,
): GuardrailReactorFormValue => ({
	id: nextGuardrailFieldId(),
	reactorClass:
		phase === "output"
			? GUARDRAIL_INPUT_OUTPUT_REACTOR
			: GUARDRAIL_INPUT_REACTOR,
	guardrailEngineId: "",
	blockOnGuardrailFailure: true,
	maskOnGuardrailFailure: false,
	maskTargetParam: DEFAULT_MASK_TARGET_PARAM,
	// without a mapping the guardrail receives no content to check, so new
	// entries start wired to the first argument (input) or the response
	// (output) - "arg0" is the intercepted method's first argument and
	// "result" is the method's return value
	inputMapping: [
		createGuardrailMappingEntry(
			DEFAULT_MASK_TARGET_PARAM,
			phase === "output" ? "result" : "arg0",
		),
	],
	directParameters: [],
});

export const createGuardrailPipeline = (
	method = "*",
): GuardrailPipelineFormValue => ({
	id: nextGuardrailFieldId(),
	method,
	input: [createGuardrailReactor("input")],
	output: [],
});

export const createDefaultGuardrailConfigValue =
	(): GuardrailConfigFormValue => ({
		pipelines: [],
	});

const splitArgs = (args: string): string[] =>
	args
		.split(",")
		.map((arg) => arg.trim())
		.filter(Boolean);

const normalizeReactorEntry = (
	entry: unknown,
	phase: GuardrailPhase,
): GuardrailReactorFormValue => {
	const base = createGuardrailReactor(phase);
	if (!entry || typeof entry !== "object") {
		return base;
	}
	const e = entry as Record<string, unknown>;
	const allowedClasses = GUARDRAIL_REACTOR_OPTIONS[phase].map(
		(option) => option.value,
	);
	if (
		typeof e.reactorClass === "string" &&
		allowedClasses.includes(e.reactorClass)
	) {
		base.reactorClass = e.reactorClass;
	}
	const params =
		e.params && typeof e.params === "object"
			? (e.params as Record<string, unknown>)
			: {};
	if (typeof params.guardrailEngineId === "string") {
		base.guardrailEngineId = params.guardrailEngineId;
	}
	if (typeof params.blockOnGuardrailFailure === "boolean") {
		base.blockOnGuardrailFailure = params.blockOnGuardrailFailure;
	}
	if (typeof params.maskOnGuardrailFailure === "boolean") {
		base.maskOnGuardrailFailure = params.maskOnGuardrailFailure;
	}
	if (
		typeof params.maskTargetParam === "string" &&
		params.maskTargetParam.trim()
	) {
		base.maskTargetParam = params.maskTargetParam.trim();
	}
	if (params.inputMapping && typeof params.inputMapping === "object") {
		base.inputMapping = Object.entries(
			params.inputMapping as Record<string, unknown>,
		).map(([key, mapped]) => {
			if (Array.isArray(mapped)) {
				return createGuardrailMappingEntry(
					key,
					mapped.filter((arg) => typeof arg === "string").join(", "),
				);
			}
			return createGuardrailMappingEntry(
				key,
				typeof mapped === "string" ? mapped : "",
			);
		});
	}
	if (
		params.directParameters &&
		typeof params.directParameters === "object"
	) {
		base.directParameters = Object.entries(
			params.directParameters as Record<string, unknown>,
		).map(([key, paramValue]) => {
			const param = createGuardrailDirectParam();
			param.key = key;
			if (typeof paramValue === "boolean") {
				param.type = "boolean";
				param.value = String(paramValue);
			} else if (
				typeof paramValue === "number" &&
				Number.isFinite(paramValue)
			) {
				param.type = "number";
				param.value = String(paramValue);
			} else {
				param.type = "string";
				param.value = typeof paramValue === "string" ? paramValue : "";
			}
			return param;
		});
	}
	return base;
};

/** Parse the GetModelGuardrailConfig response (object, or a JSON string for
 * safety) into an editor value. Malformed nodes fall back to defaults. */
export const guardrailConfigFromResponse = (
	raw: unknown,
): GuardrailConfigFormValue => {
	let parsed: unknown = raw;
	if (typeof raw === "string") {
		try {
			parsed = JSON.parse(raw);
		} catch {
			parsed = null;
		}
	}
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		return createDefaultGuardrailConfigValue();
	}
	const pipelinesObj = (parsed as Record<string, unknown>).pipelines;
	if (
		!pipelinesObj ||
		typeof pipelinesObj !== "object" ||
		Array.isArray(pipelinesObj)
	) {
		return createDefaultGuardrailConfigValue();
	}
	const pipelines = Object.entries(
		pipelinesObj as Record<string, unknown>,
	).map(([method, pipeline]) => {
		const p =
			pipeline && typeof pipeline === "object"
				? (pipeline as Record<string, unknown>)
				: {};
		return {
			id: nextGuardrailFieldId(),
			method,
			input: Array.isArray(p.input)
				? p.input.map((entry) => normalizeReactorEntry(entry, "input"))
				: [],
			output: Array.isArray(p.output)
				? p.output.map((entry) =>
						normalizeReactorEntry(entry, "output"),
					)
				: [],
		};
	});
	return { pipelines };
};

/** Pull the id-to-name fallbacks for guardrail engines referenced by the
 * config but missing from the user's MyEngines list. */
export const extractGuardrailEngineNames = (
	raw: unknown,
): Record<string, string> => {
	const names: Record<string, string> = {};
	if (!raw || typeof raw !== "object") {
		return names;
	}
	const engines = (raw as Record<string, unknown>).guardrailEngines;
	if (!engines || typeof engines !== "object") {
		return names;
	}
	for (const [engineId, details] of Object.entries(
		engines as Record<string, unknown>,
	)) {
		if (details && typeof details === "object") {
			const name = (details as Record<string, unknown>).name;
			if (typeof name === "string" && name) {
				names[engineId] = name;
			}
		}
	}
	return names;
};

export interface GuardrailMaskConflict {
	pipelineId: string;
	phase: GuardrailPhase;
	entryId: string;
}

const entryHasMaskConflict = (entry: GuardrailReactorFormValue): boolean => {
	if (!entry.maskOnGuardrailFailure) {
		return false;
	}
	const maskTarget =
		entry.maskTargetParam.trim() || DEFAULT_MASK_TARGET_PARAM;
	const mapping = entry.inputMapping.find(
		(row) => row.key.trim() === maskTarget,
	);
	// the backend falls back to blocking unless the mask target maps to
	// exactly one argument, so anything else is a conflict
	return !mapping || splitArgs(mapping.args).length !== 1;
};

/** Every entry whose mask setting the runtime would silently downgrade to
 * block. Shared by the inline warnings and the save-time validation. */
export const findMaskMultiValueConflicts = (
	value: GuardrailConfigFormValue,
): GuardrailMaskConflict[] => {
	const conflicts: GuardrailMaskConflict[] = [];
	for (const pipeline of value.pipelines) {
		for (const phase of ["input", "output"] as const) {
			for (const entry of pipeline[phase]) {
				if (entryHasMaskConflict(entry)) {
					conflicts.push({
						pipelineId: pipeline.id,
						phase,
						entryId: entry.id,
					});
				}
			}
		}
	}
	return conflicts;
};

/** true when the config is submittable, otherwise the message to surface. */
export const validateGuardrailConfig = (
	value: GuardrailConfigFormValue,
): true | string => {
	const seenMethods = new Set<string>();
	for (const pipeline of value.pipelines) {
		const method = pipeline.method.trim();
		if (!method) {
			return "Every pipeline needs a method name (use * for all methods).";
		}
		if (seenMethods.has(method)) {
			return `Pipeline method names must be unique - "${method}" is used more than once.`;
		}
		seenMethods.add(method);
		if (pipeline.input.length === 0 && pipeline.output.length === 0) {
			return `Pipeline "${method}" needs at least one guardrail.`;
		}
		for (const phase of ["input", "output"] as const) {
			const allowedClasses = GUARDRAIL_REACTOR_OPTIONS[phase].map(
				(option) => option.value,
			);
			for (const entry of pipeline[phase]) {
				if (!entry.guardrailEngineId) {
					return `Every guardrail in pipeline "${method}" needs a guardrail engine.`;
				}
				if (!allowedClasses.includes(entry.reactorClass)) {
					return `Output guardrails in pipeline "${method}" must check input and output.`;
				}
				if (entry.inputMapping.length === 0) {
					return `Every guardrail in pipeline "${method}" needs a parameter mapping (under Advanced) - the guardrail receives no content to check without one.`;
				}
				const seenMappingKeys = new Set<string>();
				for (const row of entry.inputMapping) {
					const key = row.key.trim();
					if (!key || splitArgs(row.args).length === 0) {
						return `Every parameter mapping in pipeline "${method}" needs a parameter name and at least one argument.`;
					}
					if (seenMappingKeys.has(key)) {
						return `Parameter mappings in pipeline "${method}" must have unique parameter names.`;
					}
					seenMappingKeys.add(key);
				}
				const seenParamKeys = new Set<string>();
				for (const row of entry.directParameters) {
					const key = row.key.trim();
					if (!key) {
						return `Every direct parameter in pipeline "${method}" needs a name.`;
					}
					if (seenParamKeys.has(key)) {
						return `Direct parameters in pipeline "${method}" must have unique names.`;
					}
					seenParamKeys.add(key);
					if (
						row.type === "number" &&
						!Number.isFinite(Number.parseFloat(row.value))
					) {
						return `Direct parameter "${key}" in pipeline "${method}" needs a numeric value.`;
					}
				}
			}
		}
	}
	if (findMaskMultiValueConflicts(value).length > 0) {
		return "Masking requires the mask target parameter to map to exactly one argument - otherwise the guardrail blocks instead of masking.";
	}
	return true;
};

const serializeReactorEntry = (
	entry: GuardrailReactorFormValue,
): Record<string, unknown> => {
	const params: Record<string, unknown> = {
		guardrailEngineId: entry.guardrailEngineId,
		blockOnGuardrailFailure: entry.blockOnGuardrailFailure,
		maskOnGuardrailFailure: entry.maskOnGuardrailFailure,
	};
	if (entry.maskOnGuardrailFailure) {
		params.maskTargetParam =
			entry.maskTargetParam.trim() || DEFAULT_MASK_TARGET_PARAM;
	}
	if (entry.inputMapping.length > 0) {
		const inputMapping: Record<string, unknown> = {};
		for (const row of entry.inputMapping) {
			const args = splitArgs(row.args);
			inputMapping[row.key.trim()] = args.length === 1 ? args[0] : args;
		}
		params.inputMapping = inputMapping;
	}
	if (entry.directParameters.length > 0) {
		const directParameters: Record<string, unknown> = {};
		for (const row of entry.directParameters) {
			if (row.type === "number") {
				directParameters[row.key.trim()] = Number.parseFloat(row.value);
			} else if (row.type === "boolean") {
				directParameters[row.key.trim()] = row.value === "true";
			} else {
				directParameters[row.key.trim()] = row.value;
			}
		}
		params.directParameters = directParameters;
	}
	return { reactorClass: entry.reactorClass, params };
};

/** Serialize the editor value to the pipeline.json contract expected by
 * UpdateModelGuardrailConfig's map parameter. */
export const guardrailConfigToJson = (
	value: GuardrailConfigFormValue,
): string => {
	const pipelines: Record<string, unknown> = {};
	for (const pipeline of value.pipelines) {
		const serialized: Record<string, unknown> = {};
		if (pipeline.input.length > 0) {
			serialized.input = pipeline.input.map(serializeReactorEntry);
		}
		if (pipeline.output.length > 0) {
			serialized.output = pipeline.output.map(serializeReactorEntry);
		}
		pipelines[pipeline.method.trim()] = serialized;
	}
	return JSON.stringify({ pipelines });
};
