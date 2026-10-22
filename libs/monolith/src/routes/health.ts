/**
 * Liveness, readiness and health probes — `/health`.
 *
 * Backend: `HealthResource`
 * (Monolith/src/prerna/semoss/web/services/config/HealthResource.java), on the
 * dedicated `/health` servlet (`HealthApplication`). The probes skip the
 * security filters and never create a session, so they work before login and
 * even when startup failed.
 */

import type { RequestOptions } from "../types";
import { get } from "../utility/http";
import { path } from "../utility/url";

/**
 * Liveness: the servlet container is serving requests. Always `UP` when
 * reachable; checks nothing downstream.
 *
 * @name getHealth
 * @endpoint GET /health/
 * @source Monolith/src/prerna/semoss/web/services/config/HealthResource.java#liveness
 * @param params - No parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ status: "UP" }`.
 * @throws {ApiError} Only if the server is unreachable or misrouted.
 */
export function getHealth(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<{ status: "UP" }> {
	return get(path`/health/`, params, options);
}

/**
 * Readiness: whether startup (`DBLoader`) has finished successfully.
 *
 * @name ready
 * @endpoint GET /health/ready
 * @source Monolith/src/prerna/semoss/web/services/config/HealthResource.java#readiness
 * @param params - No parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ status: "READY", startupComplete: true }`.
 * @throws {ApiError} 503 while starting up or after a failed startup, with `data` = `{ status: "NOT_READY", startupComplete: false }`.
 */
export function ready(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<{ status: "READY"; startupComplete: true }> {
	return get(path`/health/ready`, params, options);
}

/**
 * Health: whether every required system database (local master, security)
 * and every enabled optional one (scheduler, user tracking, audit logs, model
 * inference logs, notifications) is connected. Disabled ones are `DISABLED`
 * and do not affect the overall status.
 *
 * @name details
 * @endpoint GET /health/details
 * @source Monolith/src/prerna/semoss/web/services/config/HealthResource.java#health
 * @param params - No parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns The overall status, startup flags and a per-resource status keyed by the system database name.
 * @throws {ApiError} 503 when any required or enabled resource is down, with the same body (`status: "DOWN"`) in `data`.
 */
export function details(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<{
	status: "UP" | "DOWN";
	startupComplete: boolean;
	startupSuccess: boolean;
	resources: Record<string, "UP" | "DOWN" | "DISABLED">;
}> {
	return get(path`/health/details`, params, options);
}
