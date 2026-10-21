/**
 * Bulk Access Management — `/api/auth/permissionBatch`.
 *
 * Backend: `PermissionBatchResource`
 * (Monolith/src/prerna/semoss/web/services/local/auth/PermissionBatchResource.java).
 * Response maps are built in `SecurityAccessPermissionBatchUtils`,
 * `PermissionBatchUtils`, `PermissionBatchValidation` and
 * `EffectivePermissionUtils` (Semoss/src/prerna/auth/utils), and
 * `ModelUsagePathView` (Semoss/src/prerna/engine/impl/model/usage).
 *
 * Makes many changes to who can use projects, engines and insights, and to who
 * is in or manages custom groups, then validates and saves them together. Every
 * change is checked against the caller's own permissions: being an admin counts
 * for nothing here (admins use `/api/auth/admin/permissionBatch`). Errors
 * follow `ResourceUtility.respond`: 401 when the session is invalid or
 * anonymous, 403 when the caller may not do it, 400 for bad input and 500 for
 * unexpected failures, each with an `{ errorMessage }` body (surfaced as
 * `ApiError`).
 */

import type { RequestOptions } from "@/types";
import { get, post } from "@/utility/http";
import { path } from "@/utility/url";

/**
 * Checks batches of access changes without saving anything, reporting for each
 * change whether the caller may make it and why not.
 *
 * @name validatePermissionBatches
 * @endpoint POST /api/auth/permissionBatch/validatePermissionBatches
 * @source Monolith/src/prerna/semoss/web/services/local/auth/PermissionBatchResource.java#validatePermissionBatches
 * @param params - Form fields.
 * @param params.batches - The batches, sent as JSON: each a `target` and its `changes`. `PUBLIC` and `MODEL` subjects take only a `CHANGE` on a model, with only a `usageLimit`. End dates are ISO dates and times with a zone.
 * @param options - Per-call overrides (signal, headers).
 * @returns One result per batch: its target, a `reason` when the whole batch is blocked, and each change's verdict by index.
 * @throws {ApiError} 400 if `batches` is missing or not a list of batches.
 */
export function validatePermissionBatches(
	params: {
		batches: Array<{
			target: {
				resourceType:
					| "PROJECT"
					| "ENGINE"
					| "INSIGHT"
					| "TEAM"
					| "TEAM_MANAGERS";
				id: string;
				/** The insight's project, for an `INSIGHT` target. */
				projectId?: string;
			};
			changes: Array<{
				action: "ADD" | "CHANGE" | "REMOVE";
				subject: {
					category: "USER" | "TEAM" | "PUBLIC" | "MODEL";
					id?: string;
					/** The user's login type or the group's type. */
					type?: string;
				};
				to?: {
					level?: "OWNER" | "EDIT" | "READ_ONLY";
					endDate?: string | null;
					usageLimit?: {
						unlimited?: boolean;
						rules?: Array<{
							metric: "TOKENS" | "COST" | "COMPUTE_TIME";
							amount: number;
							window:
								| "MINUTE"
								| "HOUR"
								| "DAY"
								| "WEEK"
								| "MONTH"
								| "YEAR";
							windowLength?: number;
							counts: "EACH_PERSON" | "SHARED";
						}>;
					} | null;
				};
			}>;
		}>;
	},
	options?: RequestOptions,
): Promise<
	Array<{
		target: { resourceType: string; id: string; projectId?: string };
		reason?: string;
		changes: Array<{ index: number; allowed: boolean; reason?: string }>;
	}>
> {
	return post(
		path`/api/auth/permissionBatch/validatePermissionBatches`,
		params,
		options,
	);
}

/**
 * Validates batches and saves every change of every batch in one transaction:
 * either all are saved or none is. People picked from the Microsoft directory
 * who have no account get one, and people given access are notified.
 *
 * @name savePermissionBatches
 * @endpoint POST /api/auth/permissionBatch/savePermissionBatches
 * @source Monolith/src/prerna/semoss/web/services/local/auth/PermissionBatchResource.java#savePermissionBatches
 * @param params - Form fields.
 * @param params.batches - The batches, sent as JSON, in the shape {@link validatePermissionBatches} takes.
 * @param options - Per-call overrides (signal, headers).
 * @returns How many targets and changes were saved.
 * @throws {ApiError} 400 if any change cannot be made (nothing is saved); 403 if a directory person cannot be looked up without a Microsoft login; 500 if the save fails (rolled back).
 */
