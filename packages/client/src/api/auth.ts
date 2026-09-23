import { CSRF, Env, get, post } from "@semoss/sdk/react";

export const fileDownload = async (insightID: string, fileKey: string) => {
	return new Promise<void>((resolve) => {
		// create the download url
		const url = `${
			Env.MODULE
		}/api/engine/downloadFile?insightId=${insightID}&fileKey=${encodeURIComponent(
			fileKey,
		)}`;
		// fake clicking a link
		const link: HTMLAnchorElement = document.createElement("a");
		link.href = url;
		link.target = "_blank";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		// resolve the promise
		resolve();
	});
};

export const setupResetPassword = async (
	email: string,
	type: "NATIVE" | "LDAP" | "LINOTP",
	subject: string,
	url?: string,
): Promise<{ success: boolean; message?: string }> => {
	await ensureCsrfToken();

	const postData: Record<string, string> = {
		email: email,
		type: type,
		subject: subject,
	};

	if (url) {
		postData.url = url;
	}

	const response = await post<{ success: boolean; message?: string }>(
		`${Env.MODULE}/api/auth/user/setupResetPassword`,
		postData,
	).catch((error) => {
		const errorMessage =
			error?.response?.data?.errorMessage ||
			error?.response?.data?.ERROR_MESSAGE ||
			error?.response?.data?.message ||
			error?.message ||
			"Failed to request a password reset.";

		throw Error(errorMessage);
	});

	if (!response) {
		throw Error("No response while requesting password reset.");
	}

	return response.data;
};

const ensureCsrfToken = async () => {
	// CSRF is disabled by configuration, no token needed.
	if (!CSRF.isEnabled && !Env.CSRF) {
		return;
	}

	// Token already cached.
	if (CSRF.token) {
		return;
	}

	const response = await fetch(`${Env.MODULE}/api/config/fetchCsrf`, {
		headers: {
			"X-CSRF-Token": "fetch",
		},
	});

	CSRF.token =
		response.headers.get("X-CSRF-Token") ||
		response.headers.get("x-csrf-token") ||
		"";

	if (!CSRF.token) {
		throw Error(
			"Unable to initialize security token for password reset. Please refresh and try again.",
		);
	}
};

export const getLoginProperties = async () => {
	const url = `${Env.MODULE}/api/auth/loginProperties`;
	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	return response.data;
};

export const modifyLoginProperties = async (provider, properties) => {
	const url = `${Env.MODULE}/api/auth/modifyLoginProperties/${provider}`;
	const postData = {
		modifications: JSON.stringify(properties),
	};
	const response = await post<boolean>(url, postData, {
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
	}).catch((error) => {
		throw Error(error);
	});
	return response.data;
};

export const getInsights = async () => {
	console.error("needs to be added on BE");
};

export const getInsightUsers = async (
	admin: boolean,
	id: string,
	user: string,
	_permission: string,
	offset?: number,
	limit?: number,
	projectid?: string,
) => {
	// /api/auth/insight/getInsightUsers?
	// insightId=feb4c485-0aa8-4ff6-b355-e894dc74589a&projectId=2e2534db-fffa-4054-b9e9-dbf44183ab3b
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += `insight/getInsightUsers$insightId=${id}&projectId=${projectid}&userId=${user}&limit=${limit}&offset=${offset}`;
	if (!projectid) {
		throw Error("no project id");
	}
	// get the response
	const response = await get<
		{
			id: string;
			name: string;
			permission: string;
		}[]
	>(url).catch((error) => {
		throw Error(error);
	});
	if (!response) {
		throw Error("Unsuccessful attempt at retrieving Insight Users");
	}
	return response.data;
};

export const getInsightUsersNoCredentials = async (
	admin: boolean,
	insightId: string,
	projectId: string,
) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += `insight/getInsightUsersNoCredentials&projectId=${projectId}&insightId=${insightId}`;
	// get the response
	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get non credentialed users");
	}
	return response.data;
};

export const addInsightUserPermissions = async (
	admin: boolean,
	id: string,
	users: unknown[],
	projectId: string,
) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "insight/addInsightUserPermissions";

	const postData = {
		projectId: projectId,
		insightId: id,
		userpermissions: users,
	};

	const response = await post<{
		success: boolean;
	}>(url, postData, {});
	return response;
};

