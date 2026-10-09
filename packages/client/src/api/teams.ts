import type { Role } from "@semoss/sdk";
import { Env, get, post } from "@semoss/sdk/react";
import { isRecord } from "@semoss/utility/object";
import { decodeHtmlEntities, readNonBlankString } from "@semoss/utility/text";
import {
	addEnginePermission,
	deleteEnginePermission,
	editEnginePermission,
} from "./engines";
import {
	addProject,
	deleteProjectPermission,
	editProjectPermisison,
} from "./projects";

export const getTeams = async (
	admin: boolean,
	searchTerm?: string,
	limit?: number,
	offset?: number,
) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "group/getGroups";
	const params = new URLSearchParams();
	if (searchTerm) params.set("searchTerm", searchTerm);
	if (limit !== undefined) params.set("limit", String(limit));
	if (offset !== undefined) params.set("offset", String(offset));
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}
	// get the response
	const response = await get(url);
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get teams");
	}
	return response.data;
};

export const getGroupDetails = async (
	admin: boolean,
	groupId: string,
	type?: string,
) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "group/getGroupDetails";
	const params = new URLSearchParams();
	if (groupId) params.set("groupId", groupId);
	if (type) params.set("type", type);
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}
	const response = await get(url);
	if (!response) {
		throw Error("No Response to get group details");
	}
	return response.data;
};

export const getTeamsCount = async (admin: boolean, searchTerm?: string) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "group/getNumGroups";
	const params = new URLSearchParams();
	if (searchTerm) params.set("searchTerm", searchTerm);
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}
	const response = await get(url);
	if (!response) {
		throw Error("No Response to get team count");
	}
	return parseCount(response.data);
};

const parseCount = (value: unknown) => {
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : 0;
	}
	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	if (value && typeof value === "object") {
		const candidate =
			(value as { count?: unknown }).count ??
			(value as { numGroups?: unknown }).numGroups ??
			(value as { numMembers?: unknown }).numMembers ??
			(value as { numProjects?: unknown }).numProjects ??
			(value as { numEngines?: unknown }).numEngines ??
			(value as { total?: unknown }).total ??
			(value as { value?: unknown }).value ??
			(value as { data?: unknown }).data;
		const parsed = Number(candidate);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
};

export const getNumProjectsForGroup = async (
	groupId: string,
	groupType: string,
	searchTerm?: string,
	admin = true,
) => {
	let url = `${Env.MODULE}/api/auth/${admin ? "admin/" : ""}`;
	url += "group/getNumProjectsForGroup";
	const params = new URLSearchParams();
	if (groupId) params.set("groupId", groupId);
	if (groupType) params.set("groupType", groupType);
	if (searchTerm) params.set("searchTerm", searchTerm);
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}
	const response = await get(url);
	if (!response) {
		throw Error("No Response to get project count");
	}
	return parseCount(response.data);
};

export const getNumEnginesForGroup = async (
	groupId: string,
	groupType: string,
	searchTerm?: string,
	admin = true,
) => {
	let url = `${Env.MODULE}/api/auth/${admin ? "admin/" : ""}`;
	url += "group/getNumEnginesForGroup";
	const params = new URLSearchParams();
	if (groupId) params.set("groupId", groupId);
	if (groupType) params.set("groupType", groupType);
	if (searchTerm) params.set("searchTerm", searchTerm);
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}
	const response = await get(url);
	if (!response) {
		throw Error("No Response to get engine count");
	}
	return parseCount(response.data);
};

export const addTeam = async (
	groupId: string,
	description: string,
	isCustomGroup: boolean,
	type?: string,
) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/addGroup";

	let postData: Record<string, unknown> = {
		groupId: groupId,
		description: description,
		isCustomGroup: isCustomGroup,
	};

	if (type) {
		postData = {
			...postData,
			type: type,
		};
	}
	await postTeamChange(url, postData, "The team was not created");
};

/**
 * Rename a team or change its description. Admins only.
 * @param groupId - The team's new name
 * @param description - The team's new description
 * @param previousTeamName - The team's current name
 * @param previousType - The team's type, which does not change
 */