export function savePermissionBatches(
	params: {
		batches: Array<{
			target: {
				resourceType:
					| "PROJECT"
					| "ENGINE"
					| "INSIGHT"
					| "TEAM"
					| "TEAM_MANAGERS";
				id: string;
				projectId?: string;
			};
			changes: Array<{
				action: "ADD" | "CHANGE" | "REMOVE";
				subject: {
					category: "USER" | "TEAM" | "PUBLIC" | "MODEL";
					id?: string;
					type?: string;
				};
				to?: {
					level?: "OWNER" | "EDIT" | "READ_ONLY";
					endDate?: string | null;
					usageLimit?: {
						unlimited?: boolean;
						rules?: Array<{
							metric: "TOKENS" | "COST" | "COMPUTE_TIME";
							amount: number;
							window:
								| "MINUTE"
								| "HOUR"
								| "DAY"
								| "WEEK"
								| "MONTH"
								| "YEAR";
							windowLength?: number;
							counts: "EACH_PERSON" | "SHARED";
						}>;
					} | null;
				};
			}>;
		}>;
	},
	options?: RequestOptions,
): Promise<{ targets: number; changes: number }> {
	return post(
		path`/api/auth/permissionBatch/savePermissionBatches`,
		params,
		options,
	);
}

/**
 * Reads who can use a project or an engine now, or who is in or manages a
 * custom group, in the shape batches use, plus what the caller may change. On
 * a model it adds the public use and total limits and the price.
 *
 * @name getPermissions
 * @endpoint GET /api/auth/permissionBatch/getPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/PermissionBatchResource.java#getPermissions
 * @param params - Query parameters.
 * @param params.resourceType - What to read (`INSIGHT` is rejected).
 * @param params.id - The project, engine or group id.
 * @param options - Per-call overrides (signal, headers).
 * @returns The people and groups with access (end dates as ISO UTC), and the caller's allowed changes. `teams` is empty for a group target and `access` is `null` for group members and managers.
 * @remarks Unverified response shape for `price` and the usage limit objects.
 * @throws {ApiError} 403 if the caller cannot view the target or manage the group; 400 if `resourceType` is missing or unknown.
 */
export function getPermissions(
	params: {
		resourceType: "PROJECT" | "ENGINE" | "TEAM" | "TEAM_MANAGERS";
		id: string;
	},
	options?: RequestOptions,
): Promise<{
	people: Array<{
		subject: {
			category: "USER";
			id: string;
			type: string;
			name: string | null;
			email: string | null;
		};
		access: {
			level: "OWNER" | "EDIT" | "READ_ONLY";
			endDate: string | null;
			usageLimit: Record<string, unknown> | null;
		} | null;
	}>;
	teams: Array<{
		subject: { category: "TEAM"; id: string; type: string };
		access: {
			level: "OWNER" | "EDIT" | "READ_ONLY";
			endDate: string | null;
			usageLimit: Record<string, unknown> | null;
		};
	}>;
	allowedPermissionChanges: {
		canChangePeople: boolean;
		canGiveAuthorAccess: boolean;
		canChangeTeams: boolean;
		addsAreAdminOnly: boolean;
		/** Models only: the levels whose usage limits the caller may change. */
		limitLevels?: string[];
		/** Models only. */
		canChangeModelLimits?: boolean;
	};
	/** Models only. */
	publicUse?: {
		isPublic: boolean;
		usageLimit: Record<string, unknown> | null;
	};
	/** Models only. */
	modelTotal?: { usageLimit: Record<string, unknown> | null };
	/** Models only. */
	costLimitsAvailable?: boolean;
	/** Models only: the price entry cost is worked out with. */
	price?: Record<string, unknown> | null;
}> {
	return get(path`/api/auth/permissionBatch/getPermissions`, params, options);
}

/**
 * Lists the people to copy from a project, engine or custom group into
 * another, with the access each has on both, so changes can be staged and
 * conflicts shown. Groups' managers are only copied to or from a group.
 *
 * @name getPermissionsToCopy
 * @endpoint GET /api/auth/permissionBatch/getPermissionsToCopy
 * @source Monolith/src/prerna/semoss/web/services/local/auth/PermissionBatchResource.java#getPermissionsToCopy
 * @param params - Query parameters.
 * @param params.sourceResourceType - What to copy from.
 * @param params.sourceId - The source id.
 * @param params.targetResourceType - What to copy into.
 * @param params.targetId - The target id.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per person, with their access on the source and the target (`null` for a group, or when not in the target).
 * @remarks Unverified response shape for the usage limit objects.
 * @throws {ApiError} 403 if the caller cannot see the source's or target's people; 400 for an unknown type, the same source and target, or managers copied to or from a project or engine.
 */
