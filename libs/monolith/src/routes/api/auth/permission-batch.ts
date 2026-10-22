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
 *
 * A model usage limit is `{ unlimited, rules: [{ metric, amount, window,
 * windowLength?, counts }] }` (`ModelUsageLimit`, Semoss/src/prerna/auth/access):
 * `amount` is tokens, millionths of a US dollar or milliseconds, and
 * `windowLength` (minutes or hours of a `MINUTE` / `HOUR` window) is left out
 * for 1. A limit left out means no limit defined. End dates are ISO date-times
 * in UTC.
 */

import type { RequestOptions } from "../../../types";
import { get, post } from "../../../utility/http";
import { path } from "../../../utility/url";

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
 * @returns The people and groups with access (end dates as ISO UTC), and the caller's allowed changes. `teams` is empty and `access` left out for a group target.
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
		/** Models only: the levels whose usage limits the caller may change (all for owners, none otherwise). */
		limitLevels?: Array<"OWNER" | "EDIT" | "READ_ONLY">;
		/** Models only: whether the caller may change team, public use and total limits. */
		canChangeModelLimits?: boolean;
	};
	/** Models only. */
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
	/** Models only. */
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
	/** Models only. */
	costLimitsAvailable?: boolean;
	/**
	 * Models only, when it has known prices: the `MODELMETADATA.PRICING` entry
	 * cost is worked out with (`ModelUsageCost.priceEntry`), in US dollars per
	 * million tokens. The entry is passed through, so it may carry more keys
	 * (`tiers`, `context_over_200k`, `input_audio`, `output_audio`).
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
 * @returns One row per person, with their access on the source and the target (left out for a group, or when not in the target). On an engine each access carries its `usageLimit`.
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
		/** Models only. */
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
		/** Models only, when the team has a limit defined. */
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
	/** Models only. */
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
	/** Models only: the model's total, checked on every call. */
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
		path`/api/auth/permissionBatch/getEffectivePermissions`,
		params,
		options,
	);
}

/**
 * Shows how usage limits apply to one person on a model: the ceilings, then
 * each source in billing order with its state, rules and use. For the model's
 * editors and owners, about someone with a grant on it (their own or a team's).
 * The all-models and platform steps hide their rules (`rulesHidden: true`, no
 * `rules`) and team steps omit `teamTotal`, since those count use on other
 * models.
 *
 * @name getUsageLimitPath
 * @endpoint GET /api/auth/permissionBatch/getUsageLimitPath
 * @source Monolith/src/prerna/semoss/web/services/local/auth/PermissionBatchResource.java#getUsageLimitPath
 * @param params - Query parameters.
 * @param params.engineId - The model.
 * @param params.userId - The person.
 * @param params.userType - The person's login type (required).
 * @param options - Per-call overrides (signal, headers).
 * @returns The path. Step `id` / `type` are the person's (`DIRECT`, `ALL_MODELS`) or the team's (`TEAM`), and left out otherwise.
 * @throws {ApiError} 403 if the caller is not an editor or owner of the model; 400 if the engine is not a model, `userType` is missing, or the person has no grant on it.
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
		rulesHidden?: true;
		/** Left out when `rulesHidden`. */
		rules?: Array<{
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
		rulesHidden?: true;
		rules?: Array<{
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
 * @throws {ApiError} 403 if the caller cannot use the model; 400 if the engine is not a model.
 */
export function getMyUsageLimitPath(
	params: { engineId: string },
	options?: RequestOptions,
): Promise<{
	engineId: string;
	person: { id: string; type: string };
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
 * @throws {ApiError} 401 if the session is invalid or anonymous.
 */
export function getMyUsageLimitPaths(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<{
	models: Array<{
		engineId: string;
		name: string;
		/** The engine subtype, such as `OPEN_AI`; left out when not set. */
		subtype?: string;
		path: {
			engineId: string;
			person: { id: string; type: string };
			billedLimitType?:
				| "DIRECT"
				| "TEAM"
				| "PUBLIC"
				| "ALL_MODELS"
				| "PLATFORM";
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
				reason?: "NOT_PUBLIC" | "NO_GRANT";
				accessSince?: string;
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
					used?: number;
					resetsAt?: string;
				}>;
				teamTotal?: {
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
					window:
						| "MINUTE"
						| "HOUR"
						| "DAY"
						| "WEEK"
						| "MONTH"
						| "YEAR";
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
						window:
							| "MINUTE"
							| "HOUR"
							| "DAY"
							| "WEEK"
							| "MONTH"
							| "YEAR";
						windowLength?: number;
						counts: "EACH_PERSON" | "SHARED";
						used?: number;
						resetsAt?: string;
					}>;
				};
			}>;
		};
	}>;
}> {
	return get(
		path`/api/auth/permissionBatch/getMyUsageLimitPaths`,
		params,
		options,
	);
}
