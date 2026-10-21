/**
 * Legacy form-builder permissions — `/api/form`.
 *
 * Backend: `FormResource`
 * (Monolith/src/prerna/semoss/web/form/FormResource.java), working on the
 * `FORMS_USER_ACCESS` table of the form-builder database and on
 * `AbstractFormBuilder` (Semoss/src/prerna/forms).
 *
 * Every endpoint identifies the caller by their CAC (or SAML) login id; other
 * logins get a 400 `{ errorMessage: "Could not identify user" }`. Errors
 * surface as `ApiError`.
 */

import type { RequestOptions } from "@/types";
import { post } from "@/utility/http";
import { path } from "@/utility/url";

/**
 * Grants or revokes a user's access to a form-builder instance (system).
 * `"Remove"` without an instance removes every grant of the user. Meant for
 * form-builder admins (`INSTANCE_NAME = 'ADMIN'`).
 *
 * @name modifyUserAccess
 * @endpoint POST /api/form/modifyUserAccess
 * @source Monolith/src/prerna/semoss/web/form/FormResource.java#modifyUserAccess
 * @param params - Form fields.
 * @param params.addOrRemove - `"Add"` or `"Remove"`.
 * @param params.userid - The CAC / SAML id of the user to change.
 * @param params.instanceName - The instance (system) name. Optional for `"Remove"`.
 * @param params.ownerStatus - With `"Add"`, whether the user is the system admin (`"true"` / `"false"`).
 * @param options - Per-call overrides (signal, headers).
 * @returns The string `"success"`.
 * @throws {ApiError} 400 if the caller cannot be identified, `addOrRemove` is neither value, or the write fails.
 */
export function modifyUserAccess(
	params: {
		addOrRemove: "Add" | "Remove";
		userid: string;
		instanceName?: string;
		ownerStatus?: string;
	},
	options?: RequestOptions,
): Promise<"success"> {
	return post(path`/api/form/modifyUserAccess`, params, options);
}

/**
 * Renames an instance URI in a form-builder database, optionally deleting the
 * original instance. Meant for form-builder admins.
 *
 * @name renameInstance
 * @endpoint POST /api/form/renameInstance
 * @source Monolith/src/prerna/semoss/web/form/FormResource.java#renameInstance
 * @param params - Form fields.
 * @param params.dbName - The database id or alias.
 * @param params.originalUri - The current instance URI.
 * @param params.newUri - The new instance URI.
 * @param params.deleteInstanceBoolean - Delete the original instance after renaming.
 * @param options - Per-call overrides (signal, headers).
 * @returns The string `"success"`.
 * @throws {ApiError} 400 if the caller cannot be identified.
 */
export function renameInstance(
	params: {
		dbName: string;
		originalUri: string;
		newUri: string;
		deleteInstanceBoolean?: boolean;
	},
	options?: RequestOptions,
): Promise<"success"> {
	return post(path`/api/form/renameInstance`, params, options);
}

/**
 * Certifies an instance in a form-builder database as the caller. Meant for
 * the system admin of that instance.
 *
 * @name certifyInstance
 * @endpoint POST /api/form/certifyInstance
 * @source Monolith/src/prerna/semoss/web/form/FormResource.java#certifyInstance
 * @param params - Form fields.
 * @param params.dbName - The database id or alias.
 * @param params.instanceType - The instance's type (concept).
 * @param params.instanceName - The instance (system) name.
 * @param options - Per-call overrides (signal, headers).
 * @returns The string `"success"`.
 * @throws {ApiError} 400 if the caller cannot be identified.
 */
export function certifyInstance(
	params: { dbName: string; instanceType: string; instanceName: string },
	options?: RequestOptions,
): Promise<"success"> {
	return post(path`/api/form/certifyInstance`, params, options);
}

/**
 * Lists the form-builder instances the caller has access to.
 *
 * @name getUserInstanceAuth
 * @endpoint POST /api/form/getUserInstanceAuth
 * @source Monolith/src/prerna/semoss/web/form/FormResource.java#getUserInstanceAuth
 * @param params - No parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns The caller's id and, per instance name, its `IS_SYS_ADMIN` flag as a string (`"true"` / `"false"`).
 * @throws {ApiError} 400 if the caller cannot be identified.
 */
export function getUserInstanceAuth(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<{ cac_id: string; validInstances: Record<string, string> }> {
	return post(path`/api/form/getUserInstanceAuth`, params, options);
}
