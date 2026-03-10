import { Env, get, post } from "@semoss/sdk/react";

export const getDatabases = async (admin: boolean) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "database/getDatabases";
	// get the response
	const response = await get<
		{
			app_global: boolean;
			app_id: string;
			app_name: string;
			app_permission: string;
			app_visibility: boolean;
		}[]
	>(url).catch((error) => {
		throw Error(error);
	});
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get Apps");
	}
	return response.data;
};

export const updateDatabaseSmssProperties = async (
	databaseId: string,
	smssProps: string,
) => {
	return await post<{
		success: boolean;
	}>(
		`${Env.MODULE}/api/e-${databaseId}/updateSmssFile`,
		{
			smss: smssProps,
			engineId: databaseId,
		},
		{},
	);
};

export const setDatabaseDiscoverable = async (
	admin: boolean,
	appId: string,
	discoverable: boolean,
) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	// change to database
	url += "app/setAppDiscoverable";
	const postData = {
		appId: appId,
		discoverable: discoverable,
	};
	const response = await post<{
		success: boolean;
	}>(url, postData, {
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
	}).catch((error) => {
		throw Error(error);
	});
	return response;
};
