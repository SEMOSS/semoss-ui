/**
 * Admin model usage limits — `/api/auth/admin/modelUsage`.
 *
 * Backend: `AdminModelUsageResource`
 * (Monolith/src/prerna/semoss/web/services/local/auth/AdminModelUsageResource.java).
 * Limits are read and written by `SecurityModelUsageLimitUtils`
 * (Semoss/src/prerna/auth/utils); the limit is `prerna.auth.access.ModelUsageLimit`.
 *
 * These are the limits only admins set that are not grants: the General
 * Platform Limit (for everyone with no other limit on any model) and a team's
 * total across all models. Every endpoint answers `{ usageLimit }`; the key is
 * left out (Gson drops nulls) when no limit is defined.
 *
 * Errors follow `ResourceUtility.respondAsAdmin`: 401 when the session is
 * invalid, 403 when the caller is not an admin, 400 for bad input and 500 for
 * unexpected failures, each with an `{ errorMessage }` body (surfaced as `ApiError`).
 */

import type { RequestOptions } from "../../../../lib/api-types";
import { get, post } from "../../../../utility/http";
import { path } from "../../../../utility/url";

/**
 * Reads the General Platform Limit.
 *
 * @name getPlatformDefault
 * @endpoint GET /api/auth/admin/modelUsage/getPlatformDefault
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminModelUsageResource.java#getPlatformDefault
 * @param params - No parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns The limit; `usageLimit` is absent when none is defined.
 * @throws {ApiError} 403 if the caller is not an admin.
 */
export function getPlatformDefault(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<{
	usageLimit?: {
		unlimited: boolean;
		rules: Array<{
			metric: "TOKENS" | "COST" | "COMPUTE_TIME";
			/** Tokens, millionths of a US dollar or milliseconds, by `metric`. */
			amount: number;
			window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
			/** Minutes or hours a minute or hour window spans; absent for 1. */
			windowLength?: number;
			counts: "EACH_PERSON" | "SHARED";
		}>;
	};
}> {
	return get(
		path`/api/auth/admin/modelUsage/getPlatformDefault`,
		params,
		options,
	);
}

/**
 * Sets (or, with `null`, removes) the General Platform Limit. Rules with an
 * amount of 0 are dropped, and a limit left with no rules is removed.
 *
 * @name setPlatformDefault
 * @endpoint POST /api/auth/admin/modelUsage/setPlatformDefault
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminModelUsageResource.java#setPlatformDefault
 * @param params - Form fields.
 * @param params.usageLimit - The new limit, or `null` to remove it.
 * @param options - Per-call overrides (signal, headers).
 * @returns The limit as saved; `usageLimit` is absent when none is defined.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if the limit is invalid.
 */
export function setPlatformDefault(
	params: {
		usageLimit: {
			unlimited: boolean;
			rules: Array<{
				metric: "TOKENS" | "COST" | "COMPUTE_TIME";
				amount: number;
				window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
				windowLength?: number | null;
				counts: "EACH_PERSON" | "SHARED";
			}>;
		} | null;
	},
	options?: RequestOptions,
): Promise<{
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
}> {
	return post(
		path`/api/auth/admin/modelUsage/setPlatformDefault`,
		params,
		options,
	);
}

/**
 * Reads a team's total, the ceiling on its use across all models.
 *
 * @name getTeamTotal
 * @endpoint GET /api/auth/admin/modelUsage/getTeamTotal
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminModelUsageResource.java#getTeamTotal
 * @param params - Query parameters.
 * @param params.groupId - The team (group) id.
 * @param params.type - The team's type, e.g. `"CUSTOM"`.
 * @param options - Per-call overrides (signal, headers).
 * @returns The limit; `usageLimit` is absent when none is defined.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if `groupId` or `type` is missing.
 */
export function getTeamTotal(
	params: { groupId: string; type: string },
	options?: RequestOptions,
): Promise<{
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
}> {
	return get(path`/api/auth/admin/modelUsage/getTeamTotal`, params, options);
}

/**
 * Sets (or, with `null`, removes) a team's total across all models.
 *
 * @name setTeamTotal
 * @endpoint POST /api/auth/admin/modelUsage/setTeamTotal
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminModelUsageResource.java#setTeamTotal
 * @param params - Form fields.
 * @param params.groupId - The team (group) id.
 * @param params.type - The team's type, e.g. `"CUSTOM"`.
 * @param params.usageLimit - The new limit, or `null` to remove it.
 * @param options - Per-call overrides (signal, headers).
 * @returns The limit as saved; `usageLimit` is absent when none is defined.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if `groupId` or `type` is missing or the limit is invalid.
 */
export function setTeamTotal(
	params: {
		groupId: string;
		type: string;
		usageLimit: {
			unlimited: boolean;
			rules: Array<{
				metric: "TOKENS" | "COST" | "COMPUTE_TIME";
				amount: number;
				window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
				windowLength?: number | null;
				counts: "EACH_PERSON" | "SHARED";
			}>;
		} | null;
	},
	options?: RequestOptions,
): Promise<{
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
}> {
	return post(path`/api/auth/admin/modelUsage/setTeamTotal`, params, options);
}