export function getPermissionsToCopy(
	params: {
		sourceResourceType: "PROJECT" | "ENGINE" | "TEAM" | "TEAM_MANAGERS";
		sourceId: string;
		targetResourceType: "PROJECT" | "ENGINE" | "TEAM" | "TEAM_MANAGERS";
		targetId: string;
	},
	options?: RequestOptions,
): Promise<
	Array<{
		subject: {
			category: "USER";
			id: string;
			type: string;
			name: string | null;
			email: string | null;
		};
		source: {
			level: "OWNER" | "EDIT" | "READ_ONLY";
			endDate: string | null;
			usageLimit: Record<string, unknown> | null;
		} | null;
		target: {
			level: "OWNER" | "EDIT" | "READ_ONLY";
			endDate: string | null;
			usageLimit: Record<string, unknown> | null;
		} | null;
		inTarget: boolean;
	}>
> {
	return get(
		path`/api/auth/permissionBatch/getPermissionsToCopy`,
		params,
		options,
	);
}

/**
 * Lists everyone who can use a project or an engine in the end, one row per
 * person, with the access they get directly and through each group. Only the
 * target's editors and owners may read it. On a model each row adds how the
 * person's use is billed.
 *
 * @name getEffectivePermissions
 * @endpoint GET /api/auth/permissionBatch/getEffectivePermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/PermissionBatchResource.java#getEffectivePermissions
 * @param params - Query parameters.
 * @param params.resourceType - `PROJECT` or `ENGINE`.
 * @param params.id - The project or engine id.
 * @param options - Per-call overrides (signal, headers).
 * @returns The people, the groups whose members come from a login provider (`unlistedTeams`) and, on a model, the public use and ceilings.
 * @remarks Unverified response shape for the model-only fields.
 * @throws {ApiError} 403 if the caller is not an editor or owner of the target; 400 if `resourceType` is missing or unknown.
 */
export function getEffectivePermissions(
	params: { resourceType: "PROJECT" | "ENGINE"; id: string },
	options?: RequestOptions,
): Promise<{
	people: Array<{
		subject: {
			category: "USER";
			id: string;
			type: string;
			name: string | null;
			email: string | null;
		};
		/** The most access any source gives. */
		level: "OWNER" | "EDIT" | "READ_ONLY";
		/** Most access first. */
		sources: Array<{
			sourceType: "DIRECT" | "TEAM";
			id?: string;
			type?: string;
			level: "OWNER" | "EDIT" | "READ_ONLY";
			endDate: string | null;
		}>;
		/** Models only. */
		usage?: {
			billedTo: {
				limitType: string;
				id: string | null;
				type: string | null;
			} | null;
			unlimited: boolean;
			rules: Array<Record<string, unknown>>;
			nextTeams: Array<{
				id: string;
				type: string;
				unlimited: boolean;
				rules: Array<Record<string, unknown>>;
			}>;
			notApplied: Array<{
				limitType: string;
				id: string | null;
				type: string | null;
				reason: string;
			}>;
		};
	}>;
	unlistedTeams: Array<{
		id: string;
		type: string;
		level: "OWNER" | "EDIT" | "READ_ONLY";
		/** Models only. */
		usageLimit?: Record<string, unknown> | null;
	}>;
	/** Models only. */
	publicUse?: {
		isPublic: boolean;
		usageLimit: Record<string, unknown> | null;
	};
	/** Models only. */
	ceilings?: Array<{
		limitType: "MODEL_TOTAL";
		usageLimit: Record<string, unknown> | null;
	}>;
}> {
	return get(
		path`/api/auth/permissionBatch/getEffectivePermissions`,
		params,
		options,
	);
}

/**
 * Shows how usage limits apply to one person on a model: the ceilings, then
 * each source in billing order with its state, rules and use. For the model's
 * editors and owners, about someone with a grant on it (their own or a team's).
 * The all-models and platform steps hide their rules (`rulesHidden: true`) and
 * team steps omit `teamTotal`, since those count use on other models.
 *
 * @name getUsageLimitPath
 * @endpoint GET /api/auth/permissionBatch/getUsageLimitPath
 * @source Monolith/src/prerna/semoss/web/services/local/auth/PermissionBatchResource.java#getUsageLimitPath
 * @param params - Query parameters.
 * @param params.engineId - The model.
 * @param params.userId - The person.
 * @param params.userType - The person's login type (required).
 * @param options - Per-call overrides (signal, headers).
 * @returns The path.
 * @remarks Unverified response shape for the step enums (`layer`, `state`, `reason`).
 * @throws {ApiError} 403 if the caller is not an editor or owner of the model; 400 if the engine is not a model, `userType` is missing, or the person has no grant on it.
 */