export const editTeam = async (
	groupId: string,
	description: string,
	previousTeamName: string,
	previousType: string,
) =>
	postTeamChange(
		`${Env.MODULE}/api/auth/admin/group/editGroupDetails`,
		{
			groupId: previousTeamName,
			type: previousType,
			newGroupId: groupId,
			newDescription: description,
		},
		"The team was not saved",
	);

export const deleteTeam = async (groupid: string, type?: string) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/deleteGroup";

	let postData: Record<string, unknown> = {
		groupId: groupid,
	};
	if (type) {
		postData = {
			...postData,
			type: type,
		};
	}
	await postTeamChange(url, postData, "The team was not deleted");
};

export const getTeamUsers = async (
	groupId: string,
	limit: number,
	offset: number,
	searchTerm: string,
	admin = true,
) => {
	let url = `${Env.MODULE}/api/auth/${admin ? "admin/" : ""}`;
	url += "group/getGroupMembers";
	const params = new URLSearchParams();
	if (groupId) params.set("groupId", groupId);
	if (limit) params.set("limit", String(limit));
	if (offset) params.set("offset", String(offset));
	if (searchTerm) params.set("searchTerm", searchTerm);
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}
	const response = await get(url);
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get group members");
	}
	return response.data;
};

export const getTeamUsersCount = async (
	groupId: string,
	searchTerm?: string,
	admin = true,
) => {
	let url = `${Env.MODULE}/api/auth/${admin ? "admin/" : ""}`;
	url += "group/getNumMembersInGroup";
	const params = new URLSearchParams();
	if (groupId) params.set("groupId", groupId);
	if (searchTerm) params.set("searchTerm", searchTerm);
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}
	const response = await get(url);
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get group member count");
	}
	return parseCount(response.data);
};

/**
 * Get people who are not members of a custom group
 * @param groupId - The group
 * @param limit - Page size
 * @param offset - Number of people already loaded
 * @param searchTerm - Text to search for
 * @param msGraphLookup - Optional choice of where to search: `true` for the
 * Microsoft directory, `false` for existing users. Without it the backend
 * searches the directory whenever the directory is available.
 * @param admin - Whether to use the admin endpoint; a team's managers use the
 * non-admin one
 */
export const getNonTeamUsers = async (
	groupId: string,
	limit: number,
	offset: number,
	searchTerm: string,
	msGraphLookup?: boolean,
	admin = true,
) => {
	let url = `${Env.MODULE}/api/auth/${admin ? "admin/" : ""}`;
	url += "group/getNonGroupMembers";
	const params = new URLSearchParams();
	if (groupId) params.set("groupId", groupId);
	if (limit) params.set("limit", String(limit));
	if (offset) params.set("offset", String(offset));
	if (searchTerm) params.set("searchTerm", searchTerm);
	if (msGraphLookup !== undefined) {
		params.set("msGraphLookup", String(msGraphLookup));
	}
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}

	const response = await get(url);
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get non group members");
	}
	return response.data;
};

/**
 * Add a person to a custom group. A person picked from the Microsoft directory
 * who has no account yet is given one, with the details the directory holds.
 * @param groupId - The group
 * @param type - The person's login type
 * @param userId - The person's user id
 * @param admin - Whether to use the admin endpoint
 * @param endDate - Optional date their membership ends
 */
export const addTeamUser = async (
	groupId: string,
	type: string,
	userId: string,
	admin: boolean,
	endDate?: string,
) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "group/addGroupMember";
	let postData: Record<string, unknown> = {
		groupId: groupId,
		type: type,
		userId: userId,
	};
	if (endDate) {
		postData = {
			...postData,
			endDate: endDate,
		};
	}
	await postTeamChange(url, postData, "The member was not added");
};

export const deleteTeamUser = async (
	user: {
		groupid: string;
		type: string;
		userid: string;
	},
	admin = true,
) => {
	let url = `${Env.MODULE}/api/auth/${admin ? "admin/" : ""}`;
	url += "group/deleteGroupMember";
	const postData = {
		groupId: user.groupid,
		type: user.type,
		userId: user.userid,
	};
	await postTeamChange(url, postData, "The member was not removed");
};

