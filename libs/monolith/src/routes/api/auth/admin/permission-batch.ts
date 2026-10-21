/**
 * Bulk Access Management in admin mode — `/api/auth/admin/permissionBatch`.
 *
 * Backend: `AdminPermissionBatchResource`
 * (Monolith/src/prerna/semoss/web/services/local/auth/AdminPermissionBatchResource.java).
 * Response maps are built in `SecurityAccessPermissionBatchUtils`,
 * `PermissionBatchUtils`, `PermissionBatchValidation` and
 * `EffectivePermissionUtils` (Semoss/src/prerna/auth/utils), and in
 * `ModelUsagePathView` (Semoss/src/prerna/engine/impl/model/usage).
 *
 * The same calls as the non-admin permission batch resource, for admins only:
 * an admin can read and change any project, engine, insight or custom group
 * whatever their own access. Errors follow `ResourceUtility.respondAsAdmin`:
 * 401 when the session is invalid, 403 when the caller is not an admin,
 * 400 for bad input and 500 for unexpected failures, each with an
 * `{ errorMessage }` body (surfaced as `ApiError`).
 *
 * A resource type is `PROJECT`, `ENGINE`, `INSIGHT`, `TEAM` (a custom group's
 * members) or `TEAM_MANAGERS` (its managers), with the group's name as the id.
 * A model usage limit is `{ unlimited, rules: [{ metric, amount, window,
 * windowLength?, counts }] }`. End dates are ISO date-times in UTC.
 */

import type { RequestOptions } from "@/types";
import { get, post } from "@/utility/http";
import { path } from "@/utility/url";

/**
 * Validates permission batches without saving anything: for each batch, which
 * changes would be allowed and why not.
 *
 * @name validatePermissionBatches
 * @endpoint POST /api/auth/admin/permissionBatch/validatePermissionBatches
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminPermissionBatchResource.java#validatePermissionBatches
 * @param params - Form fields.
 * @param params.batches - The batches: each a target and its ordered changes. `PUBLIC` and `MODEL` subjects (a model's public use and total) take no id or type and only a `CHANGE` whose `to` carries just `usageLimit`.
 * @param options - Per-call overrides (signal, headers).
 * @returns One result per batch, with each change's index, whether it is allowed and the reason when not. A batch-level `reason` blocks every change.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if `batches` is missing or not a list of batches.
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
				/** For an insight, its project. */
				projectId?: string;
			};
			changes: Array<{
				action: "ADD" | "CHANGE" | "REMOVE";
				subject: {
					category: "USER" | "TEAM" | "PUBLIC" | "MODEL";
					id?: string;
					/** The user's login type, or the group's type. */
					type?: string;
				};
				/** The access after an add or a change; unused for a removal. */
				to?: {
					level?: "OWNER" | "EDIT" | "READ_ONLY";
					endDate?: string | null;
					usageLimit?: {
						unlimited: boolean;
						rules: Array<{
							metric: "TOKENS" | "COST" | "COMPUTE_TIME";
							amount: number;
							window:
								| "MINUTE"
								| "HOUR"
								| "DAY"
								| "WEEK"
								| "MONTH"
								| "YEAR";
							windowLength?: number | null;
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
		reason?: string;
		changes: Array<{
			index: number;
			allowed: boolean;
			reason?: string | null;
		}>;
	}>
> {
	return post(
		path`/api/auth/admin/permissionBatch/validatePermissionBatches`,
		params,
		options,
	);
}

/**
 * Validates and saves permission batches in one transaction: every change of
 * every batch is saved, or none is.
 *
 * @name savePermissionBatches
 * @endpoint POST /api/auth/admin/permissionBatch/savePermissionBatches
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminPermissionBatchResource.java#savePermissionBatches
 * @param params - Form fields.
 * @param params.batches - The batches, as for {@link validatePermissionBatches}.
 * @param options - Per-call overrides (signal, headers).
 * @returns How many targets and changes were saved.
 * @throws {ApiError} 403 if the caller is not an admin or a Microsoft directory user cannot be looked up; 400 if any change cannot be made (with the reasons); 500 if the save fails (rolled back).
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
						unlimited: boolean;
						rules: Array<{
							metric: "TOKENS" | "COST" | "COMPUTE_TIME";
							amount: number;
							window:
								| "MINUTE"
								| "HOUR"
								| "DAY"
								| "WEEK"
								| "MONTH"
								| "YEAR";
							windowLength?: number | null;
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
		path`/api/auth/admin/permissionBatch/savePermissionBatches`,
		params,
		options,
	);
}

/**
 * Reads who can use a project or an engine now (people given access directly,
 * and groups), or who is in or manages a custom group, in the shape batches
 * use, plus what may be changed. On a model the result also carries its
 * public use, its total, whether cost limits are available and its price entry.
 *
 * @name getPermissions
 * @endpoint GET /api/auth/admin/permissionBatch/getPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminPermissionBatchResource.java#getPermissions
 * @param params - Query parameters.
 * @param params.resourceType - `PROJECT`, `ENGINE`, `TEAM` or `TEAM_MANAGERS`.
 * @param params.id - The project, engine or group id.
 * @param options - Per-call overrides (signal, headers).
 * @returns `people` (each with `subject` and `access`, `null` for a group), `teams` (none for a group), `allowedPermissionChanges`, and on a model `publicUse`, `modelTotal`, `costLimitsAvailable` and `price`.
 * @remarks Unverified response shape for `price` (`ModelUsageCost.priceEntry`).
 * @throws {ApiError} 403 if the caller is not an admin; 400 if the resource type is missing or unknown.
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
			/** On an engine. */
			usageLimit?: {
				unlimited: boolean;
				rules: Array<{
					metric: "TOKENS" | "COST" | "COMPUTE_TIME";
					amount: number;
					window:
						| "MINUTE"
						| "HOUR"
						| "DAY"
						| "WEEK"
						| "MONTH"
						| "YEAR";
					windowLength?: number | null;
					counts: "EACH_PERSON" | "SHARED";
				}>;
			} | null;
		} | null;
	}>;
	teams: Array<{
		subject: { category: "TEAM"; id: string; type: string };
		access: {
			level: "OWNER" | "EDIT" | "READ_ONLY";
			endDate: string | null;
			usageLimit?: {
				unlimited: boolean;
				rules: Array<{
					metric: "TOKENS" | "COST" | "COMPUTE_TIME";
					amount: number;
					window:
						| "MINUTE"
						| "HOUR"
						| "DAY"
						| "WEEK"
						| "MONTH"
						| "YEAR";
					windowLength?: number | null;
					counts: "EACH_PERSON" | "SHARED";
				}>;
			} | null;
		};
	}>;
	allowedPermissionChanges: {
		canChangePeople: boolean;
		canGiveAuthorAccess: boolean;
		canChangeTeams: boolean;
		addsAreAdminOnly: boolean;
		/** On a model: the levels whose usage limits may be changed. */
		limitLevels?: string[];
		/** On a model. */
		canChangeModelLimits?: boolean;
	};
	publicUse?: {
		isPublic: boolean;
		usageLimit?: {
			unlimited: boolean;
			rules: Array<{
				metric: "TOKENS" | "COST" | "COMPUTE_TIME";
				amount: number;
				window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
				windowLength?: number | null;
				counts: "EACH_PERSON" | "SHARED";
			}>;
		} | null;
	};
	modelTotal?: {
		usageLimit?: {
			unlimited: boolean;
			rules: Array<{
				metric: "TOKENS" | "COST" | "COMPUTE_TIME";
				amount: number;
				window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
				windowLength?: number | null;
				counts: "EACH_PERSON" | "SHARED";
			}>;
		} | null;
	};
	costLimitsAvailable?: boolean;
	price?: Record<string, unknown> | null;
}> {
	return get(
		path`/api/auth/admin/permissionBatch/getPermissions`,
		params,
		options,
	);
}

