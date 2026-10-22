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
 * windowLength?, counts }] }` (`ModelUsageLimit`, Semoss/src/prerna/auth/access):
 * `amount` is tokens, millionths of a US dollar or milliseconds, and
 * `windowLength` (minutes or hours of a `MINUTE` / `HOUR` window) is left out
 * for 1. A limit left out means no limit defined. End dates are ISO date-times
 * in UTC.
 */

import type { RequestOptions } from "../../../../types";
import { get, post } from "../../../../utility/http";
import { path } from "../../../../utility/url";

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
					/** On a model: the limit, or `null` for no limit defined. */
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
		changes: Array<{ index: number; allowed: boolean; reason?: string }>;
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
 * @returns `people` (each with `subject` and `access`, left out for a group), `teams` (none for a group), `allowedPermissionChanges`, and on a model `publicUse`, `modelTotal`, `costLimitsAvailable` and `price`.
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
			name?: string;
			email?: string;
		};
		access?: {
			level: "OWNER" | "EDIT" | "READ_ONLY";
			endDate?: string;
			/** On a model, when the grant has a limit defined. */
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
					windowLength?: number;
					counts: "EACH_PERSON" | "SHARED";
				}>;
			};
		};
	}>;
	teams: Array<{
		subject: { category: "TEAM"; id: string; type: string };
		access: {
			level: "OWNER" | "EDIT" | "READ_ONLY";
			endDate?: string;
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
					windowLength?: number;
					counts: "EACH_PERSON" | "SHARED";
				}>;
			};
		};
	}>;
	allowedPermissionChanges: {
		canChangePeople: boolean;
		canGiveAuthorAccess: boolean;
		canChangeTeams: boolean;
		addsAreAdminOnly: boolean;
		/** On a model: the levels whose usage limits may be changed (every level in admin mode). */
		limitLevels?: Array<"OWNER" | "EDIT" | "READ_ONLY">;
		/** On a model: whether team, public use and total limits may be changed. */
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
				windowLength?: number;
				counts: "EACH_PERSON" | "SHARED";
			}>;
		};
	};
	modelTotal?: {
		usageLimit?: {
			unlimited: boolean;
			rules: Array<{
				metric: "TOKENS" | "COST" | "COMPUTE_TIME";
				amount: number;
				window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
				windowLength?: number;
				counts: "EACH_PERSON" | "SHARED";
			}>;
		};
	};
	costLimitsAvailable?: boolean;
	/**
	 * On a model with known prices: the `MODELMETADATA.PRICING` entry cost is
	 * worked out with (`ModelUsageCost.priceEntry`), in US dollars per million
	 * tokens. The entry is passed through, so it may carry more keys (`tiers`,
	 * `context_over_200k`, `input_audio`, `output_audio`).
	 */
	price?: {
		servingProvider?: string;
		modelId?: string;
		input: number;
		output: number;
		cache_read?: number;
		cache_write?: number;
		reasoning?: number;
		[key: string]: unknown;
	};
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
 * @returns One row per person. `source` is left out for a group's members; `target` when they are not in the target or it is a group. On an engine each access carries its `usageLimit`.
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
			name?: string;
			email?: string;
		};
		source?: {
			level: "OWNER" | "EDIT" | "READ_ONLY";
			endDate?: string;
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
					windowLength?: number;
					counts: "EACH_PERSON" | "SHARED";
				}>;
			};
		};
		target?: {
			level: "OWNER" | "EDIT" | "READ_ONLY";
			endDate?: string;
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
					windowLength?: number;
					counts: "EACH_PERSON" | "SHARED";
				}>;
			};
		};
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
			name?: string;
			email?: string;
		};
		/** The most access any source gives. */
		level: "OWNER" | "EDIT" | "READ_ONLY";
		/** Most access first. */
		sources: Array<
			| {
					sourceType: "DIRECT";
					level: "OWNER" | "EDIT" | "READ_ONLY";
					endDate?: string;
			  }
			| {
					sourceType: "TEAM";
					/** The group's name. */
					id: string;
					/** The group's type. */
					type: string;
					level: "OWNER" | "EDIT" | "READ_ONLY";
					endDate?: string;
			  }
		>;
		/** On a model. */
		usage?: {
			/** The source the person's calls are billed to; left out when no limit applies. */
			billedTo?: {
				limitType:
					| "DIRECT"
					| "TEAM"
					| "PUBLIC"
					| "ALL_MODELS"
					| "PLATFORM";
				/** The person's id (`DIRECT`, `ALL_MODELS`) or the team's name (`TEAM`). */
				id?: string;
				/** The person's login type or the team's type. */
				type?: string;
			};
			/** Whether the billed source is Unlimited. */
			unlimited: boolean;
			/** The billed source's rules. */
			rules: Array<{
				metric: "TOKENS" | "COST" | "COMPUTE_TIME";
				amount: number;
				window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
				windowLength?: number;
				counts: "EACH_PERSON" | "SHARED";
			}>;
			/** When a team is billed: the other teams calls move on to, in billing order. */
			nextTeams: Array<{
				id: string;
				type: string;
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
					windowLength?: number;
					counts: "EACH_PERSON" | "SHARED";
				}>;
			}>;
			/** Limits defined for the person that do not apply, and why. */
			notApplied: Array<{
				limitType:
					| "DIRECT"
					| "TEAM"
					| "PUBLIC"
					| "ALL_MODELS"
					| "PLATFORM";
				id?: string;
				type?: string;
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
		/** On a model, when the team has a limit defined. */
		usageLimit?: {
			unlimited: boolean;
			rules: Array<{
				metric: "TOKENS" | "COST" | "COMPUTE_TIME";
				amount: number;
				window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
				windowLength?: number;
				counts: "EACH_PERSON" | "SHARED";
			}>;
		};
	}>;
	/** On a model. */
	publicUse?: {
		isPublic: boolean;
		usageLimit?: {
			unlimited: boolean;
			rules: Array<{
				metric: "TOKENS" | "COST" | "COMPUTE_TIME";
				amount: number;
				window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
				windowLength?: number;
				counts: "EACH_PERSON" | "SHARED";
			}>;
		};
	};
	/** On a model: the model's total, checked on every call. */
	ceilings?: Array<{
		limitType: "MODEL_TOTAL";
		usageLimit?: {
			unlimited: boolean;
			rules: Array<{
				metric: "TOKENS" | "COST" | "COMPUTE_TIME";
				amount: number;
				window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
				windowLength?: number;
				counts: "EACH_PERSON" | "SHARED";
			}>;
		};
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
 * @returns The path. Step `id` / `type` are the person's (`DIRECT`, `ALL_MODELS`) or the team's (`TEAM`), and left out otherwise.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if the engine does not exist or is not a model, or a field is missing.
 */
export function getUsageLimitPath(
	params: { engineId: string; userId: string; userType: string },
	options?: RequestOptions,
): Promise<{
	engineId: string;
	person: { id: string; type: string };
	/** Left out when no limit applies. */
	billedLimitType?: "DIRECT" | "TEAM" | "PUBLIC" | "ALL_MODELS" | "PLATFORM";
	ceilings: Array<{
		layer: "CEILING" | "BILLED";
		limitType:
			| "MODEL_TOTAL"
			| "DIRECT"
			| "TEAM"
			| "PUBLIC"
			| "ALL_MODELS"
			| "PLATFORM";
		id?: string;
		type?: string;
		state:
			| "DEFINED"
			| "NOT_DEFINED"
			| "SKIPPED"
			| "NOT_REACHED"
			| "CHECKED"
			| "BILLED"
			| "NEXT"
			| "REACHED";
		/** Why a `SKIPPED` step is skipped. */
		reason?: "NOT_PUBLIC" | "NO_GRANT";
		/** Team steps: when the person got access through the team (ISO UTC). */
		accessSince?: string;
		unlimited: boolean;
		rules: Array<{
			metric: "TOKENS" | "COST" | "COMPUTE_TIME";
			amount: number;
			window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
			windowLength?: number;
			counts: "EACH_PERSON" | "SHARED";
			/** Used in the current window; left out when not read. */
			used?: number;
			/** When the window starts again (ISO UTC); left out when not read. */
			resetsAt?: string;
		}>;
		teamTotal?: {
			unlimited: boolean;
			rules: Array<{
				metric: "TOKENS" | "COST" | "COMPUTE_TIME";
				amount: number;
				window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
				windowLength?: number;
				counts: "EACH_PERSON" | "SHARED";
				used?: number;
				resetsAt?: string;
			}>;
		};
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
		id?: string;
		type?: string;
		state:
			| "DEFINED"
			| "NOT_DEFINED"
			| "SKIPPED"
			| "NOT_REACHED"
			| "CHECKED"
			| "BILLED"
			| "NEXT"
			| "REACHED";
		reason?: "NOT_PUBLIC" | "NO_GRANT";
		accessSince?: string;
		unlimited: boolean;
		rules: Array<{
			metric: "TOKENS" | "COST" | "COMPUTE_TIME";
			amount: number;
			window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
			windowLength?: number;
			counts: "EACH_PERSON" | "SHARED";
			used?: number;
			resetsAt?: string;
		}>;
		teamTotal?: {
			unlimited: boolean;
			rules: Array<{
				metric: "TOKENS" | "COST" | "COMPUTE_TIME";
				amount: number;
				window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
				windowLength?: number;
				counts: "EACH_PERSON" | "SHARED";
				used?: number;
				resetsAt?: string;
			}>;
		};
	}>;
}> {
	return get(
		path`/api/auth/admin/permissionBatch/getUsageLimitPath`,
		params,
		options,
	);
}