const getTeamProjects = async (
	groupId: string,
	groupType: string,
	limit: number,
	offset: number,
	searchTerm: string,
	onlyApps: boolean,
	type?: string,
	admin = true,
) => {
	let url = `${Env.MODULE}/api/auth/${admin ? "admin/" : ""}`;
	url += "group/getProjectsForGroup";
	const params = new URLSearchParams();
	if (groupId) params.set("groupId", groupId);
	if (groupType) params.set("groupType", groupType);
	if (limit) params.set("limit", String(limit));
	if (offset) params.set("offset", String(offset));
	if (searchTerm) params.set("searchTerm", searchTerm);
	if (onlyApps) params.set("onlyApps", String(onlyApps));
	if (type) params.set("type", type);
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}

	const response = await get(url);
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get group members");
	}
	return response.data;
};

const getUnassignedTeamProjects = async (
	groupId: string,
	groupType: string,
	limit: number,
	offset: number,
	searchTerm: string,
) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/getAvailableProjectsForGroup";
	const params = new URLSearchParams();
	if (groupId) params.set("groupId", groupId);
	if (groupType) params.set("groupType", groupType);
	if (limit) params.set("limit", String(limit));
	if (offset) params.set("offset", String(offset));
	if (searchTerm) params.set("searchTerm", searchTerm);
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}
	const response = await get(url);
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get group members");
	}
	return response.data;
};

const getTeamEngines = async (
	groupId: string,
	groupType: string,
	limit: number,
	offset: number,
	searchTerm: string,
	admin = true,
) => {
	let url = `${Env.MODULE}/api/auth/${admin ? "admin/" : ""}`;
	url += "group/getEnginesForGroup";
	const params = new URLSearchParams();
	if (groupId) params.set("groupId", groupId);
	if (groupType) params.set("groupType", groupType);
	if (limit) params.set("limit", String(limit));
	if (offset) params.set("offset", String(offset));
	if (searchTerm) params.set("searchTerm", searchTerm);
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}

	const response = await get(url);
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get group members");
	}
	return response.data;
};

const getUnassignedTeamEngines = async (
	groupId: string,
	groupType: string,
	limit: number,
	offset: number,
	searchTerm: string,
) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/getAvailableEnginesForGroup";
	const params = new URLSearchParams();
	if (groupId) params.set("groupId", groupId);
	if (groupType) params.set("groupType", groupType);
	if (limit) params.set("limit", String(limit));
	if (offset) params.set("offset", String(offset));
	if (searchTerm) params.set("searchTerm", searchTerm);
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}
	const response = await get(url);
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get group members");
	}
	return response.data;
};
// Get teams by engineId
export const getGroupsWithAccessToEngine = async (
	engineId: string,
	limit?: number,
	offset?: number,
) => {
	const params = new URLSearchParams({ engineId });
	if (typeof limit === "number") params.set("limit", String(limit));
	if (typeof offset === "number") params.set("offset", String(offset));
	const url = `${Env.MODULE}/api/auth/group/engine/getGroupsWithAccessToEngine?${params.toString()}`;
	const response = await get(url);
	if (!response) {
		throw Error("No Response to get teams by engineId");
	}
	return response.data;
};

// Get teams by projectId (for apps)
export const getGroupsWithAccessToProject = async (
	projectId: string,
	limit?: number,
	offset?: number,
) => {
	const params = new URLSearchParams({ projectId });
	if (typeof limit === "number") params.set("limit", String(limit));
	if (typeof offset === "number") params.set("offset", String(offset));
	const url = `${Env.MODULE}/api/auth/group/project/getGroupsWithAccessToProject?${params.toString()}`;
	const response = await get(url);
	if (!response) {
		throw Error("No Response to get teams by projectId");
	}
	return response.data;
};

/** A person who manages the members of a custom team */
export interface GroupManager {
	/** The manager's user id */
	userid: string;
	/** The manager's login type */
	type: string;
	/** When they became a manager */
	dateadded?: string | null;
	/** Display name */
	name?: string | null;
	/** Login name */
	username?: string | null;
	/** Email address */
	email?: string | null;
}

