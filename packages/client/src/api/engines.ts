import { Env, get, post } from "@semoss/sdk/react";

export const getEngines = async (
	admin: boolean,
	search: string,
	engineType: string,
	offset?: number,
	limit?: number,
) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "engine/getEngines?";
	url += `engineTypes=${engineType}`;
	url += search ? `&filterWord=${search}` : "";
	url += offset ? `&offset=${offset}` : "";
	url += limit ? `&limit=${limit}` : "";
	// get the response
	const response = await get<Record<string, unknown>[]>(url).catch(
		(error) => {
			throw Error(error);
		},
	);
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get Apps");
	}
	return response.data;
};

export const setEngineGlobal = async (
	admin: boolean,
	engineId: string,
	global: boolean,
) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	// change to database
	url += "engine/setEngineGlobal";

	return await post<{
		success: boolean;
	}>(
		url,
		{
			engineId: encodeURIComponent(engineId),
			public: encodeURIComponent(global),
		},
		{},
	).catch((error) => {
		throw Error(error);
	});
};

export const setEngineVisiblity = async (
	admin: boolean,
	engineId: string,
	visible: boolean,
) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "engine/setEngineDiscoverable";
	const postData: Record<string, unknown> = {
		engineId: engineId,
		discoverable: visible,
	};

	const response = await post<{
		success: boolean;
	}>(url, processPostData(postData), {});
	return response;
};

export const setEngineFavorite = async (
	engineId: string,
	favorite: boolean,
) => {
	return await post<{
		success: boolean;
	}>(
		`${Env.MODULE}/api/auth/engine/setEngineFavorite`,
		{
			engineId: engineId,
			isFavorite: favorite,
		},
		{},
	);
};

export const approveEngineUserAccessRequest = async (
	admin: boolean,
	engineId: string,
	requests: unknown[],
) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "engine/approveEngineUserAccessRequest";
	const postData: Record<string, unknown> = {
		engineId: engineId,
		requests: requests,
	};
	const response = await post<{
		success: boolean;
	}>(url, processPostData(postData), {});
	return response;
};

export const denyEngineUserAccessRequest = async (
	admin: boolean,
	engineId: string,
	userIds: string[],
) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "engine/denyEngineUserAccessRequest";
	const postData: Record<string, unknown> = {
		engineId: engineId,
		requestIds: userIds,
	};
	const response = await post<{
		success: boolean;
	}>(url, processPostData(postData), {});
	return response;
};

export const addEnginePermission = async (
	groupId: string,
	engineId: string,
	permission: number,
	type?: string,
	endDate?: string,
) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/addGroupEnginePermission";
	let postData: Record<string, unknown> = {
		groupId: groupId,
		engineId: engineId,
		permission: permission,
	};
	if (type) {
		postData = { ...postData, type: type };
	}
	if (endDate) {
		postData = { ...postData, endDate: endDate };
	}

	const response = await post<{
		success: boolean;
	}>(url, processPostData(postData), {});
	return response;
};

export const editEnginePermission = async (
	groupId: string,
	engine: {
		engineid: string;
		permission: string;
		type?: string;
		endDate?: string;
	},
) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/editGroupEnginePermission";
	let postData: Record<string, unknown> = {
		groupId: groupId,
		engineId: engine.engineid,
		permission: engine.permission,
	};
	if (engine.type) {
		postData = { ...postData, type: engine.type };
	}
	if (engine.endDate) {
		postData = { ...postData, endDate: engine.endDate };
	}

	const response = await post<{
		success: boolean;
	}>(url, processPostData(postData), {});
	return response;
};

export const deleteEnginePermission = async (
	groupId: string,
	groupType: string,
	engine: {
		engineid: string;
		type?: string;
	},
) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/removeGroupEnginePermission";
	let postData: Record<string, unknown> = {
		groupId: groupId,
		engineId: engine.engineid,
	};
	if (groupType) {
		postData = {
			...postData,
			type: engine.type,
		};
	}

	const response = await post<{
		success: boolean;
	}>(url, processPostData(postData), {});
	return response;
};

const processPostData = (data: Record<string, unknown>) => {
	const postRecordData: Record<string, unknown> = {};
	Object.keys(data).forEach((item) => {
		postRecordData[item] = data[item];
	});
	return postRecordData;
};
