import {
	CSRF,
	Env,
	get,
	type ModelUsageLimit,
	post,
	readModelUsageLimit,
	runPixel,
} from "@semoss/sdk/react";
import { auditPixelLiteral } from "./audit-pixel";

export const config = async () => {
	// get the response
	const response = await get<{
		logins: {
			[key: string]: unknown;
		};
		/**
		 * List of available providers (logins) that are available
		 */
		availableProviders: {
			provider: string;
			name: string;
			isOauth: boolean;
		}[];
		[key: string]: unknown;
	}>(`${Env.MODULE}/api/config`).catch((error) => {
		throw Error(error);
	});
	// there was an error, no response
	if (!response) {
		throw Error("No Config Response");
	}
	// save the config data
	return response.data;
};

export const login = async (
	username: string,
	password: string,
): Promise<boolean> => {
	//not encoding these, because the post function has encode URI built in.
	const postData = {
		username: username,
		password: password,
		disableRedirect: true,
	};

	await post(`${Env.MODULE}/api/auth/login`, postData).catch((error) => {
		throw Error(error);
	});
	return true;
};

export const loginLDAP = async (
	username: string,
	password: string,
): Promise<boolean> => {
	// loginLDAP reads username / password, pin is only for linotp
	const postData = {
		username: username,
		password: password,
		disableRedirect: true,
	};

	// an expired password comes back as a 401 with the error message,
	// let it bubble up to the caller
	await post(`${Env.MODULE}/api/auth/loginLDAP`, postData, {}).catch(
		(error) => {
			throw new Error(
				error instanceof Error ? error.message : `${error}`,
			);
		},
	);
	return true;
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

export const registerUser = async (
	name: string,
	username: string,
	email: string,
	password: string,
	phone: string,
	phoneextension: string,
	countrycode: string,
) => {
	const create: Record<string, string> = {
		name: name,
		username: username,
		email: email,
		password: password,
		phone: phone,
		phoneextension: phoneextension,
		countrycode: countrycode,
	};
	return await post(`${Env.MODULE}/api/auth/createUser`, create).catch(
		(error) => {
			if (
				error.response &&
				error.response.status === 401 &&
				error.response.data &&
				error.response.data.requirePwdChange
			) {
				return;
			}
			// throw the message
			throw Error(error);
		},
	);
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
	const response = await post<boolean>(url, postData).catch((error) => {
		throw Error(error);
	});
	return response.data;
};

export const isAdminUser = async (): Promise<boolean> => {
	const response = await get<boolean>(
		`${Env.MODULE}/api/auth/admin/user/isAdminUser`,
	).catch((error) => {
		throw Error(error);
	});

	if (!response) {
		throw Error("No Response to isAdminUser");
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
			/** The person's default for all models, as the backend sends it */
			model_usage_limit?: unknown;
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
		// each person's default for all models, read into its one shape
		users: response.data.map((user) => ({
			...user,
			model_usage_limit: readModelUsageLimit(user.model_usage_limit),
		})),
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
		{
			name: name,
		},
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
	const response = await post<boolean>(url, { ...postData }, {}).catch(
		(e) => {
			throw Error(e);
		},
	);
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
	// the person's default for all models, sent as JSON; none means none defined
	const modelUsageLimit: ModelUsageLimit | null = readModelUsageLimit(
		user.model_usage_limit,
	);
	if (modelUsageLimit) {
		newUserInfo = {
			...newUserInfo,
			modelUsageLimit,
		};
	}
	const response = await post<boolean>(url, { ...newUserInfo }, {});
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

/** A default model kept in the user's metadata. */
export type UserDefaultModelKey =
	| "text-generation-model"
	| "code-generation-model";

/**
 * Sets or removes one of the user's default models. An empty list for the key
 * deletes its stored value, so a removed default is gone rather than blank.
 *
 * @param metaKey - Which default.
 * @param engineId - The model's engine id, or empty to remove the default.
 * @throws When the backend refuses the change.
 */
export const setUserDefaultModel = async (
	metaKey: UserDefaultModelKey,
	engineId: string,
): Promise<void> => {
	const value = engineId ? auditPixelLiteral(engineId) : "";
	const response = await runPixel(
		`SetUserMetadata(meta=[{${auditPixelLiteral(metaKey)}:[${value}]}]);`,
	);
	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}
};