/** A project or engine whose owner is about to give a team access to it */
export interface GroupAccessTarget {
	/** Project or engine */
	resource: GroupAccessResource;
	/** Its id */
	resourceId: string;
}

/**
 * Get the managers of a custom team
 * @param groupId - The team
 * @param admin - Whether to use the admin endpoint; the team's managers use the
 * other one
 * @param target - The project or engine the signed in user owns and is giving
 * the team access to, so they can see who manages it first
 * @returns The managers. Entries without a user id are left out.
 */
export const getGroupManagers = async (
	groupId: string,
	admin: boolean,
	target?: GroupAccessTarget,
): Promise<GroupManager[]> => {
	const params = new URLSearchParams({ groupId });
	if (target) {
		params.set(
			target.resource === "PROJECT" ? "projectId" : "engineId",
			target.resourceId,
		);
	}
	const url = `${Env.MODULE}/api/auth/${admin ? "admin/" : ""}group/getGroupManagers?${params.toString()}`;
	const response = await get<unknown>(url);
	if (!response || !Array.isArray(response.data)) {
		throw Error("No Response to get team managers");
	}
	return response.data.filter(
		(manager): manager is GroupManager =>
			isRecord(manager) && typeof manager.userid === "string",
	);
};

/**
 * Make someone a manager of a custom team. Admins and the team's managers only.
 * A person picked from the Microsoft directory who has no account yet is given
 * one, with the details the directory holds.
 * @param groupId - The team
 * @param type - The person's login type
 * @param userId - The person's user id
 * @param admin - Whether to use the admin endpoint; a team's managers use the other
 */
export const addGroupManager = async (
	groupId: string,
	type: string,
	userId: string,
	admin: boolean,
) =>
	postTeamChange(
		`${Env.MODULE}/api/auth/${admin ? "admin/" : ""}group/addGroupManager`,
		{ groupId, type, userId },
		"The manager was not added",
	);

/**
 * Stop someone managing a custom team. Admins and the team's managers only.
 * @param groupId - The team
 * @param type - The manager's login type
 * @param userId - The manager's user id
 * @param admin - Whether to use the admin endpoint; a team's managers use the other
 */
export const removeGroupManager = async (
	groupId: string,
	type: string,
	userId: string,
	admin: boolean,
) =>
	postTeamChange(
		`${Env.MODULE}/api/auth/${admin ? "admin/" : ""}group/removeGroupManager`,
		{ groupId, type, userId },
		"The manager was not removed",
	);

/** The kinds of resource a team can be given access to by its owners */
export type GroupAccessResource = "PROJECT" | "ENGINE";

/** A team, as the owner of a resource picks it */
export interface AvailableGroup {
	/** Team name */
	id: string;
	/** CUSTOM for teams whose members are managed here, otherwise the login provider */
	type: string;
	/** Description */
	description?: string | null;
}

/** The team a resource's access row is for */
export interface GroupKey {
	/** Team name */
	id: string;
	/** Team type */
	type: string;
}

/** The base URL of the owner endpoints for a kind of resource */
const groupAccessUrl = (resource: GroupAccessResource): string =>
	`${Env.MODULE}/api/auth/group/${resource === "PROJECT" ? "project" : "engine"}`;

/**
 * Get the teams that do not have access to a project or engine yet. Owners and
 * admins only.
 * @param resource - Project or engine
 * @param resourceId - Its id
 * @param searchTerm - Text matched against the team name
 * @param limit - Page size
 * @param offset - Teams already loaded
 * @returns The teams, with descriptions as {@link readTeamDescription} reads
 * them. Entries without a name or type are left out.
 */
