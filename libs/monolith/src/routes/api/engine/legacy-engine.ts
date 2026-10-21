/**
 * Legacy database calls — `/api/engine/e-{engineId}`.
 *
 * Backend: `OldEngineResource`
 * (Monolith/src/prerna/semoss/web/services/local/OldEngineResource.java),
 * located by `NameServer#getLocalDatabase`
 * (Monolith/src/prerna/semoss/web/services/local/NameServer.java).
 *
 * The whole class is `@Deprecated`. The locator resolves the engine alias and
 * requires view access to the database; without it the locator answers
 * `{ errorMessage }` with status 400.
 */

import type { RequestOptions } from "@/types";
import { get, post } from "@/utility/http";
import { path } from "@/utility/url";

/**
 * Returns the parameters of a saved legacy insight in this database, by
 * running `GetPlaysheetParamsReactor`.
 *
 * @name insight
 * @endpoint GET /api/engine/e-{engineId}/insight
 * @source Monolith/src/prerna/semoss/web/services/local/OldEngineResource.java#getInsightParams
 * @param params - Path and query parameters.
 * @param params.engineId - The database id or alias.
 * @param params.insight - The saved insight id.
 * @param options - Per-call overrides (signal, headers).
 * @returns The reactor's output.
 * @remarks Unverified response shape.
 * @throws {ApiError} 400 if the caller cannot view the database.
 * @deprecated Served by the `@Deprecated` `OldEngineResource`. Run the equivalent pixel with `runPixel` in `engine.ts` instead.
 */
export function insight(
	params: { engineId: string; insight: string },
	options?: RequestOptions,
): Promise<unknown> {
	const { engineId, ...query } = params;
	return get(path`/api/engine/e-${engineId}/insight`, query, options);
}

/**
 * Runs a saved legacy insight (playsheet) of this database with optional
 * parameter values, in a new insight registered to the session.
 *
 * @name output
 * @endpoint POST /api/engine/e-{engineId}/output
 * @source Monolith/src/prerna/semoss/web/services/local/OldEngineResource.java#createOutput
 * @param params - Path parameter and form fields.
 * @param params.engineId - The database id or alias.
 * @param params.insight - The saved insight id.
 * @param params.params - Parameter values, as a map of parameter name to values.
 * @param options - Per-call overrides (signal, headers).
 * @returns The `RunPlaysheetReactor` output; it depends on the playsheet.
 * @remarks Unverified response shape.
 * @throws {ApiError} 400 if the caller cannot view the database.
 * @deprecated Served by the `@Deprecated` `OldEngineResource`. Use `runPixel` in `engine.ts` with `OpenInsight` instead.
 */
export function output(
	params: {
		engineId: string;
		insight: string;
		params?: Record<string, unknown[]>;
	},
	options?: RequestOptions,
): Promise<unknown> {
	const { engineId, ...body } = params;
	return post(path`/api/engine/e-${engineId}/output`, body, options);
}

/**
 * Writes form-builder data into this database. The caller must be signed in
 * with CAC or SAML; that login id is recorded as the author.
 *
 * @name commitFormData
 * @endpoint POST /api/engine/e-{engineId}/commitFormData
 * @source Monolith/src/prerna/semoss/web/services/local/OldEngineResource.java#commitFormData
 * @param params - Path parameter and form fields.
 * @param params.engineId - The database id or alias.
 * @param params.formData - The form-builder payload (engine-specific map).
 * @param options - Per-call overrides (signal, headers).
 * @returns The string `"success"`.
 * @throws {ApiError} 400 if the user has no CAC/SAML login or the commit fails (the error body is a JSON-encoded string, not `{ errorMessage }`).
 * @deprecated Served by the `@Deprecated` `OldEngineResource`. No replacement.
 */
export function commitFormData(
	params: { engineId: string; formData: Record<string, unknown> },
	options?: RequestOptions,
): Promise<"success"> {
	const { engineId, ...body } = params;
	return post(path`/api/engine/e-${engineId}/commitFormData`, body, options);
}

/**
 * Returns the form-builder audit log of this database.
 *
 * @name getAuditLogForEngine
 * @endpoint POST /api/engine/e-{engineId}/getAuditLogForEngine
 * @source Monolith/src/prerna/semoss/web/services/local/OldEngineResource.java#getAuditLogForEngine
 * @param params - Path parameter.
 * @param params.engineId - The database id or alias.
 * @param options - Per-call overrides (signal, headers).
 * @returns The audit map from `FormBuilder.getAuditDataForEngine`, double-encoded: a JSON string the caller must `JSON.parse` again.
 * @remarks Unverified response shape of the decoded map.
 * @throws {ApiError} 400 if the audit log cannot be read.
 * @deprecated Served by the `@Deprecated` `OldEngineResource`. No replacement.
 */
export function getAuditLogForEngine(
	params: { engineId: string },
	options?: RequestOptions,
): Promise<string> {
	return post(
		path`/api/engine/e-${params.engineId}/getAuditLogForEngine`,
		undefined,
		options,
	);
}
