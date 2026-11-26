import { tryParseJson } from "@semoss/utility/json";
import { isRecord } from "@semoss/utility/object";

/**
 * Why the access check let an engine or project call through, as the Activity
 * Log records it (`ACCESS_REASON`), or REFUSED for a call it refused. Rows
 * logged before the reason was recorded have none.
 */
export const ACCESS_REASONS = [
	"DIRECT",
	"TEAM",
	"PUBLIC",
	"DELEGATED",
	"OWN_PROJECT",
	"INSIGHT",
	"DISCOVERABLE",
	"ADMIN",
	"PLATFORM",
	"REFUSED",
] as const;

/** One of {@link ACCESS_REASONS} */
export type AccessReason = (typeof ACCESS_REASONS)[number];

/**
 * The details a row can carry behind its reason (`ACCESS_DETAILS`), in the
 * order the detail drawer shows them
 */
export const ACCESS_DETAIL_KEYS = [
	"level",
	"teamId",
	"teamType",
	"granteeId",
	"granteeType",
	"via",
	"callingEngineId",
	"appId",
	"agentId",
	"rule",
	"operation",
	"levelNeeded",
	"attempt",
] as const;

/** One of {@link ACCESS_DETAIL_KEYS} */
export type AccessDetailKey = (typeof ACCESS_DETAIL_KEYS)[number];

/** One detail behind a row's reason */
export interface AccessDetail {
	/** Which detail it is */
	key: AccessDetailKey;
	/** Its value as the row recorded it, such as READ_ONLY, a team's id or 2 */
	value: string;
}

/**
 * @param value - a value from a row
 * @returns whether it is a reason the Activity Log records
 */
export const isAccessReason = (value: unknown): value is AccessReason =>
	typeof value === "string" &&
	(ACCESS_REASONS as readonly string[]).includes(value);

/**
 * Reads the details a row carries behind its reason, leaving out any it does
 * not know and any that is not text or a number.
 *
 * @param accessDetails - the row's details, as JSON, or nothing
 * @returns the details, in the order the drawer shows them
 */
export const readAccessDetails = (
	accessDetails: string | null | undefined,
): AccessDetail[] => {
	if (!accessDetails) {
		return [];
	}
	const parsed = tryParseJson(accessDetails);
	if (!isRecord(parsed)) {
		return [];
	}
	return ACCESS_DETAIL_KEYS.flatMap((key) => {
		const value = parsed[key];
		return typeof value === "string" || typeof value === "number"
			? [{ key, value: String(value) }]
			: [];
	});
};

/** The access levels a detail names: Author, Editor and Read-Only */
export const ACCESS_LEVELS = ["OWNER", "EDIT", "READ_ONLY"] as const;

/** One of {@link ACCESS_LEVELS} */
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

/**
 * How an app, an agent or an engine made a call (`via`): an app's custom code,
 * an agent's run, an engine's own code, or the platform for the person
 */
export const ACCESS_VIAS = [
	"APP_CODE",
	"AGENT_RUN",
	"ENGINE_CODE",
	"PLATFORM",
] as const;

/** One of {@link ACCESS_VIAS} */
export type AccessVia = (typeof ACCESS_VIAS)[number];

/** Which of the platform's own work let a call through (`rule`) */
export const ACCESS_RULES = [
	"LOADING",
	"PLATFORM_USE",
	"PLATFORM_OPERATION",
	"ENGINE_ITSELF",
	"PROJECT_ENGINE",
	"VENV",
	"BEING_CREATED_OR_DELETED",
] as const;

/** One of {@link ACCESS_RULES} */
export type AccessRule = (typeof ACCESS_RULES)[number];

/**
 * @param value - a detail's value
 * @returns whether it is an access level
 */
export const isAccessLevel = (value: string): value is AccessLevel =>
	(ACCESS_LEVELS as readonly string[]).includes(value);

/**
 * @param value - a detail's value
 * @returns whether it says how a call was made
 */
export const isAccessVia = (value: string): value is AccessVia =>
	(ACCESS_VIAS as readonly string[]).includes(value);

/**
 * @param value - a detail's value
 * @returns whether it names the platform's work
 */
export const isAccessRule = (value: string): value is AccessRule =>
	(ACCESS_RULES as readonly string[]).includes(value);