export const getAvailableGroupsForResource = async (
	resource: GroupAccessResource,
	resourceId: string,
	searchTerm: string,
	limit: number,
	offset: number,
): Promise<AvailableGroup[]> => {
	const params = new URLSearchParams({
		[resource === "PROJECT" ? "projectId" : "engineId"]: resourceId,
		limit: String(limit),
		offset: String(offset),
	});
	if (searchTerm) params.set("searchTerm", searchTerm);
	const endpoint =
		resource === "PROJECT"
			? "getAvailableGroupsForProject"
			: "getAvailableGroupsForEngine";
	const response = await get<unknown>(
		`${groupAccessUrl(resource)}/${endpoint}?${params.toString()}`,
	);
	if (!response || !Array.isArray(response.data)) {
		throw Error("No Response to get available teams");
	}
	return response.data.flatMap((group): AvailableGroup[] =>
		isRecord(group) &&
		typeof group.id === "string" &&
		typeof group.type === "string"
			? [
					{
						id: group.id,
						type: group.type,
						description: readTeamDescription(group.description),
					},
				]
			: [],
	);
};

/**
 * Give a team access to a project or engine. Owners and admins only.
 * @param resource - Project or engine
 * @param resourceId - Its id
 * @param group - The team
 * @param permission - The access everyone in the team gets
 */
export const addGroupResourceAccess = async (
	resource: GroupAccessResource,
	resourceId: string,
	group: GroupKey,
	permission: Role,
) =>
	post<{ success: boolean }>(
		`${groupAccessUrl(resource)}/${resource === "PROJECT" ? "addGroupProjectPermission" : "addGroupEnginePermission"}`,
		{
			groupId: group.id,
			type: group.type,
			[resource === "PROJECT" ? "projectId" : "engineId"]: resourceId,
			permission,
		},
		{},
	);

/**
 * Change the access a team has to a project or engine. Owners and admins only.
 * @param resource - Project or engine
 * @param resourceId - Its id
 * @param group - The team
 * @param permission - The new access
 */
export const editGroupResourceAccess = async (
	resource: GroupAccessResource,
	resourceId: string,
	group: GroupKey,
	permission: Role,
) =>
	// the engine endpoints keep their original app names
	post<{ success: boolean }>(
		`${groupAccessUrl(resource)}/${resource === "PROJECT" ? "editGroupProjectPermission" : "editGroupAppPermission"}`,
		{
			groupId: group.id,
			type: group.type,
			[resource === "PROJECT" ? "projectId" : "appId"]: resourceId,
			permission,
		},
		{},
	);

/**
 * Take a team's access to a project or engine away. Owners and admins only.
 * @param resource - Project or engine
 * @param resourceId - Its id
 * @param group - The team
 */
export const removeGroupResourceAccess = async (
	resource: GroupAccessResource,
	resourceId: string,
	group: GroupKey,
) =>
	post<{ success: boolean }>(
		`${groupAccessUrl(resource)}/${resource === "PROJECT" ? "removeGroupProjectPermission" : "removeGroupAppPermission"}`,
		{
			groupId: group.id,
			type: group.type,
			[resource === "PROJECT" ? "projectId" : "appId"]: resourceId,
		},
		{},
	);

/** A team, as the team lists show it */
export interface TeamSummary {
	/** Team name, which is also its id */
	id: string;
	/** CUSTOM, or the login provider whose groups it mirrors */
	type: string;
	/** Description */
	description: string | null;
	/** When it was created */
	dateAdded: string | null;
	/** When the signed in user became its manager; only the managed team list has it */
	managerSince: string | null;
	/** How many members it has; only custom teams have a count */
	memberCount: number | null;
}

/** Reads a string that is not blank, or null */
const readText = (value: unknown): string | null =>
	readNonBlankString(value) ?? null;

/**
 * Removes the quotes some team descriptions were saved wrapped in. Only a
 * matching pair around the whole text is removed, so quotes inside the text,
 * such as in `"Fast" lane` or `the Smiths'`, are kept.
 * @param text - the description
 * @returns the description without wrapping quotes
 */
export const unquoteDescription = (text: string): string => {
	let unquoted = text;
	while (
		unquoted.length >= 2 &&
		(unquoted[0] === '"' || unquoted[0] === "'") &&
		unquoted[unquoted.length - 1] === unquoted[0]
	) {
		unquoted = unquoted.slice(1, -1);
	}
	return unquoted;
};

