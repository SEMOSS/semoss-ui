/**
 * Types and pure helpers for the model engine Guardrails settings editor.
 * The editor reads/writes the pipeline.json contract used by the backend
 * guardrail proxy via GetModelGuardrailConfig / UpdateModelGuardrailConfig.
 */

import { z } from "@semoss/ui/next";

const GUARDRAIL_INPUT_REACTOR =
	"prerna.reactor.interceptor.GenericGuardrailInputReactor";
const GUARDRAIL_OUTPUT_REACTOR =
	"prerna.reactor.interceptor.GenericGuardrailOutputReactor";

/** Parameter a new check starts wired to, since the guardrails in the catalog
 * declare it. Nothing depends on the name; the picker lists whatever the
 * selected guardrail engine declares. */
const DEFAULT_GUARDRAIL_PARAM = "prompt";

/** Method value that applies a pipeline to every intercepted call. */
export const GUARDRAIL_ALL_METHODS = "*";

/** Argument name the interceptor uses for the intercepted method's return value. */
export const GUARDRAIL_RESULT_ARGUMENT = "result";

export type GuardrailPhase = "input" | "output";
export const GUARDRAIL_FAILURE_ACTIONS = ["block", "mask", "respond"] as const;
export const GUARDRAIL_DIRECT_PARAMETER_TYPES = [
	"string",
	"number",
	"boolean",
	"string-array",
	"number-array",
	"boolean-array",
	"json",
] as const;

/** Backend resolved details for a guardrail engine referenced by the config. */
export interface GuardrailEngineDetails {
	/** Display name, or null when the engine could not be resolved. */
	name: string | null;

	/** Whether the engine is still in the catalog. */
	exists: boolean;

	/** Catalog type, expected to be GUARDRAIL. */
	type: string | null;

	/** Catalog subtype, such as the guardrail implementation. */
	subtype: string | null;

	/** Whether the current user can view the engine. */
	userCanView: boolean;
}

/** One argument of a method a guardrail pipeline can intercept. */
export interface InterceptableMethodArgument {
	/** Name the runtime resolves at request time, such as arg0. */
	name: string;

	/** Zero based position in the method signature. */
	position: number;

	/** Whether the name comes from the source signature rather than the position. */
	nameIsFromSource: boolean;

	/** Readable Java type, such as List<String>. */
	type: string;

	/** Whether a guardrail can screen this argument's value. */
	guardable: boolean;
}

/** A model engine method a guardrail pipeline can intercept. */
export interface InterceptableMethod {
	/** Java method name, used as the pipeline key. */
	name: string;

	/** Whether the method is deprecated on the engine interface. */
	deprecated: boolean;

	/** Readable return type. */
	returnType: string;

	/** Whether the return value is a model response object. */
	returnsModelResponse: boolean;

	/** Arguments in signature order. */
	arguments: InterceptableMethodArgument[];
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
	interceptableMethods: InterceptableMethod[];
	resultArgumentName: string;
}

/** Whether the engine loads a guardrail pipeline file, and which one. */
export type GuardrailFileState = "loaded" | "file-missing" | "not-enabled";

/** Everything the editor needs to explain the stored configuration's state. */
export interface GuardrailFileStatus {
	state: GuardrailFileState;

	/** Name of the pipeline file the engine points at, when configured. */
	pipelineFileName: string | null;

	/** Parse failure reported for the stored file, when it could not be read. */
	parseError: string | null;

	/** Contents of the stored file, present only when it failed to parse. */
	rawContent: string | null;
}

const guardrailMappingEntrySchema = z.object({
	id: z.string(),
	key: z.string().trim().min(1, "Enter a guardrail parameter."),
	args: z.string().trim().min(1, "Enter at least one method argument."),
});

const guardrailDirectParamSchema = z.object({
	id: z.string(),
	key: z.string().trim().min(1, "Enter a parameter name."),
	type: z.enum(GUARDRAIL_DIRECT_PARAMETER_TYPES),
	value: z.string(),
});

const guardrailFailureActionSchema = z.enum(GUARDRAIL_FAILURE_ACTIONS);

