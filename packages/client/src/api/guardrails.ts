import { runPixel } from "@semoss/sdk/react";
import { isRecord } from "@semoss/utility/object";

interface CreateGuardrailEngineOutput {
	engine_id?: string;
	database_id?: string;
}

/**
 * Creates a guardrail engine whose configuration is persisted as SMSS
 * properties and returns its catalog identifier.
 *
 * @param insightId - Insight used to execute the Pixel request.
 * @param name - Catalog name for the guardrail.
 * @param details - Guardrail type and engine-specific SMSS properties.
 * @returns The created guardrail engine identifier.
 */
export const createGuardrailEngine = async (
	insightId: string | undefined,
	name: string,
	details: Record<string, unknown>,
): Promise<string> => {
	const pixel = `CreateGuardrailEngine(guardrail=[${JSON.stringify(name)}],guardrailDetails=[${JSON.stringify(details)}]);`;
	const response = await runPixel<[CreateGuardrailEngineOutput]>(
		pixel,
		insightId,
	).catch((error) => {
		throw Error(error);
	});

	if (response.errors.length > 0) {
		throw Error(response.errors.join("\n"));
	}

	const output = response.pixelReturn[0]?.output;
	const engineId = output?.engine_id ?? output?.database_id;
	if (!engineId) {
		throw Error("No guardrail engine identifier was returned");
	}

	return engineId;
};

/**
 * The SQL query policy guardrail's built-in identifier rules, by SMSS policy
 * property, such as FUNCTION_POLICY: each name or pattern to the access it
 * requires.
 */
export type SqlQueryPolicyDefaults = Record<string, Record<string, string>>;

/**
 * The pixel that reads the SQL query policy guardrail's built-in identifier
 * rules for a dialect, the ones it applies when PROTECT_UNMATCHED_IDENTIFIERS
 * is on. Read it with usePixel and {@link parseSqlQueryPolicyDefaults}.
 *
 * @param dialect - The SQL_DIALECT, such as POSTGRESQL; GENERIC holds every dialect's rules.
 * @returns The pixel.
 */
export const sqlQueryPolicyDefaultsQuery = (dialect: string): string =>
	`GetSqlQueryPolicyDefaults(dialect=[${JSON.stringify(dialect)}]);`;

/**
 * The built-in identifier rules GetSqlQueryPolicyDefaults returned, keeping
 * each policy given as an object and each rule whose access is text.
 *
 * @param output - The pixel's output.
 * @returns Each policy's built-in rules, name to access.
 * @throws When the output is not an object of policies.
 */
export const parseSqlQueryPolicyDefaults = (
	output: unknown,
): SqlQueryPolicyDefaults => {
	if (!isRecord(output)) {
		throw Error("The built-in SQL query policy rules were not returned");
	}
	const defaults: SqlQueryPolicyDefaults = {};
	for (const [policy, rules] of Object.entries(output)) {
		if (!isRecord(rules)) {
			continue;
		}
		defaults[policy] = Object.fromEntries(
			Object.entries(rules).filter(
				(entry): entry is [string, string] =>
					typeof entry[1] === "string",
			),
		);
	}
	return defaults;
};
