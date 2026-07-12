import { Env, post } from "@semoss/sdk/react";
import {
	addProjectUserPermissions,
	editProjectUserPermissions,
	removeProjectUserPermissions,
} from "@semoss/shared/api";
import type { Role } from "@/types";
import {
	addInsightUserPermissions,
	editInsightUserPermissions,
	removeInsightUserPermissions,
} from "./auth";
import {
	addEngineUserPermissions,
	editEngineUserPermissions,
	removeEngineUserPermissions,
} from "./engines";

/**
 * User-centric access APIs.
 *
 * The rest of the app is resource-centric (given an engine/project, list its
 * users). These wrappers are the inverse — given a user, list the resources
 * they can access — mirroring the endpoints the legacy AngularJS BI app uses
 * against the same SEMOSS backend:
 *   - project/getAllUserProjects        (body: userId)
 *   - engine/getAllUserEngines          (body: userId)
 *   - insight/getAllProjectInsightUsers (body: projectId, userId)
 *
 * Backend field names vary (legacy returned app_, project_ and insight_
 * prefixed keys), so responses are normalized here into a single shape. If the
 * live backend returns different keys, adjust the `pick(...)` lists below only.
 */

export interface UserResourceAccess {
	/** Resource id (project / engine) */
	id: string;
	/** Display name */
	name: string;
	/** Engine type (DATABASE, MODEL, ...) when applicable */
	type?: string;
	/** Engine subtype (e.g. specific vendor) — drives the engine icon */
	subtype?: string;
	/** The selected user's permission on this resource */
	permission: Role;
}

export interface UserInsightAccess extends UserResourceAccess {
	/** Owning project id */
	projectId: string;
}

const str = (value: unknown): string =>
	value === null || value === undefined ? "" : String(value);

/** Return the first defined value among the candidate keys. */
const pick = (row: Record<string, unknown>, keys: string[]): unknown => {
	for (const key of keys) {
		if (row[key] !== undefined && row[key] !== null) {
			return row[key];
		}
	}
	return undefined;
};

const authBase = (admin: boolean): string =>
	`${Env.MODULE}/api/auth/${admin ? "admin/" : ""}`;

/**
 * List the projects (apps) a given user can access, with their permission.
 */
export const getAllUserProjects = async (
	admin: boolean,
	userId: string,
): Promise<UserResourceAccess[]> => {
	const response = await post<Record<string, unknown>[]>(
		`${authBase(admin)}project/getAllUserProjects`,
		{ userId },
		{},
	).catch((error) => {
		throw Error(error);
	});

	if (!response) {
		throw Error("No Response to get user projects");
	}

	return (response.data ?? []).map((row) => ({
		id: str(pick(row, ["project_id", "id"])),
		name: str(pick(row, ["project_name", "name"])),
		permission: str(
			pick(row, ["project_permission", "permission"]),
		) as Role,
	}));
};

/**
 * List the engines (databases, models, vectors, ...) a given user can access,
 * with their permission and engine type.
 */
export const getAllUserEngines = async (
	admin: boolean,
	userId: string,
): Promise<UserResourceAccess[]> => {
	const response = await post<Record<string, unknown>[]>(
		`${authBase(admin)}engine/getAllUserEngines`,
		{ userId },
		{},
	).catch((error) => {
		throw Error(error);
	});

	if (!response) {
		throw Error("No Response to get user engines");
	}

	return (response.data ?? []).map((row) => ({
		id: str(pick(row, ["engine_id", "app_id", "id"])),
		name: str(pick(row, ["engine_name", "app_name", "name"])),
		type: str(pick(row, ["engine_type", "app_type", "type"])) || undefined,
		subtype: str(pick(row, ["engine_subtype", "app_subtype"])) || undefined,
		permission: str(
			pick(row, ["engine_permission", "app_permission", "permission"]),
		) as Role,
	}));
};

/**
 * List the engines a given user does NOT have access to (inverse of
 * getAllUserEngines). Used by admins to grant new engine access — the backend
 * excludes engines the user already has, so no client-side diff is needed.
 */
export const getUserEnginesNoCredentials = async (
	admin: boolean,
	userId: string,
	engineType?: string,
	searchTerm?: string,
): Promise<{ id: string; name: string; type?: string; subtype?: string }[]> => {
	const body: Record<string, unknown> = { userId };
	if (engineType) {
		body.engineTypes = [engineType];
	}
	if (searchTerm) {
		body.searchTerm = searchTerm;
	}
	const response = await post<Record<string, unknown>[]>(
		`${authBase(admin)}engine/getUserEnginesNoCredentials`,
		body,
		{},
	).catch((error) => {
		throw Error(error);
	});

	if (!response) {
		throw Error("No Response to get engines without user credentials");
	}

	return (response.data ?? []).map((row) => ({
		id: str(pick(row, ["engine_id", "app_id", "id"])),
		name: str(pick(row, ["engine_name", "app_name", "name"])),
		type: str(pick(row, ["engine_type", "app_type", "type"])) || undefined,
		subtype: str(pick(row, ["engine_subtype", "app_subtype"])) || undefined,
	}));
};