/**
 * Reads the people to copy into a target from a source, with the access each
 * has on both, so a copy can be staged and conflicts shown. From a project or
 * engine its directly-granted people are copied (not its groups); from a custom
 * group its members or managers.
 *
 * @name getPermissionsToCopy
 * @endpoint GET /api/auth/admin/permissionBatch/getPermissionsToCopy
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminPermissionBatchResource.java#getPermissionsToCopy
 * @param params - Query parameters.
 * @param params.sourceResourceType - `PROJECT`, `ENGINE`, `TEAM` or `TEAM_MANAGERS`.
 * @param params.sourceId - The source's id.
 * @param params.targetResourceType - `PROJECT`, `ENGINE`, `TEAM` or `TEAM_MANAGERS`.
 * @param params.targetId - The target's id.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per person. `source` is `null` for a group's members; `target` is `null` when they are not in the target or it is a group. On an engine each access carries its `usageLimit`.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if a resource type is missing or unknown.
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
			usageLimit?: Record<string, unknown> | null;
		} | null;
		target: {
			level: "OWNER" | "EDIT" | "READ_ONLY";
			endDate: string | null;
			usageLimit?: Record<string, unknown> | null;
		} | null;
		inTarget: boolean;
	}>
> {
	return get(
		path`/api/auth/admin/permissionBatch/getPermissionsToCopy`,
		params,
		options,
	);
}

/**
 * Reads everyone who can use a project or an engine in the end, one row per
 * person, with the most access any source gives and each source (direct or
 * through a custom group). On a model each row adds how their usage is billed.
 *
 * @name getEffectivePermissions
 * @endpoint GET /api/auth/admin/permissionBatch/getEffectivePermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminPermissionBatchResource.java#getEffectivePermissions
 * @param params - Query parameters.
 * @param params.resourceType - `PROJECT` or `ENGINE`.
 * @param params.id - The project or engine id.
 * @param options - Per-call overrides (signal, headers).
 * @returns `people` and `unlistedTeams` (groups whose members come from a login provider); on a model also `publicUse` and `ceilings`.
 * @remarks Unverified nested shape of `usage` (`EffectivePermissionUtils.usageOf`); typed from its Javadoc.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if the resource type is not a project or engine.
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
		level: "OWNER" | "EDIT" | "READ_ONLY";
		sources: Array<{
			sourceType: "DIRECT" | "TEAM";
			/** The group, for a `TEAM` source. */
			id?: string;
			type?: string;
			level: "OWNER" | "EDIT" | "READ_ONLY";
			endDate: string | null;
		}>;
		/** On a model. */
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
				reason:
					| "DIRECT_WINS"
					| "TEAM_WINS"
					| "UNLIMITED_TEAM_WINS"
					| "PUBLIC_WINS"
					| "ALL_MODELS_WINS"
					| "NOT_PUBLIC";
			}>;
		};
	}>;
	unlistedTeams: Array<{
		id: string;
		type: string;
		level: "OWNER" | "EDIT" | "READ_ONLY";
		/** On a model. */
		usageLimit?: Record<string, unknown> | null;
	}>;
	publicUse?: {
		isPublic: boolean;
		usageLimit?: Record<string, unknown> | null;
	};
	ceilings?: Array<{
		limitType: "MODEL_TOTAL";
		usageLimit?: Record<string, unknown> | null;
	}>;
}> {
	return get(
		path`/api/auth/admin/permissionBatch/getEffectivePermissions`,
		params,
		options,
	);
}