/**
 * Reads a team description as the backend stores it: HTML encoded, sometimes
 * wrapped in quotes
 * @param value - the stored description
 * @returns the plain text, or null when there is none
 */
export const readTeamDescription = (value: unknown): string | null =>
	readText(unquoteDescription(decodeHtmlEntities(readText(value) ?? "")));

/**
 * Sends a change to a team and throws unless the backend reports it was made
 * @param url - the endpoint
 * @param body - the form fields
 * @param failure - the error message when the backend does not report success
 */
const postTeamChange = async (
	url: string,
	body: Record<string, unknown>,
	failure: string,
): Promise<void> => {
	const response = await post<unknown>(url, body, {});
	if (response.data !== true) {
		throw Error(failure);
	}
};

/**
 * Reads a team list response. Rows without a name or type are left out.
 * @param data - the response from getTeams
 * @returns the teams
 */
export const toTeamSummaries = (data: unknown): TeamSummary[] =>
	Array.isArray(data)
		? data.flatMap((row) => {
				if (!isRecord(row)) {
					return [];
				}
				const id = readText(row.id);
				const type = readText(row.type);
				return id && type
					? [
							{
								id,
								type,
								description: readTeamDescription(
									row.description,
								),
								dateAdded: readText(row.dateadded),
								managerSince: readText(row.manager_since),
								memberCount:
									typeof row.member_count === "number"
										? row.member_count
										: null,
							},
						]
					: [];
			})
		: [];

/** A project or engine a team has access to, or could be given access to */
export interface TeamResource {
	/** Project or engine id */
	id: string;
	/** Display name */
	name: string;
	/** Project type or engine type */
	resourceType: string | null;
	/** Engine subtype, for the engine's icon */
	subtype: string | null;
	/** The team's permission number (1 Author, 2 Editor, 3 Read-Only), when it has access */
	permission: number | null;
	/** When the project or engine was created */
	dateCreated: string | null;
}

/** Reads the project or engine rows the team endpoints return */
const toTeamResources = (
	kind: GroupAccessResource,
	data: unknown,
): TeamResource[] => {
	if (!Array.isArray(data)) {
		return [];
	}
	const prefix = kind === "PROJECT" ? "project" : "engine";
	return data.flatMap((row) => {
		if (!isRecord(row)) {
			return [];
		}
		const id =
			readText(row[`${prefix}_id`]) ?? readText(row[`${prefix}id`]);
		if (!id) {
			return [];
		}
		const permission =
			row.permission === null || row.permission === undefined
				? Number.NaN
				: Number(row.permission);
		return [
			{
				id,
				name: readText(row[`${prefix}_name`]) ?? id,
				resourceType: readText(row[`${prefix}_type`]),
				subtype:
					kind === "ENGINE" ? readText(row.engine_subtype) : null,
				permission: Number.isFinite(permission) ? permission : null,
				dateCreated: readText(row[`${prefix}_date_created`]),
			},
		];
	});
};

/**
 * Get the projects or engines a team has access to. Admins, and the managers
 * of a custom team, who see them read only.
 * @param kind - Projects or engines
 * @param group - The team
 * @param searchTerm - Text matched against the name or id
 * @param limit - Page size
 * @param offset - Rows to skip
 * @param admin - Whether to use the admin endpoint; a team's managers use the other
 */
export const getTeamResources = async (
	kind: GroupAccessResource,
	group: GroupKey,
	searchTerm: string,
	limit: number,
	offset: number,
	admin = true,
): Promise<TeamResource[]> =>
	toTeamResources(
		kind,
		kind === "PROJECT"
			? await getTeamProjects(
					group.id,
					group.type,
					limit,
					offset,
					searchTerm,
					false,
					undefined,
					admin,
				)
			: await getTeamEngines(
					group.id,
					group.type,
					limit,
					offset,
					searchTerm,
					admin,
				),
	);

/**
 * Count the projects or engines a team has access to. Admins, and the managers
 * of a custom team.
 * @param kind - Projects or engines
 * @param group - The team
 * @param searchTerm - Text matched against the name or id
 * @param admin - Whether to use the admin endpoint; a team's managers use the other
 */