export function getUsageLimitPath(
	params: { engineId: string; userId: string; userType: string },
	options?: RequestOptions,
): Promise<{
	engineId: string;
	person: { id: string; type: string };
	billedLimitType: string | null;
	ceilings: Array<{
		layer: string;
		limitType: string;
		id: string | null;
		type: string | null;
		state: string | null;
		reason: string | null;
		accessSince: string | null;
		unlimited: boolean;
		rulesHidden?: true;
		rules?: Array<{
			metric: "TOKENS" | "COST" | "COMPUTE_TIME" | null;
			amount: number | null;
			window:
				| "MINUTE"
				| "HOUR"
				| "DAY"
				| "WEEK"
				| "MONTH"
				| "YEAR"
				| null;
			windowLength: number | null;
			counts: "EACH_PERSON" | "SHARED" | null;
			used: number | null;
			resetsAt: string | null;
		}>;
		teamTotal?: {
			unlimited: boolean;
			rules: Array<Record<string, unknown>>;
		} | null;
	}>;
	steps: Array<{
		layer: string;
		limitType: string;
		id: string | null;
		type: string | null;
		state: string | null;
		reason: string | null;
		accessSince: string | null;
		unlimited: boolean;
		rulesHidden?: true;
		rules?: Array<{
			metric: "TOKENS" | "COST" | "COMPUTE_TIME" | null;
			amount: number | null;
			window:
				| "MINUTE"
				| "HOUR"
				| "DAY"
				| "WEEK"
				| "MONTH"
				| "YEAR"
				| null;
			windowLength: number | null;
			counts: "EACH_PERSON" | "SHARED" | null;
			used: number | null;
			resetsAt: string | null;
		}>;
		teamTotal?: {
			unlimited: boolean;
			rules: Array<Record<string, unknown>>;
		} | null;
	}>;
}> {
	return get(
		path`/api/auth/permissionBatch/getUsageLimitPath`,
		params,
		options,
	);
}

/**
 * Shows how usage limits apply to the caller on a model, with every login's
 * grants and teams and nothing hidden, for anyone who can use the model.
 *
 * @name getMyUsageLimitPath
 * @endpoint GET /api/auth/permissionBatch/getMyUsageLimitPath
 * @source Monolith/src/prerna/semoss/web/services/local/auth/PermissionBatchResource.java#getMyUsageLimitPath
 * @param params - Query parameters.
 * @param params.engineId - The model.
 * @param options - Per-call overrides (signal, headers).
 * @returns The path, in the shape {@link getUsageLimitPath} returns, with every step's rules.
 * @remarks Unverified response shape for the steps.
 * @throws {ApiError} 403 if the caller cannot use the model; 400 if the engine is not a model.
 */
export function getMyUsageLimitPath(
	params: { engineId: string },
	options?: RequestOptions,
): Promise<{
	engineId: string;
	person: { id: string; type: string };
	billedLimitType: string | null;
	ceilings: Array<Record<string, unknown>>;
	steps: Array<Record<string, unknown>>;
}> {
	return get(
		path`/api/auth/permissionBatch/getMyUsageLimitPath`,
		params,
		options,
	);
}

/**
 * Shows how usage limits apply to the caller on every model they can use, for
 * a dashboard of their use. A model whose limits cannot be read is left out.
 *
 * @name getMyUsageLimitPaths
 * @endpoint GET /api/auth/permissionBatch/getMyUsageLimitPaths
 * @source Monolith/src/prerna/semoss/web/services/local/auth/PermissionBatchResource.java#getMyUsageLimitPaths
 * @param params - None.
 * @param options - Per-call overrides (signal, headers).
 * @returns Each model by id and name (display name, else name, else id), with its path in the shape {@link getMyUsageLimitPath} returns.
 * @remarks Unverified response shape for the paths' steps.
 * @throws {ApiError} 401 if the session is invalid or anonymous.
 */
export function getMyUsageLimitPaths(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<{
	models: Array<{
		engineId: string;
		name: string;
		subtype: string | null;
		path: {
			engineId: string;
			person: { id: string; type: string };
			billedLimitType: string | null;
			ceilings: Array<Record<string, unknown>>;
			steps: Array<Record<string, unknown>>;
		};
	}>;
}> {
	return get(
		path`/api/auth/permissionBatch/getMyUsageLimitPaths`,
		params,
		options,
	);
}