/**
 * Reads how usage limits apply to one person on a model: the ceilings, then
 * each source in billing order with its state, rules and what each rule has
 * used so far. Admin mode shows every step's rules, needs no grant and hides
 * nothing.
 *
 * @name getUsageLimitPath
 * @endpoint GET /api/auth/admin/permissionBatch/getUsageLimitPath
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminPermissionBatchResource.java#getUsageLimitPath
 * @param params - Query parameters.
 * @param params.engineId - The model.
 * @param params.userId - The person's user id.
 * @param params.userType - The person's login type (required).
 * @param options - Per-call overrides (signal, headers).
 * @returns The path.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if the engine does not exist or is not a model, or a field is missing.
 */
export function getUsageLimitPath(
	params: { engineId: string; userId: string; userType: string },
	options?: RequestOptions,
): Promise<{
	engineId: string;
	person: { id: string; type: string };
	billedLimitType:
		| "MODEL_TOTAL"
		| "DIRECT"
		| "TEAM"
		| "PUBLIC"
		| "ALL_MODELS"
		| "PLATFORM"
		| null;
	ceilings: Array<{
		layer: "CEILING" | "BILLED";
		limitType:
			| "MODEL_TOTAL"
			| "DIRECT"
			| "TEAM"
			| "PUBLIC"
			| "ALL_MODELS"
			| "PLATFORM";
		id: string | null;
		type: string | null;
		state:
			| "DEFINED"
			| "NOT_DEFINED"
			| "SKIPPED"
			| "NOT_REACHED"
			| "CHECKED"
			| "BILLED"
			| "NEXT"
			| "REACHED"
			| null;
		reason: "NOT_PUBLIC" | "NO_GRANT" | null;
		accessSince: string | null;
		unlimited: boolean;
		rulesHidden?: true;
		rules?: Array<{
			metric: "TOKENS" | "COST" | "COMPUTE_TIME";
			amount: number;
			window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
			windowLength: number | null;
			counts: "EACH_PERSON" | "SHARED";
			used: number | null;
			resetsAt: string | null;
		}>;
		teamTotal?: {
			unlimited: boolean;
			rules: Array<{
				metric: "TOKENS" | "COST" | "COMPUTE_TIME";
				amount: number;
				window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
				windowLength: number | null;
				counts: "EACH_PERSON" | "SHARED";
				used: number | null;
				resetsAt: string | null;
			}>;
		} | null;
	}>;
	/** Same shape as `ceilings`. */
	steps: Array<{
		layer: "CEILING" | "BILLED";
		limitType:
			| "MODEL_TOTAL"
			| "DIRECT"
			| "TEAM"
			| "PUBLIC"
			| "ALL_MODELS"
			| "PLATFORM";
		id: string | null;
		type: string | null;
		state: string | null;
		reason: "NOT_PUBLIC" | "NO_GRANT" | null;
		accessSince: string | null;
		unlimited: boolean;
		rulesHidden?: true;
		rules?: Array<{
			metric: "TOKENS" | "COST" | "COMPUTE_TIME";
			amount: number;
			window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
			windowLength: number | null;
			counts: "EACH_PERSON" | "SHARED";
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
		path`/api/auth/admin/permissionBatch/getUsageLimitPath`,
		params,
		options,
	);
}
