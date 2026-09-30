import { formatSqlList, parseSqlList } from "@/components/ParamControl";
import {
	detectParameterTokens,
	hasDynamicOptionsCycle,
	interpolateParameterTokens,
} from "@/lib/parameterTokens";
import { escapeSqlForPixel } from "@/lib/pixel";
import { resolveParamDefault } from "@/lib/resolveQuery";
import type { ConditionalOptionBranch, Parameter } from "@/types/dashboard";
import {
	askLlm,
	cleanSql,
	fetchMetamodel,
	isSelectOnly,
	type RunPixel,
	type TableMeta,
} from "./aiBuilder";

export interface AiQueryDraft {
	query: string;
	parameters: Parameter[];
}

export interface PreparedAiQueryDraft extends AiQueryDraft {
	unresolvedParameters: string[];
}

export interface GenerateAiQueryArgs {
	runPixel: RunPixel;
	databaseId: string;
	modelId: string;
	prompt: string;
	currentQuery: string;
	currentParameters: Parameter[];
	metamodel?: TableMeta[];
}

const INPUT_TYPES = new Set<NonNullable<Parameter["inputType"]>>([
	"text",
	"dropdown",
	"multiselect",
	"date",
	"event",
]);
const PARAMETER_NAME_RE = /^[a-zA-Z0-9_]+$/;
const metamodelCache = new WeakMap<
	RunPixel,
	Map<string, Promise<TableMeta[]>>
>();

function uniqueStrings(value: unknown): string[] | undefined {
	if (!Array.isArray(value)) return undefined;
	const strings = value
		.map(String)
		.map((item) => item.trim())
		.filter(Boolean);
	return strings.length ? [...new Set(strings)] : undefined;
}

function createParameterId(): string {
	return typeof crypto !== "undefined" && crypto.randomUUID
		? crypto.randomUUID()
		: `p_${Math.random().toString(36).slice(2)}`;
}

function getCachedMetamodel(
	runPixel: RunPixel,
	databaseId: string,
): Promise<TableMeta[]> {
	let byDatabase = metamodelCache.get(runPixel);
	if (!byDatabase) {
		byDatabase = new Map();
		metamodelCache.set(runPixel, byDatabase);
	}
	const cached = byDatabase.get(databaseId);
	if (cached) return cached;
	const request = fetchMetamodel(runPixel, databaseId).catch((error) => {
		byDatabase.delete(databaseId);
		throw error;
	});
	byDatabase.set(databaseId, request);
	return request;
}

function firstColumn(output: unknown): string[] {
	const record =
		output && typeof output === "object"
			? (output as Record<string, unknown>)
			: undefined;
	const data = record?.data;
	const dataRecord =
		data && typeof data === "object" && !Array.isArray(data)
			? (data as Record<string, unknown>)
			: undefined;
	const values =
		dataRecord?.values ??
		record?.values ??
		(Array.isArray(data) ? data : []);
	if (!Array.isArray(values)) return [];
	const result: string[] = [];
	for (const row of values) {
		const value = Array.isArray(row) ? row[0] : row;
		if (
			value != null &&
			String(value) !== "" &&
			!result.includes(String(value))
		) {
			result.push(String(value));
		}
	}
	return result;
}

async function loadOptions(
	runPixel: RunPixel,
	databaseId: string,
	query: string,
): Promise<string[]> {
	const output = await runPixel(
		`Database(database=["${databaseId}"]) | Query("${escapeSqlForPixel(query)}") | Collect(-1);`,
	);
	return firstColumn(output);
}