const guardrailReactorSchema = z
	.object({
		id: z.string(),
		guardrailEngineId: z.string().min(1, "Select a guardrail engine."),
		failureAction: guardrailFailureActionSchema,
		closeRoomOnBlock: z.boolean(),
		blockErrorMessage: z.string(),
		inputMapping: z
			.array(guardrailMappingEntrySchema)
			.min(1, "Add at least one parameter mapping."),
		directParameters: z.array(guardrailDirectParamSchema),
	})
	.superRefine((value, context) => {
		if (
			value.failureAction === "block" &&
			value.blockErrorMessage.length > 0 &&
			!value.blockErrorMessage.trim()
		) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				message: "The custom block message cannot be blank.",
				path: ["blockErrorMessage"],
			});
		}
	});

const guardrailPipelineSchema = z.object({
	id: z.string(),
	method: z.string().trim().min(1, "Enter a method name, or use *."),
	input: z.array(guardrailReactorSchema),
	output: z.array(guardrailReactorSchema),
});

export const guardrailConfigSchema = z
	.object({ pipelines: z.array(guardrailPipelineSchema) })
	.superRefine((value, context) => {
		const validation = validateGuardrailConfig(value);
		if (validation !== true) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				message: validation,
			});
		}
	});

export type GuardrailMappingEntryFormValue = z.infer<
	typeof guardrailMappingEntrySchema
>;
export type GuardrailDirectParamFormValue = z.infer<
	typeof guardrailDirectParamSchema
>;
export type GuardrailFailureAction = z.infer<
	typeof guardrailFailureActionSchema
>;
export type GuardrailReactorFormValue = z.infer<typeof guardrailReactorSchema>;
export type GuardrailPipelineFormValue = z.infer<
	typeof guardrailPipelineSchema