export const editInsightUserPermissions = async (
	admin: boolean,
	id: string,
	users: unknown[],
	projectId: string,
) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "insight/editInsightUserPermissions";

	const postData = {
		projectId: projectId,
		insightId: id,
		userpermissions: users,
	};

	const response = await post<{
		success: boolean;
	}>(url, postData, {});
	return response;
};

export const removeInsightUserPermissions = async (
	admin: boolean,
	id: string,
	userIds: string[],
	projectId: string,
) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "insight/removeInsightUserPermissions";

	const postData = {
		projectId: projectId,
		insightId: id,
		ids: userIds,
	};

	const response = await post<{
		success: boolean;
	}>(url, postData, {});
	return response;
};

export const editProjectUserPermission = async (
	admin: boolean,
	projectId: string,
	id: string,
	permission: string,
) => {
	let url = `${Env.MODULE}/api/auth/`;
	const postData = {
		projectId: projectId,
		id: id,
		permission: permission,
	};

	if (admin) {
		url += "admin/";
	}
	url += "project/editProjectUserPermission";

	const response = await post<{
		success: boolean;
	}>(url, postData, {
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
	});
	return response;
};

export const editAppUserPermission = async (
	admin: boolean,
	appId: string,
	id: string,
	permission: string,
) => {
	let url = `${Env.MODULE}/api/auth/`;
	const postData = {
		appId: appId,
		id: id,
		permission: permission,
	};
	if (admin) {
		url += "admin/";
	}
	url += "app/editAppUserPermission";

	const response = await post<{
		success: boolean;
	}>(url, postData, {
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
	});
	return response;
};

export const uploadFile = async (
	files: File[],
	insightId: string | null,
	projectId?: string | null,
	path?: string | null,
	type?: string | null,
) => {
	let param = "";
	if (insightId || projectId || path) {
		if (insightId) {
			if (param.length > 0) {
				param += "&";
			}
			param += `insightId=${insightId}`;
		}
		if (projectId) {
			if (param.length > 0) {
				param += "&";
			}
			if (type === "engine") {
				param += `engineId=${projectId}`;
			} else {
				param += `projectId=${projectId}`;
			}
		}
		if (path) {
			if (param.length > 0) {
				param += "&";
			}
			param += `path=${path}`;
		}
		param = `?${param}`;
	}
	const url = `${Env.MODULE}/api/uploadFile/baseUpload${param}`,
		fd: FormData = new FormData();
	if (Array.isArray(files)) {
		for (let i = 0; i < files.length; i++) {
			fd.append("file", files[i]);
		}
	} else {
		// pasted data
		fd.append("file", files);
	}
	const response = await post<
		{
			fileName: string;
			fileLocation: string;
		}[]
	>(url, fd, {});
	return response.data;
};

export const getApps = async (databaseId: string) => {
	const url = `${Env.MODULE}/api/auth/admin/app/getApps?databaseId=${databaseId}`;
	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	return response.data;
};

export const getDBUsers = async (admin: boolean, appId: string) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) url += "admin/";
	url += `app/getAppUsers?appId=${appId}`;
	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get non credentialed users");
	}
	return response;
};

export const removeAppUserPermissions = async (
	admin: boolean,
	appId: string,
	id: string,
) => {
	let url = `${Env.MODULE}/api/auth/`;
	const postData = {
		appId: appId,
		id: id,
	};
	if (admin) {
		url += "admin/";
	}
	url += "app/removeAppUserPermission";

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

export const getAllUsers = async (
	admin: boolean,
	searchTerm?: string,
	offset?: number,
	limit?: number,
) => {
	let getAllUsersURL = `${Env.MODULE}/api/auth/`;
	let getNumUsersURL = `${Env.MODULE}/api/auth/`;
	if (admin) {
		getAllUsersURL += "admin/";
		getNumUsersURL += "admin/";
	} else {
		return;
	}
	getAllUsersURL += `user/getAllUsers?filterWord=${searchTerm}&offset=${offset}&limit=${limit}`;
	// get the response
	const response = await get<
		{
			id: string;
			type: string;
			name?: string;
			admin?: boolean;
			publisher?: boolean;
			exporter?: boolean;
			email?: string;
			phone?: string;
			phoneextension?: string;
			countrycode?: string;
			username?: string;
			model_usage_restriction?: string;
			model_usage_frequency?: string;
			model_max_tokens?: number;
			model_max_response_time?: number;
		}[]
	>(getAllUsersURL).catch((error) => {
		throw Error(error);
	});
	const buildCountUrl = (filterWord?: string) => {
		let url = `${getNumUsersURL}user/getNumUsers`;
		if (filterWord !== undefined) {
			url += `?filterWord=${encodeURIComponent(filterWord)}`;
		}
		return url;
	};
	const trimmedSearch = searchTerm?.trim() ?? "";
	let totalUsers: number | undefined;
	let filteredUsers = 0;

	if (trimmedSearch.length === 0) {
		const totalCountResponse = await get<number>(buildCountUrl("")).catch(
			(error) => {
				throw Error(error);
			},
		);
		if (!totalCountResponse) {
			throw Error("No Response to get Members");
		}
		totalUsers = Number(totalCountResponse.data ?? 0);
		filteredUsers = totalUsers;
	} else {
		const filteredCountResponse = await get<number>(
			buildCountUrl(trimmedSearch),
		).catch((error) => {
			throw Error(error);
		});
		if (!filteredCountResponse) {
			throw Error("No Response to get Members");
		}
		filteredUsers = Number(filteredCountResponse.data ?? 0);
	}
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get Members");
	}
	const finalResponse = {
		users: response.data,
		totalUsers,
		filteredUsers,
	};
	return finalResponse;
};

