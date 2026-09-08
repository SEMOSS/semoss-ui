/**
 * The parameters a guardrail engine declares, read from GetEngineUsage. Both
 * the parameter mapping and the fixed value editors offer these names, so a
 * guardrail is wired with parameters it actually reads.
 */

import { usePixel } from "@semoss/sdk/react";
import type { GuardrailDirectParamFormValue } from "./engine-guardrail-settings.constants";

/** One parameter a guardrail engine accepts. */
export interface GuardrailParameterOption {
	/** Parameter name the guardrail reads. */
	name: string;

	/** Java type the engine declares, such as List<String>. */
	type: string;

	/** Engine supplied explanation of the parameter. */
	description: string;

	/** Whether the guardrail requires the parameter. */
	required: boolean;
}

/** Load state of a guardrail engine's declared parameters. */
export type GuardrailParametersStatus =
	| "no-engine"
	| "loading"
	| "error"
	| "loaded";

/** The parameters and load state for one guardrail engine. */
export interface GuardrailEngineParameters {
	options: GuardrailParameterOption[];
	status: GuardrailParametersStatus;
}

interface GuardrailUsageSection {
	parameters?: unknown;
}

/** Pull the parameter list out of a GetEngineUsage response, ignoring
 * sections that do not describe parameters. */
export const getGuardrailParameters = (
	data: unknown,
): GuardrailParameterOption[] => {
	if (!data || typeof data !== "object") {
		return [];
	}

	const sections = Array.isArray(data) ? data : Object.values(data);
	for (const section of sections) {
		if (!section || typeof section !== "object") {
			continue;
		}
		const parameters = (section as GuardrailUsageSection).parameters;
		if (!Array.isArray(parameters)) {
			continue;
		}

		return parameters.flatMap((parameter) => {
			if (!parameter || typeof parameter !== "object") {
				return [];
			}
			const candidate = parameter as Partial<GuardrailParameterOption>;
			if (typeof candidate.name !== "string" || !candidate.name.trim()) {
				return [];
			}
			return [
				{
					name: candidate.name,
					type:
						typeof candidate.type === "string"
							? candidate.type
							: "String",
					description:
						typeof candidate.description === "string"
							? candidate.description
							: "",
					required: candidate.required === true,
				},
			];
		});
	}
	return [];
};

/** Map a guardrail engine's declared Java type onto the editor's value type. */
export const guardrailParameterTypeForForm = (
	type: string,
): GuardrailDirectParamFormValue["type"] => {
	const normalized = type.toLowerCase().replaceAll(" ", "");
	const isArray =
		normalized.includes("list") ||
		normalized.includes("array") ||
		normalized.endsWith("[]");
	if (isArray) {
		const isArrayOf = (itemType: string) =>
			normalized.includes(`<${itemType}>`) ||
			normalized.endsWith(`${itemType}[]`);
		if (isArrayOf("boolean")) {
			return "boolean-array";
		}
		if (
			["double", "float", "integer", "long", "number", "short"].some(
				(numberType) => isArrayOf(numberType),
			)
		) {
			return "number-array";
		}
		if (isArrayOf("string")) {
			return "string-array";
		}
		return "json";
	}
	if (normalized.includes("boolean")) {
		return "boolean";
	}
	if (
		["double", "float", "integer", "long", "number", "short"].some(
			(numberType) => normalized === numberType,
		)
	) {
		return "number";
	}
	if (normalized.includes("map") || normalized.includes("object")) {
		return "json";
	}
	return "string";
};

/**
 * Loads the parameters a guardrail engine declares. Fetching once per
 * guardrail check keeps the mapping and fixed value editors working from the
 * same list.
 *
 * @param guardrailEngineId engine to describe, or an empty string for none
 */
export const useGuardrailEngineParameters = (
	guardrailEngineId: string,
): GuardrailEngineParameters => {
	const usage = usePixel<unknown>(
		guardrailEngineId
			? `GetEngineUsage(engine=[${JSON.stringify(guardrailEngineId)}]);`
			: "",
	);

	if (!guardrailEngineId) {
		return { options: [], status: "no-engine" };
	}
	if (usage.status === "LOADING" || usage.status === "INITIAL") {
		return { options: [], status: "loading" };
	}
	if (usage.status === "ERROR") {
		return { options: [], status: "error" };
	}
	return { options: getGuardrailParameters(usage.data), status: "loaded" };
};