/**
 * List the projects (apps) a given user does NOT have access to (inverse of
 * getAllUserProjects). Used by admins to grant new app access — the backend
 * excludes projects the user already has, so no client-side diff is needed.
 */
export const getUserProjectsNoCredentials = async (
	admin: boolean,
	userId: string,
	searchTerm?: string,
): Promise<{ id: string; name: string }[]> => {
	const body: Record<string, string> = { userId };
	if (searchTerm) {
		body.searchTerm = searchTerm;
	}
	const response = await post<Record<string, unknown>[]>(
		`${authBase(admin)}project/getUserProjectsNoCredentials`,
		body,
		{},
	).catch((error) => {
		throw Error(error);
	});

	if (!response) {
		throw Error("No Response to get projects without user credentials");
	}

	return (response.data ?? []).map((row) => ({
		id: str(pick(row, ["project_id", "id"])),
		name: str(pick(row, ["project_name", "name"])),
	}));
};

/**
 * List the insights within a project along with a given user's permission.
 */
export const getAllProjectInsightUsers = async (
	admin: boolean,
	projectId: string,
	userId: string,
): Promise<UserInsightAccess[]> => {
	const response = await post<Record<string, unknown>[]>(
		`${authBase(admin)}insight/getAllProjectInsightUsers`,
		{ projectId, userId },
		{},
	).catch((error) => {
		throw Error(error);
	});

	if (!response) {
		throw Error("No Response to get user insights");
	}

	return (response.data ?? []).map((row) => ({
		projectId: str(pick(row, ["project_id"])) || projectId,
		id: str(pick(row, ["insight_id", "id"])),
		name: str(pick(row, ["insight_name", "name"])),
		permission: str(
			pick(row, ["insight_permission", "permission"]),
		) as Role,
	}));
};

/** The kinds of resource a user's access can be managed for. */
export type AccessKind = "APP" | "ENGINE" | "INSIGHT";

/** The permission subset the project permission APIs accept. */
type ProjectRole = "OWNER" | "EDIT" | "READ_ONLY";

interface AccessMutationArgs {
	/** Project id / engine id / insight id depending on kind */
	resourceId: string;
	/** The user being granted/edited/revoked */
	userId: string;
	/** Owning project id — required for INSIGHT */
	projectId?: string;
}

/** Normalize the varied mutation return shapes into a single boolean. */
const succeeded = (result: unknown): boolean => {
	if (typeof result === "boolean") {
		return result;
	}
	const data = (result as { data?: { success?: boolean } })?.data;
	return Boolean(data?.success);
};

/**
 * Grant a user access to a resource.
 *
 * Wraps the resource-centric mutation APIs so callers don't have to remember
 * the differing argument orders (project = admin last; engine/insight = admin
 * first) or payload shapes.
 */
export const grantUserAccess = async (
	kind: AccessKind,
	admin: boolean,
	{ resourceId, userId, projectId }: AccessMutationArgs,
	permission: Role,
): Promise<boolean> => {
	const users = [{ userid: userId, permission }];
	switch (kind) {
		case "APP":
			return succeeded(
				await addProjectUserPermissions(
					resourceId,
					[{ userid: userId, permission: permission as ProjectRole }],
					admin,
				),
			);
		case "ENGINE":
			return succeeded(
				await addEngineUserPermissions(admin, resourceId, users),
			);
		case "INSIGHT":
			return succeeded(
				await addInsightUserPermissions(
					admin,
					resourceId,
					users,
					projectId ?? "",
				),
			);
	}
};

/** Change a user's permission level on a resource they already have access to. */
export const editUserAccess = async (
	kind: AccessKind,
	admin: boolean,
	{ resourceId, userId, projectId }: AccessMutationArgs,
	permission: Role,
): Promise<boolean> => {
	const users = [{ userid: userId, permission }];
	switch (kind) {
		case "APP":
			return succeeded(
				await editProjectUserPermissions(
					resourceId,
					[{ userid: userId, permission: permission as ProjectRole }],
					admin,
				),
			);
		case "ENGINE":
			return succeeded(
				await editEngineUserPermissions(admin, resourceId, users),
			);
		case "INSIGHT":
			return succeeded(
				await editInsightUserPermissions(
					admin,
					resourceId,
					users,
					projectId ?? "",
				),
			);
	}
};

/** Revoke a user's access to a resource. */
export const revokeUserAccess = async (
	kind: AccessKind,
	admin: boolean,
	{ resourceId, userId, projectId }: AccessMutationArgs,
): Promise<boolean> => {
	switch (kind) {
		case "APP":
			return succeeded(
				await removeProjectUserPermissions(resourceId, [userId], admin),
			);
		case "ENGINE":
			return succeeded(
				await removeEngineUserPermissions(admin, resourceId, [userId]),
			);
		case "INSIGHT":
			return succeeded(
				await removeInsightUserPermissions(
					admin,
					resourceId,
					[userId],
					projectId ?? "",
				),
			);
	}
};