export const getAllAPIUsers = async (
	admin: boolean,
	searchTerm?: string,
	offset?: number,
	limit?: number,
) => {
	let getAllAPIUsersURL = `${Env.MODULE}/api/auth/`;
	let getNumAPIUsersURL = `${Env.MODULE}/api/auth/`;
	if (admin) {
		getAllAPIUsersURL += "admin/";
		getNumAPIUsersURL += "admin/";
	} else {
		return;
	}

	const encodedSearch = encodeURIComponent(searchTerm || "");
	getAllAPIUsersURL += `user/getAllAPIUsers?filterWord=${encodedSearch}&offset=${offset}&limit=${limit}`;

	const response = await get<
		{
			id: string;
			type: string;
			name?: string;
			email?: string;
			username?: string;
		}[]
	>(getAllAPIUsersURL).catch((error) => {
		throw Error(error);
	});

	const buildCountUrl = (filterWord?: string) => {
		let url = `${getNumAPIUsersURL}user/getNumAPIUsers`;
		if (filterWord !== undefined) {
			url += `?filterWord=${encodeURIComponent(filterWord)}`;
		}
		return url;
	};

	const totalCountResponse = await get<number>(buildCountUrl("")).catch(
		(error) => {
			throw Error(error);
		},
	);
	if (!totalCountResponse) {
		throw Error("No Response to get Service Accounts");
	}

	const totalUsers = Number(totalCountResponse.data ?? 0);
	const trimmedSearch = searchTerm?.trim() ?? "";
	let filteredUsers = totalUsers;

	if (trimmedSearch.length > 0) {
		const filteredCountResponse = await get<number>(
			buildCountUrl(trimmedSearch),
		).catch((error) => {
			throw Error(error);
		});
		if (!filteredCountResponse) {
			throw Error("No Response to get Service Accounts");
		}
		filteredUsers = Number(filteredCountResponse.data ?? 0);
	}

	if (!response) {
		throw Error("No Response to get Service Accounts");
	}

	return {
		users: response.data,
		totalUsers,
		filteredUsers,
	};
};

export const createAPIUser = async (name: string) => {
	const url = `${Env.MODULE}/api/auth/createAPIUser`;

	const response = await post<Record<string, string>>(
		url,
		processPostData({
			name: name,
		}),
		{},
	).catch((error) => {
		throw Error(error);
	});

	return response.data;
};

export const deleteMember = async (
	admin: boolean,
	userId: string,
	userType: string,
) => {
	let url = `${Env.MODULE}/api/auth/`;
	const postData = {
		userId: userId,
		type: userType,
	};
	if (admin) {
		url += "admin/";
	}
	url += "user/deleteUser";

	const response = await post<boolean>(url, postData, {});
	return response;
};

export const setUserLocked = async (
	admin: boolean,
	userId: string,
	type: string,
	isLocked: boolean,
) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "user/setUserLocked";

	const response = await post<{ success: boolean }>(
		url,
		{ userId, type, isLocked },
		{},
	).catch((e) => {
		throw Error(e);
	});
	return response;
};