function optionByIntent(
	parameter: Parameter,
	options: string[],
): string | undefined {
	if (options.length === 0) return undefined;
	const intent =
		`${parameter.name} ${parameter.label} ${parameter.defaultValue}`.toLowerCase();
	const wantsMinimum =
		/\b(min|minimum|lowest|lower)\b/.test(intent) ||
		/select\s+min\s*\(/i.test(parameter.defaultValue);
	const wantsMaximum =
		/\b(max|maximum|highest|upper)\b/.test(intent) ||
		/select\s+max\s*\(/i.test(parameter.defaultValue);
	if (!wantsMinimum && !wantsMaximum) return options[0];

	const numeric = options.map((value) => ({ value, number: Number(value) }));
	if (numeric.every((entry) => Number.isFinite(entry.number))) {
		return numeric.reduce((selected, candidate) =>
			wantsMaximum
				? candidate.number > selected.number
					? candidate
					: selected
				: candidate.number < selected.number
					? candidate
					: selected,
		).value;
	}
	return [...options].sort((left, right) =>
		left.localeCompare(right, undefined, { numeric: true }),
	)[wantsMaximum ? options.length - 1 : 0];
}

function parseJsonObject(text: string): Record<string, unknown> {
	let source = String(text ?? "")
		.trim()
		.replace(/^```(?:json)?\s*/i, "")
		.replace(/\s*```$/i, "");
	const start = source.indexOf("{");
	const end = source.lastIndexOf("}");
	if (start >= 0 && end > start) source = source.slice(start, end + 1);
	const parsed = JSON.parse(source) as unknown;
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error("The model did not return a JSON object.");
	}
	return parsed as Record<string, unknown>;
}

function normalizeSelect(
	value: unknown,
	description: string,
): string | undefined {
	const query = cleanSql(String(value ?? ""));
	if (!query) return undefined;
	if (!isSelectOnly(query)) {
		throw new Error(
			`${description} must be one read-only SELECT statement.`,
		);
	}
	return query;
}

function normalizeBranches(
	value: unknown,
): ConditionalOptionBranch[] | undefined {
	if (!Array.isArray(value)) return undefined;
	const branches = value.map((raw, index) => {
		if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
			throw new Error(`Conditional branch ${index + 1} is invalid.`);
		}
		const source = raw as Record<string, unknown>;
		const whenValue = String(source.whenValue ?? "").trim();
		if (!whenValue) {
			throw new Error(
				`Conditional branch ${index + 1} needs a whenValue.`,
			);
		}
		const optionsQuery = normalizeSelect(
			source.optionsQuery,
			`Conditional branch ${index + 1} query`,
		);
		const options = uniqueStrings(source.options);
		if (!optionsQuery && !options?.length) {
			throw new Error(
				`Conditional branch ${index + 1} needs static options or an options query.`,
			);
		}
		return {
			whenValue,
			optionsQuery,
			optionsDatabaseId: source.optionsDatabaseId
				? String(source.optionsDatabaseId).trim() || undefined
				: undefined,
			options,
		};
	});
	return branches.length ? branches : undefined;
}

function normalizeParameter(
	raw: unknown,
	existingByName: Map<string, Parameter>,
	index: number,
): Parameter {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
		throw new Error(`Parameter ${index + 1} is invalid.`);
	}
	const source = raw as Record<string, unknown>;
	const name = String(source.name ?? "").trim();
	if (!PARAMETER_NAME_RE.test(name)) {
		throw new Error(
			`Parameter ${index + 1} needs a name containing only letters, numbers, or underscores.`,
		);
	}
	const inputType = String(source.inputType ?? "text") as NonNullable<
		Parameter["inputType"]
	>;
	if (!INPUT_TYPES.has(inputType)) {
		throw new Error(`Parameter {{${name}}} has an unsupported input type.`);
	}

	const rawDefault = source.defaultValue;
	const defaultValue =
		inputType === "multiselect" && Array.isArray(rawDefault)
			? formatSqlList(rawDefault.map(String))
			: String(rawDefault ?? "").trim();
	const optionsQuery = normalizeSelect(
		source.optionsQuery,
		`Options query for {{${name}}}`,
	);
	const options = uniqueStrings(source.options);
	const conditionalOn = source.conditionalOn
		? String(source.conditionalOn).trim() || undefined
		: undefined;

	return {
		id: existingByName.get(name)?.id ?? createParameterId(),
		name,
		label: String(source.label ?? name.replace(/_/g, " ")).trim() || name,
		defaultValue,
		placeholder: source.placeholder
			? String(source.placeholder).trim() || undefined
			: undefined,
		inputType,
		required: source.required === true || undefined,
		useCurrentDate: source.useCurrentDate === true || undefined,
		options,
		optionsQuery,
		optionsDatabaseId: source.optionsDatabaseId
			? String(source.optionsDatabaseId).trim() || undefined
			: undefined,
		dynamicOptions: source.dynamicOptions === true || undefined,
		conditionalOn,
		conditionalBranches: normalizeBranches(source.conditionalBranches),
	};
}