>;
export type GuardrailConfigFormValue = z.infer<typeof guardrailConfigSchema>;

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
	guardrailEngineId: "",
	failureAction: "block",
	closeRoomOnBlock: false,
	blockErrorMessage: "",
	// without a mapping the guardrail receives no content to check, so new
	// entries start wired to the first argument (request) or the return value
	// (response) - "arg0" is the intercepted method's first argument
	inputMapping: [
		createGuardrailMappingEntry(
			DEFAULT_GUARDRAIL_PARAM,
			phase === "output" ? GUARDRAIL_RESULT_ARGUMENT : "arg0",
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

const createDefaultGuardrailConfigValue = (): GuardrailConfigFormValue => ({
	pipelines: [],
});

const splitArgs = (args: string): string[] =>
	args
		.split(",")
		.map((arg) => arg.trim())
		.filter(Boolean);

const inferDirectParameterType = (
	value: unknown,
): GuardrailDirectParamFormValue["type"] => {
	if (Array.isArray(value)) {
		if (
			value.length > 0 &&
			value.every((item) => typeof item === "string")
		) {
			return "string-array";
		}
		if (
			value.length > 0 &&
			value.every(
				(item) => typeof item === "number" && Number.isFinite(item),
			)
		) {
			return "number-array";
		}
		if (
			value.length > 0 &&
			value.every((item) => typeof item === "boolean")
		) {
			return "boolean-array";
		}
		return "json";
	}
	if (value !== null && typeof value === "object") {
		return "json";
	}
	if (typeof value === "boolean") {
		return "boolean";
	}
	if (typeof value === "number" && Number.isFinite(value)) {
		return "number";
	}
	return "string";
};

const directParameterValueForForm = (
	value: unknown,
	type: GuardrailDirectParamFormValue["type"],
): string => {
	if (type.endsWith("-array") || type === "json") {
		return JSON.stringify(value, null, 2);
	}
	return value === null || value === undefined ? "" : String(value);
};

const normalizeReactorEntry = (
	entry: unknown,
	phase: GuardrailPhase,
): GuardrailReactorFormValue => {
	const base = createGuardrailReactor(phase);
	if (!entry || typeof entry !== "object") {
		return base;
	}
	const e = entry as Record<string, unknown>;
	const params =
		e.params && typeof e.params === "object"
			? (e.params as Record<string, unknown>)
			: {};
	if (typeof params.guardrailEngineId === "string") {
		base.guardrailEngineId = params.guardrailEngineId;
	}
	if (phase === "input" && params.respondWithGuardrailMessage === true) {
		base.failureAction = "respond";
	} else if (phase === "input" && params.maskOnGuardrailFailure === true) {
		base.failureAction = "mask";
	}
	if (
		base.failureAction === "block" &&
		typeof params.closeRoomOnBlock === "boolean"
	) {
		base.closeRoomOnBlock = params.closeRoomOnBlock;
	}
	if (
		base.failureAction === "block" &&
		typeof params.blockErrorMessage === "string"
	) {
		base.blockErrorMessage = params.blockErrorMessage;
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
			param.type = inferDirectParameterType(paramValue);
			param.value = directParameterValueForForm(paramValue, param.type);
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

/** Pull the backend resolved details for every guardrail engine the config
 * references, including engines missing from the user's MyEngines list. */
export const extractGuardrailEngineDetails = (
	raw: unknown,
): Record<string, GuardrailEngineDetails> => {
	const resolved: Record<string, GuardrailEngineDetails> = {};
	if (!raw || typeof raw !== "object") {
		return resolved;
	}
	const engines = (raw as Record<string, unknown>).guardrailEngines;
	if (!engines || typeof engines !== "object") {
		return resolved;
	}
	for (const [engineId, details] of Object.entries(
		engines as Record<string, unknown>,
	)) {
		if (!details || typeof details !== "object") {
			continue;
		}
		const d = details as Record<string, unknown>;
		resolved[engineId] = {
			name: typeof d.name === "string" && d.name ? d.name : null,
			// an older backend omits these, so treat a present engine as usable
			exists: d.exists !== false,
			type: typeof d.type === "string" ? d.type : null,
			subtype: typeof d.subtype === "string" ? d.subtype : null,
			userCanView: d.userCanView !== false,
		};
	}
	return resolved;
};

/** The methods a pipeline can intercept, as reported by the backend. Empty
 * when the backend does not supply them, which drops the editor back to
 * free-text method and argument entry. */
export const extractInterceptableMethods = (
	raw: unknown,
): InterceptableMethod[] => {
	if (!raw || typeof raw !== "object") {
		return [];
	}
	const methods = (raw as Record<string, unknown>).interceptableMethods;
	if (!Array.isArray(methods)) {
		return [];
	}
	return methods.flatMap((entry) => {
		if (!entry || typeof entry !== "object") {
			return [];
		}
		const e = entry as Record<string, unknown>;
		if (typeof e.name !== "string" || !e.name) {
			return [];
		}
		const rawArguments = Array.isArray(e.arguments) ? e.arguments : [];
		return [
			{
				name: e.name,
				deprecated: e.deprecated === true,
				returnType:
					typeof e.returnType === "string" ? e.returnType : "",
				returnsModelResponse: e.returnsModelResponse === true,
				arguments: rawArguments.flatMap((argument, index) => {
					if (!argument || typeof argument !== "object") {
						return [];
					}
					const a = argument as Record<string, unknown>;
					if (typeof a.name !== "string" || !a.name) {
						return [];
					}
					return [
						{
							name: a.name,
							position:
								typeof a.position === "number"
									? a.position
									: index,
							nameIsFromSource: a.nameIsFromSource === true,
							type: typeof a.type === "string" ? a.type : "",
							guardable: a.guardable === true,
						},
					];
				}),
			},
		];
	});
};

/** The argument name carrying the model's return value, which output
 * guardrails map from. */
export const extractResultArgumentName = (raw: unknown): string => {
	if (raw && typeof raw === "object") {
		const name = (raw as Record<string, unknown>).resultArgumentName;
		if (typeof name === "string" && name) {
			return name;
		}
	}
	return GUARDRAIL_RESULT_ARGUMENT;
};

/** Whether the engine actually loads a pipeline file. A config that looks
 * complete in the editor still screens nothing when the engine has no
 * PIPELINE key, so the editor reports this state directly. */
export const extractGuardrailFileStatus = (
	raw: unknown,
): GuardrailFileStatus => {
	const status: GuardrailFileStatus = {
		state: "not-enabled",
		pipelineFileName: null,
		parseError: null,
		rawContent: null,
	};
	if (!raw || typeof raw !== "object") {
		return status;
	}
	const response = raw as Record<string, unknown>;
	status.pipelineFileName =
		typeof response.pipelineFileName === "string" &&
		response.pipelineFileName
			? response.pipelineFileName
			: null;
	status.parseError =
		typeof response.parseError === "string" && response.parseError
			? response.parseError
			: null;
	status.rawContent =
		typeof response.rawContent === "string" ? response.rawContent : null;
	if (response.configured !== true) {
		return status;
	}
	status.state = response.fileExists === true ? "loaded" : "file-missing";
	return status;
};

/** The arguments a mapping row can select for a phase. Empty when the method
 * is a wildcard or is not one the backend reported, since the argument list
 * cannot be known in that case. */
export const guardrailArgumentOptions = ({
	method,
	phase,
	methods,
	resultArgumentName = GUARDRAIL_RESULT_ARGUMENT,
}: {
	method: string;
	phase: GuardrailPhase;
	methods: InterceptableMethod[];
	resultArgumentName?: string;
}): InterceptableMethodArgument[] => {
	const trimmed = method.trim();
	const matched =
		trimmed && trimmed !== GUARDRAIL_ALL_METHODS
			? methods.find((candidate) => candidate.name === trimmed)
			: undefined;
	// a response guardrail reads the payload of a model response, so the value is
	// screenable unless the call returns something that is not one
	const resultArgument: InterceptableMethodArgument = {
		name: resultArgumentName,
		position: -1,
		nameIsFromSource: true,
		type: matched ? matched.returnType : "model response",
		guardable: matched ? matched.returnsModelResponse : true,
	};
	if (!matched) {
		return phase === "output" ? [resultArgument] : [];
	}
	return phase === "output"
		? [resultArgument, ...matched.arguments]
		: matched.arguments;
};

/** Whether a check has no input a masked value could be written back to. */
const entryHasMaskConflict = (entry: GuardrailReactorFormValue): boolean => {
	if (entry.failureAction !== "mask") {
		return false;
	}
	const fixedValueKeys = new Set(
		entry.directParameters.map((row) => row.key.trim()),
	);
	// Masking writes the guardrail's single returned value back to the argument
	// that supplied it, so one input has to read exactly one argument that no
	// fixed value overrides. A combined input cannot receive one value, and an
	// overridden input is never read from the call.
	return !entry.inputMapping.some(
		(row) =>
			splitArgs(row.args).length === 1 &&
			!fixedValueKeys.has(row.key.trim()),
	);
};

const validateDirectParameterValue = (
	row: GuardrailDirectParamFormValue,
): string | null => {
	const key = row.key.trim() || "unnamed";
	if (row.type === "number") {
		if (!row.value.trim() || !Number.isFinite(Number(row.value))) {
			return `Direct parameter "${key}" needs a numeric value.`;
		}
		return null;
	}
	if (!row.type.endsWith("-array") && row.type !== "json") {
		return null;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(row.value);
	} catch {
		return `Direct parameter "${key}" needs valid JSON.`;
	}
	if (row.type === "json") {
		return null;
	}
	if (!Array.isArray(parsed)) {
		return `Direct parameter "${key}" needs a JSON array.`;
	}

	const itemType = row.type.replace("-array", "");
	const itemsAreValid = parsed.every(
		(item) =>
			typeof item === itemType &&
			(itemType !== "number" || Number.isFinite(item)),
	);
	return itemsAreValid
		? null
		: `Direct parameter "${key}" must contain only ${itemType} values.`;
};

export type GuardrailIssueSeverity = "error" | "warning";

/** A problem found in the editor's value. Errors block saving; warnings flag
 * configuration that saves cleanly but is unlikely to screen anything. */
export interface GuardrailConfigIssue {
	/** Message shown to the user. */
	message: string;

	/** Whether the issue blocks saving. */
	severity: GuardrailIssueSeverity;

	/** Pipeline the issue belongs to, when it can be pinpointed. */
	pipelineId?: string;

	/** Phase the issue belongs to, when it can be pinpointed. */
	phase?: GuardrailPhase;

	/** Guardrail entry the issue belongs to, when it can be pinpointed. */
	entryId?: string;
}

/** Backend knowledge that lets validation flag method and argument names the
 * runtime will not resolve. Absent when the backend did not report them. */
export interface GuardrailValidationContext {
	/** Methods the engine can intercept. */
	methods?: InterceptableMethod[];

	/** Argument name carrying the model's return value. */
	resultArgumentName?: string;
}

/** The root segment of a mapped argument, so dot paths such as arg0.message
 * are checked against the argument they start from. */
const argumentRoot = (argument: string): string =>
	argument.trim().split(".")[0] ?? "";

/**
 * Every problem in the editor's value, in the order the user reads them.
 * Collecting all of them lets the editor list them at once instead of
 * surfacing one per save attempt.
 */
export const collectGuardrailConfigIssues = (
	value: GuardrailConfigFormValue,
	context: GuardrailValidationContext = {},
): GuardrailConfigIssue[] => {
	const issues: GuardrailConfigIssue[] = [];
	const methods = context.methods ?? [];
	const resultArgumentName =
		context.resultArgumentName ?? GUARDRAIL_RESULT_ARGUMENT;
	const seenMethods = new Set<string>();

	for (const pipeline of value.pipelines) {
		const method = pipeline.method.trim();
		const pipelineTarget = { pipelineId: pipeline.id };
		if (!method) {
			issues.push({
				message:
					"Every pipeline needs a method name (use * for all methods).",
				severity: "error",
				...pipelineTarget,
			});
		} else if (seenMethods.has(method)) {
			issues.push({
				message: `Pipeline method names must be unique - "${method}" is used more than once.`,
				severity: "error",
				...pipelineTarget,
			});
		} else {
			seenMethods.add(method);
		}

		const matchedMethod =
			method && method !== GUARDRAIL_ALL_METHODS
				? methods.find((candidate) => candidate.name === method)
				: undefined;
		if (method && method !== GUARDRAIL_ALL_METHODS && methods.length > 0) {
			if (!matchedMethod) {
				issues.push({
					message: `"${method}" is not a method this engine reports as interceptable, so this pipeline may never run.`,
					severity: "warning",
					...pipelineTarget,
				});
			} else if (matchedMethod.deprecated) {
				issues.push({
					message: `"${method}" is deprecated on the engine interface and may carry no traffic.`,
					severity: "warning",
					...pipelineTarget,
				});
			}
		}

		if (pipeline.input.length === 0 && pipeline.output.length === 0) {
			issues.push({
				message: `Pipeline "${method}" needs at least one guardrail.`,
				severity: "error",
				...pipelineTarget,
			});
		}

		for (const phase of ["input", "output"] as const) {
			for (const entry of pipeline[phase]) {
				const target = {
					pipelineId: pipeline.id,
					phase,
					entryId: entry.id,
				};
				if (!entry.guardrailEngineId) {
					issues.push({
						message: `Every guardrail in pipeline "${method}" needs a guardrail engine.`,
						severity: "error",
						...target,
					});
				}
				if (phase === "output" && entry.failureAction !== "block") {
					issues.push({
						message: `Output guardrails in pipeline "${method}" must block on failure.`,
						severity: "error",
						...target,
					});
				}
				if (
					entry.failureAction === "block" &&
					entry.blockErrorMessage.length > 0 &&
					!entry.blockErrorMessage.trim()
				) {
					issues.push({
						message: `The custom block message in pipeline "${method}" cannot be blank.`,
						severity: "error",
						...target,
					});
				}
				if (entry.inputMapping.length === 0) {
					issues.push({
						message: `Every guardrail in pipeline "${method}" needs a parameter mapping (under Advanced) - the guardrail receives no content to check without one.`,
						severity: "error",
						...target,
					});
				}
				if (entryHasMaskConflict(entry)) {
					issues.push({
						message: `Masking needs one input that reads a single argument and is not overridden by a fixed value, because the masked value is written back to that argument.`,
						severity: "error",
						...target,
					});
				}

				const seenMappingKeys = new Set<string>();
				for (const row of entry.inputMapping) {
					const key = row.key.trim();
					const args = splitArgs(row.args);
					if (!key || args.length === 0) {
						issues.push({
							message: `Every parameter mapping in pipeline "${method}" needs a parameter name and at least one argument.`,
							severity: "error",
							...target,
						});
					} else if (seenMappingKeys.has(key)) {
						issues.push({
							message: `Parameter mappings in pipeline "${method}" must have unique parameter names.`,
							severity: "error",
							...target,
						});
					} else {
						seenMappingKeys.add(key);
					}

					for (const argument of args) {
						const root = argumentRoot(argument);
						if (root === resultArgumentName) {
							if (phase === "input") {
								issues.push({
									message: `"${resultArgumentName}" only exists after the model runs, so an input guardrail receives nothing for "${key}".`,
									severity: "warning",
									...target,
								});
							} else if (
								matchedMethod &&
								!matchedMethod.returnsModelResponse
							) {
								// a response guardrail is handed the payload of a
								// model response; any other return value reaches it
								// as the object itself
								issues.push({
									message: `${method} returns ${matchedMethod.returnType} rather than a model response, so "${key}" receives that object rather than screenable content.`,
									severity: "warning",
									...target,
								});
							}
							continue;
						}
						if (!matchedMethod) {
							continue;
						}
						const matchedArgument = matchedMethod.arguments.find(
							(candidate) => candidate.name === root,
						);
						if (!matchedArgument) {
							issues.push({
								message: `"${root}" is not an argument of ${method}, so the guardrail receives nothing for "${key}".`,
								severity: "warning",
								...target,
							});
						} else if (
							!matchedArgument.guardable &&
							root === argument.trim()
						) {
							issues.push({
								message: `"${root}" is the ${matchedArgument.type} argument of ${method}, which is not text a guardrail can screen.`,
								severity: "warning",
								...target,
							});
						}
					}
				}

				const seenParamKeys = new Set<string>();
				for (const row of entry.directParameters) {
					const key = row.key.trim();
					if (!key) {
						issues.push({
							message: `Every direct parameter in pipeline "${method}" needs a name.`,
							severity: "error",
							...target,
						});
						continue;
					}
					if (seenParamKeys.has(key)) {
						issues.push({
							message: `Direct parameters in pipeline "${method}" must have unique names.`,
							severity: "error",
							...target,
						});
						continue;
					}
					seenParamKeys.add(key);
					const valueError = validateDirectParameterValue(row);
					if (valueError) {
						issues.push({
							message: `${valueError.slice(0, -1)} in pipeline "${method}".`,
							severity: "error",
							...target,
						});
					}
				}
			}
		}
	}
	return issues;
};

/** true when the config is submittable, otherwise the message to surface. */
export const validateGuardrailConfig = (
	value: GuardrailConfigFormValue,
): true | string => {
	const blocking = collectGuardrailConfigIssues(value).filter(
		(issue) => issue.severity === "error",
	);
	return blocking.length === 0 ? true : blocking[0].message;
};

const serializeReactorEntry = (
	entry: GuardrailReactorFormValue,
	phase: GuardrailPhase,
): Record<string, unknown> => {
	const failureAction = phase === "output" ? "block" : entry.failureAction;
	const params: Record<string, unknown> = {
		guardrailEngineId: entry.guardrailEngineId,
		blockOnGuardrailFailure: failureAction === "block",
		maskOnGuardrailFailure: failureAction === "mask",
		respondWithGuardrailMessage: failureAction === "respond",
		closeRoomOnBlock: failureAction === "block" && entry.closeRoomOnBlock,
	};
	if (failureAction === "block" && entry.blockErrorMessage.trim()) {
		params.blockErrorMessage = entry.blockErrorMessage.trim();
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
				directParameters[row.key.trim()] = Number(row.value);
			} else if (row.type === "boolean") {
				directParameters[row.key.trim()] = row.value === "true";
			} else if (row.type.endsWith("-array") || row.type === "json") {
				try {
					directParameters[row.key.trim()] = JSON.parse(row.value);
				} catch {
					directParameters[row.key.trim()] = row.value;
				}
			} else {
				directParameters[row.key.trim()] = row.value;
			}
		}
		params.directParameters = directParameters;
	}
	return {
		reactorClass:
			phase === "input"
				? GUARDRAIL_INPUT_REACTOR
				: GUARDRAIL_OUTPUT_REACTOR,
		params,
	};
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
			serialized.input = pipeline.input.map((entry) =>
				serializeReactorEntry(entry, "input"),
			);
		}
		if (pipeline.output.length > 0) {
			serialized.output = pipeline.output.map((entry) =>
				serializeReactorEntry(entry, "output"),
			);
		}
		pipelines[pipeline.method.trim()] = serialized;
	}
	return JSON.stringify({ pipelines });
};