export const getTeamResourceCount = async (
	kind: GroupAccessResource,
	group: GroupKey,
	searchTerm: string,
	admin = true,
): Promise<number> =>
	kind === "PROJECT"
		? getNumProjectsForGroup(
				group.id,
				group.type,
				searchTerm || undefined,
				admin,
			)
		: getNumEnginesForGroup(
				group.id,
				group.type,
				searchTerm || undefined,
				admin,
			);

/**
 * Get the projects or engines a team does not have access to yet. Admins only.
 * @param kind - Projects or engines
 * @param group - The team
 * @param searchTerm - Text matched against the name or id
 * @param limit - Page size
 * @param offset - Rows to skip
 */
export const getAvailableTeamResources = async (
	kind: GroupAccessResource,
	group: GroupKey,
	searchTerm: string,
	limit: number,
	offset: number,
): Promise<TeamResource[]> =>
	toTeamResources(
		kind,
		kind === "PROJECT"
			? await getUnassignedTeamProjects(
					group.id,
					group.type,
					limit,
					offset,
					searchTerm,
				)
			: await getUnassignedTeamEngines(
					group.id,
					group.type,
					limit,
					offset,
					searchTerm,
				),
	);

/**
 * Give a team access to a project or engine. Admins only.
 * @param kind - Project or engine
 * @param group - The team
 * @param resourceId - The project or engine id
 * @param permission - 1 Author, 2 Editor, 3 Read-Only
 */
export const addTeamResourceAccess = async (
	kind: GroupAccessResource,
	group: GroupKey,
	resourceId: string,
	permission: number,
) =>
	kind === "PROJECT"
		? addProject(group.id, resourceId, permission, group.type)
		: addEnginePermission(group.id, resourceId, permission, group.type);

/**
 * Change a team's access to a project or engine. Admins only.
 * @param kind - Project or engine
 * @param group - The team
 * @param resourceId - The project or engine id
 * @param permission - 1 Author, 2 Editor, 3 Read-Only
 */
export const editTeamResourceAccess = async (
	kind: GroupAccessResource,
	group: GroupKey,
	resourceId: string,
	permission: number,
) =>
	kind === "PROJECT"
		? editProjectPermisison(group.id, group.type, {
				projectid: resourceId,
				permission,
				project_type: group.type,
			})
		: editEnginePermission(group.id, {
				engineid: resourceId,
				permission: String(permission),
				type: group.type,
			});

/**
 * Take a team's access to a project or engine away. Admins only.
 * @param kind - Project or engine
 * @param group - The team
 * @param resourceId - The project or engine id
 */
export const removeTeamResourceAccess = async (
	kind: GroupAccessResource,
	group: GroupKey,
	resourceId: string,
) =>
	kind === "PROJECT"
		? deleteProjectPermission(group.id, group.type, {
				projectid: resourceId,
				group_type: group.type,
			})
		: deleteEnginePermission(group.id, group.type, {
				engineid: resourceId,
				type: group.type,
			});

/** A member of a custom team */
export interface TeamMember {
	/** The member's user id */
	userId: string;
	/** The member's login type */
	type: string;
	/** Display name */
	name: string | null;
	/** Email address */
	email: string | null;
	/** Login name */
	username: string | null;
	/** When they joined the team */
	dateAdded: string | null;
}

/**
 * Reads a team member list response. Rows without a user id or type are left
 * out.
 * @param data - the response from getTeamUsers
 * @returns the members
 */
export const toTeamMembers = (data: unknown): TeamMember[] =>
	Array.isArray(data)
		? data.flatMap((row) => {
				if (!isRecord(row)) {
					return [];
				}
				const userId = readText(row.userid) ?? readText(row.id);
				const type = readText(row.type);
				return userId && type
					? [
							{
								userId,
								type,
								name: readText(row.name),
								email: readText(row.email),
								username: readText(row.username),
								dateAdded: readText(row.dateadded),
							},
						]
					: [];
			})
		: [];