function validateParameters(query: string, parameters: Parameter[]): void {
	const byName = new Map<string, Parameter>();
	for (const parameter of parameters) {
		if (byName.has(parameter.name)) {
			throw new Error(
				`Parameter {{${parameter.name}}} is defined more than once.`,
			);
		}
		byName.set(parameter.name, parameter);
	}

	const mainTokens = detectParameterTokens(query);
	const missing = mainTokens.filter((name) => !byName.has(name));
	if (missing.length) {
		throw new Error(
			`Missing definitions for ${missing.map((name) => `{{${name}}}`).join(", ")}.`,
		);
	}

	const usedNames = new Set(mainTokens);
	for (const parameter of parameters) {
		const isOptionType =
			parameter.inputType === "dropdown" ||
			parameter.inputType === "multiselect";
		if (
			!isOptionType &&
			(parameter.options?.length ||
				parameter.optionsQuery ||
				parameter.conditionalOn)
		) {
			throw new Error(
				`Only dropdown and multiselect parameters can define options: {{${parameter.name}}}.`,
			);
		}
		if (
			parameter.inputType === "date" &&
			parameter.defaultValue &&
			!/^\d{4}-\d{2}-\d{2}$/.test(parameter.defaultValue)
		) {
			throw new Error(
				`Date parameter {{${parameter.name}}} needs a YYYY-MM-DD default.`,
			);
		}
		if (
			parameter.inputType === "dropdown" &&
			parameter.defaultValue &&
			parameter.options?.length &&
			!parameter.options.includes(parameter.defaultValue)
		) {
			throw new Error(
				`Default for {{${parameter.name}}} is not in its static options.`,
			);
		}
		if (
			parameter.inputType === "multiselect" &&
			parameter.defaultValue &&
			parameter.options?.length
		) {
			const invalid = parseSqlList(parameter.defaultValue).filter(
				(value) => !parameter.options?.includes(value),
			);
			if (invalid.length) {
				throw new Error(
					`Default for {{${parameter.name}}} contains unknown options.`,
				);
			}
		}

		const dependencies = detectParameterTokens(
			parameter.optionsQuery ?? "",
		);
		dependencies.forEach((name) => {
			usedNames.add(name);
		});
		if (
			dependencies.length &&
			!parameter.dynamicOptions &&
			!parameter.conditionalOn
		) {
			throw new Error(
				`Options query for {{${parameter.name}}} uses parameters but is not dynamic.`,
			);
		}
		if (parameter.dynamicOptions) {
			if (!parameter.optionsQuery || dependencies.length === 0) {
				throw new Error(
					`Dynamic parameter {{${parameter.name}}} needs a tokenized options query.`,
				);
			}
			for (const dependencyName of dependencies) {
				const dependency = byName.get(dependencyName);
				if (!dependency) {
					throw new Error(
						`{{${parameter.name}}} depends on unknown {{${dependencyName}}}.`,
					);
				}
				if (dependencyName === parameter.name) {
					throw new Error(
						`Options for {{${parameter.name}}} cannot depend on themselves.`,
					);
				}
				if (dependency.inputType === "event") {
					throw new Error(
						`Event parameter {{${dependencyName}}} cannot drive dynamic options.`,
					);
				}
			}
			if (hasDynamicOptionsCycle(parameters, parameter.name)) {
				throw new Error(
					`Dynamic options for {{${parameter.name}}} create a circular dependency.`,
				);
			}
		}

		if (parameter.conditionalOn) {
			usedNames.add(parameter.conditionalOn);
			const parent = byName.get(parameter.conditionalOn);
			if (!parent || parent === parameter) {
				throw new Error(
					`Conditional parameter {{${parameter.name}}} needs a different existing parent.`,
				);
			}
			if (parent.inputType !== "dropdown") {
				throw new Error(
					`Conditional parent {{${parent.name}}} must be a dropdown.`,
				);
			}
			if (!isOptionType) {
				throw new Error(
					`Conditional parameter {{${parameter.name}}} must select options.`,
				);
			}
			if (!parameter.conditionalBranches?.length) {
				throw new Error(
					`Conditional parameter {{${parameter.name}}} needs at least one branch.`,
				);
			}
			const branchValues = new Set<string>();
			for (const branch of parameter.conditionalBranches) {
				if (branchValues.has(branch.whenValue)) {
					throw new Error(
						`Conditional parameter {{${parameter.name}}} repeats branch ${branch.whenValue}.`,
					);
				}
				branchValues.add(branch.whenValue);
				if (
					parent.options?.length &&
					!parent.options.includes(branch.whenValue)
				) {
					throw new Error(
						`Branch ${branch.whenValue} is not an option of {{${parent.name}}}.`,
					);
				}
				const branchTokens = detectParameterTokens(
					branch.optionsQuery ?? "",
				);
				if (branchTokens.some((name) => name !== parent.name)) {
					throw new Error(
						`Branches for {{${parameter.name}}} may only reference {{${parent.name}}}.`,
					);
				}
			}
		} else if (parameter.conditionalBranches?.length) {
			throw new Error(
				`Conditional branches for {{${parameter.name}}} need a conditionalOn parent.`,
			);
		}
	}

	const unused = parameters.filter(
		(parameter) => !usedNames.has(parameter.name),
	);
	if (unused.length) {
		throw new Error(`Unused generated parameter: {{${unused[0].name}}}.`);
	}
}