export const editMemberInfo = async (admin: boolean, user: unknown) => {
	let url = `${Env.MODULE}/api/auth/`;
	const postData = {
		user: JSON.stringify(user),
	};
	if (admin) {
		url += "admin/";
	}
	url += "user/editUser";
	const response = await post<boolean>(
		url,
		processPostData(postData),
		{},
	).catch((e) => {
		throw Error(e);
	});
	return response;
};

export const createUser = async (
	admin: boolean,
	user: Record<string, unknown>,
) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "user/registerUser";
	let newUserInfo: Record<string, unknown> = {};
	if (user.id) {
		newUserInfo = {
			...newUserInfo,
			userId: user.id,
		};
	}
	if (user.type) {
		newUserInfo = {
			...newUserInfo,
			type: user.type,
		};
	}
	if (user.type === "NATIVE") {
		newUserInfo = {
			...newUserInfo,
			username: user.id,
		};
	} else if (user.username) {
		newUserInfo = {
			...newUserInfo,
			username: user.username,
		};
	}
	if (user.password) {
		newUserInfo = {
			...newUserInfo,
			password: user.password,
		};
	}
	if (user.admin) {
		newUserInfo = {
			...newUserInfo,
			admin: user.admin,
		};
	}
	if (user.publisher) {
		newUserInfo = {
			...newUserInfo,
			publisher: user.publisher,
		};
	}
	if (user.exporter) {
		newUserInfo = {
			...newUserInfo,
			exporter: user.exporter,
		};
	}
	if (user.name) {
		newUserInfo = {
			...newUserInfo,
			name: user.name,
		};
	}
	if (user.email) {
		newUserInfo = {
			...newUserInfo,
			type: user.type,
		};
		newUserInfo.email = user.email;
	}
	if (user.phone) {
		newUserInfo = {
			...newUserInfo,
			phone: user.phone,
		};
	}

	if (user.phoneextension) {
		newUserInfo = {
			...newUserInfo,
			phoneextension: user.phoneextension,
		};
	}
	if (user.model_usage_restriction) {
		if (user.model_usage_restriction === "null") {
			user.model_usage_restriction = null;
		}
		newUserInfo = {
			...newUserInfo,
			modelUsageRestriction: user.model_usage_restriction,
		};
	}
	if (user.model_usage_frequency) {
		newUserInfo = {
			...newUserInfo,
			modelUsageFrequency: user.model_usage_frequency,
		};
	}
	if (user.model_max_tokens) {
		newUserInfo = {
			...newUserInfo,
			modelMaxTokens: user.model_max_tokens,
		};
	}
	if (user.model_max_response_time) {
		newUserInfo = {
			...newUserInfo,
			modelMaxResponseTime: user.model_max_response_time,
		};
	}
	const response = await post<boolean>(url, processPostData(newUserInfo), {});
	return response;
};

export const getUserAccessKeys = async () => {
	const url = `${Env.MODULE}/api/auth/user/getUserAccessKeys`;
	const response = await get<
		{
			ACCESSKEY: string;
			DATECREATED: string;
			TOKENNAME: string;
			LASTUSED?: string;
			TOKENDESCRIPTION?: string;
		}[]
	>(url).catch((error) => {
		throw Error(error);
	});
	return response.data;
};

export const createUserAccessKey = async (
	tokenName: string,
	tokenDescription = "",
) => {
	const url = `${Env.MODULE}/api/auth/user/createUserAccessKey`;
	let body: Record<string, unknown> = {
		tokenName: tokenName,
	};
	if (tokenDescription) {
		body = {
			...body,
			tokenDescription: tokenDescription,
		};
	}
	const response = await post<{
		ACCESSKEY: string;
		SECRETKEY: string;
		DATECREATED: string;
		LASTUSED: string;
		TOKENNAME: string;
		TOKENDESCRIPTION?: string;
	}>(url, body, {}).catch((error) => {
		throw Error(error);
	});
	return response.data;
};

export const deleteUserAccessKeys = async (accessKey: string) => {
	const url = `${Env.MODULE}/api/auth/user/deleteUserAccessKey`;
	const body = {
		accessKey: accessKey,
	};
	const response = await post<boolean>(url, body, {}).catch((error) => {
		throw Error(error);
	});
	return response.data;
};

const processPostData = (data: unknown) => {
	const postRecordData: Record<string, unknown> = {};
	Object.keys(data).forEach((item) => {
		postRecordData[item] = data[item];
	});
	return postRecordData;
};
