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

/** A user locked out of an engine after their guardrail hits reached a limit */
export interface EngineGuardrailLock {
	/** The user's id */
	userId: string;
	/** The user's login type, such as NATIVE */
	userType: string;
	/** The user's name, or null when the platform has none */
	name: string | null;
	/** The user's email, or null when the platform has none */
	email: string | null;
	/** The hit limit that locked them out */
	limitId: string;
	/** When the lock started, as UTC ISO text */
	lockedAt: string;
	/** When the lock ends, as UTC ISO text */
	lockedUntil: string;
}

/**
 * The pixel that reads the users locked out of an engine. Read it with
 * usePixel and {@link parseEngineGuardrailLocks}.
 *
 * @param engineId - The engine.
 * @returns The pixel.
 */
export const engineGuardrailLocksQuery = (engineId: string): string =>
	`GetEngineGuardrailLocks(engine=[${JSON.stringify(engineId)}]);`;

/**
 * The locks GetEngineGuardrailLocks returned, keeping each row that names a
 * user and when the lock ends.
 *
 * @param output - The pixel's output.
 * @returns The locks, ending soonest first.
 * @throws When the output is not a list.
 */
export const parseEngineGuardrailLocks = (
	output: unknown,
): EngineGuardrailLock[] => {
	if (!Array.isArray(output)) {
		throw Error("The locked users were not returned");
	}
	return output.flatMap((row) => {
		if (
			!isRecord(row) ||
			typeof row.userId !== "string" ||
			typeof row.userType !== "string" ||
			typeof row.lockedUntil !== "string"
		) {
			return [];
		}
		return [
			{
				userId: row.userId,
				userType: row.userType,
				name: typeof row.name === "string" ? row.name : null,
				email: typeof row.email === "string" ? row.email : null,
				limitId: typeof row.limitId === "string" ? row.limitId : "",
				lockedAt: typeof row.lockedAt === "string" ? row.lockedAt : "",
				lockedUntil: row.lockedUntil,
			},
		];
	});
};

/**
 * The pixel that ends a user's guardrail lock on an engine early.
 *
 * @param engineId - The engine.
 * @param userId - The locked user's id.
 * @param userType - The locked user's login type.
 * @returns The pixel.
 */
export const clearEngineGuardrailLockPixel = (
	engineId: string,
	userId: string,
	userType: string,
): string =>
	`ClearEngineGuardrailLock(engine=[${JSON.stringify(engineId)}], userId=[${JSON.stringify(userId)}], userType=[${JSON.stringify(userType)}]);`;