export function parseAiQueryDraft(
	response: string,
	currentParameters: Parameter[],
): AiQueryDraft {
	let payload: Record<string, unknown>;
	try {
		payload = parseJsonObject(response);
	} catch (error) {
		throw new Error(
			`The model returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
			{ cause: error },
		);
	}
	const query = normalizeSelect(
		payload.sql ?? payload.query,
		"Generated SQL",
	);
	if (!query) throw new Error("The model did not return SQL.");
	if (!Array.isArray(payload.parameters)) {
		throw new Error("The model did not return a parameters array.");
	}
	const existingByName = new Map(
		currentParameters.map((parameter) => [parameter.name, parameter]),
	);
	const parameters = payload.parameters.map((parameter, index) =>
		normalizeParameter(parameter, existingByName, index),
	);
	validateParameters(query, parameters);
	return { query, parameters };
}

export async function generateAiQueryDraft(
	args: GenerateAiQueryArgs,
): Promise<AiQueryDraft> {
	const prompt = args.prompt.trim();
	if (!args.databaseId) throw new Error("Select a database first.");
	if (!prompt) throw new Error("Describe the query you want first.");
	const metamodel =
		args.metamodel ??
		(await getCachedMetamodel(args.runPixel, args.databaseId));
	const command = [
		`User request:\n${prompt}`,
		`Database schema:\n${JSON.stringify(metamodel)}`,
		`Current SQL:\n${args.currentQuery || "(empty)"}`,
		`Current parameters:\n${JSON.stringify(args.currentParameters)}`,
	].join("\n\n");
	const response = await askLlm(
		args.runPixel,
		args.modelId,
		command,
		QUERY_WRITER_CONTEXT,
	);
	return parseAiQueryDraft(response, args.currentParameters);
}

export async function prepareAiQueryDraft(
	runPixel: RunPixel,
	databaseId: string,
	draft: AiQueryDraft,
): Promise<PreparedAiQueryDraft> {
	const parameters = draft.parameters.map((parameter) => ({
		...parameter,
		options: parameter.options ? [...parameter.options] : undefined,
		conditionalBranches: parameter.conditionalBranches?.map((branch) => ({
			...branch,
			options: branch.options ? [...branch.options] : undefined,
		})),
	}));
	const values: Record<string, string> = Object.fromEntries(
		parameters.map((parameter) => [
			parameter.name,
			resolveParamDefault(parameter),
		]),
	);
	const unresolved = new Set<string>();

	for (let pass = 0; pass < parameters.length; pass += 1) {
		let resolvedInPass = false;
		for (const parameter of parameters) {
			if (parameter.inputType === "event") continue;
			const selectsOptions =
				parameter.inputType === "dropdown" ||
				parameter.inputType === "multiselect";
			if (!selectsOptions && values[parameter.name]) continue;

			let availableOptions = [...(parameter.options ?? [])];
			let optionQuery = parameter.optionsQuery;
			let optionDatabaseId = parameter.optionsDatabaseId || databaseId;

			if (parameter.conditionalOn) {
				const parentValue = values[parameter.conditionalOn];
				if (!parentValue) continue;
				const branch = parameter.conditionalBranches?.find(
					(candidate) => candidate.whenValue === parentValue,
				);
				if (branch) {
					availableOptions = [...(branch.options ?? [])];
					optionQuery = branch.optionsQuery;
					optionDatabaseId =
						branch.optionsDatabaseId || optionDatabaseId;
					if (optionQuery) {
						optionQuery = optionQuery.replaceAll(
							`{{${parameter.conditionalOn}}}`,
							parentValue,
						);
					}
				}
			} else if (parameter.dynamicOptions && optionQuery) {
				const dependencies = detectParameterTokens(optionQuery);
				if (dependencies.some((name) => !values[name])) continue;
				optionQuery = interpolateParameterTokens(optionQuery, values);
			}

			if (optionQuery) {
				const loadedOptions = await loadOptions(
					runPixel,
					optionDatabaseId,
					optionQuery,
				);
				availableOptions = [
					...new Set([...loadedOptions, ...availableOptions]),
				];
			}

			if (!selectsOptions) continue;
			const currentSelections =
				parameter.inputType === "multiselect"
					? parseSqlList(parameter.defaultValue)
					: parameter.defaultValue
						? [parameter.defaultValue]
						: [];
			const validSelections = currentSelections.filter((value) =>
				availableOptions.includes(value),
			);
			const selected =
				validSelections[0] ??
				optionByIntent(parameter, availableOptions);
			if (!selected) {
				parameter.options = [
					...new Set([...(parameter.options ?? []), "No Selection"]),
				];
				parameter.defaultValue = "No Selection";
				values[parameter.name] = "";
				unresolved.add(parameter.name);
				continue;
			}

			parameter.defaultValue =
				parameter.inputType === "multiselect"
					? formatSqlList(
							validSelections.length
								? validSelections
								: [selected],
						)
					: selected;
			values[parameter.name] = resolveParamDefault(parameter);
			unresolved.delete(parameter.name);
			resolvedInPass = true;
		}
		if (!resolvedInPass) break;
	}

	parameters
		.filter(
			(parameter) =>
				parameter.inputType !== "event" &&
				!resolveParamDefault(parameter).trim(),
		)
		.forEach((parameter) => {
			unresolved.add(parameter.name);
		});
	const unresolvedParameters = [...unresolved];
	if (unresolvedParameters.length === 0) {
		let resolvedQuery = draft.query;
		for (const parameter of parameters) {
			resolvedQuery = resolvedQuery.replaceAll(
				`{{${parameter.name}}}`,
				values[parameter.name] ||
					(parameter.inputType === "event" ? "NULL" : ""),
			);
		}
		await runPixel(
			`Database(database=["${databaseId}"]) | Query("${escapeSqlForPixel(resolvedQuery)}") | Collect(1);`,
		);
	}
	return { query: draft.query, parameters, unresolvedParameters };
}

const QUERY_WRITER_CONTEXT = `You write one read-only SQL SELECT and its complete parameter definitions.
Return ONLY one JSON object with this shape:
{"sql":"SELECT ...","parameters":[{"name":"region","label":"Region","inputType":"dropdown","defaultValue":"East","required":true,"options":["East","West"]}]}

Rules:
- Use only tables and columns from the supplied schema.
- Prefer unquoted table and column identifiers. Do not add double quotes around simple schema names such as DIABETES or weight; quoted lowercase identifiers can fail on case-folding databases. Quote an identifier only when its schema name contains spaces or punctuation that requires quoting.
- Treat the current SQL and parameters as editable context, not authoritative syntax. Correct them when they conflict with these rules or the user request.
- Parameter references use {{name}}. Every SQL token needs exactly one parameter definition.
- Supported inputType values: text, dropdown, multiselect, date, event.
- Quote tokens only for text-valued columns, for example WHERE Region = '{{region}}'. Keep numeric range tokens unquoted, for example WHERE weight BETWEEN {{min_weight}} AND {{max_weight}}.
- Multiselect tokens are already SQL-escaped lists; use WHERE Region IN ({{regions}}).
- dropdown/multiselect may use options, or optionsQuery whose first selected column supplies options.
- For dependent option lists, set dynamicOptions true and reference sibling tokens in optionsQuery.
- For IF behavior, set conditionalOn to a dropdown parent and provide conditionalBranches with whenValue plus options or optionsQuery.
- A conditional branch optionsQuery may reference only its parent token.
- SQL and all option queries must be one read-only SELECT. Never emit DDL or DML.
- A dropdown defaultValue must be a literal value returned by options/optionsQuery, never a SELECT expression or subquery.
- When the requested default is the minimum or maximum database value, order the optionsQuery ASC or DESC respectively and leave defaultValue empty; the application loads the options and selects the correct endpoint.
- Supply literal defaults when possible. Dates use YYYY-MM-DD; a multiselect default is a SQL list such as 'East','West'.
- Do not include parameter ids; the application owns them.`;
