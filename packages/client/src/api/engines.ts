import { Env, get, post, runPixel } from "@semoss/sdk/react";

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

/**
 * Throw when a pixel response contains an operation error. No-op when the
 * error list is empty.
 *
 * @name assertPixelSuccess
 * @param errors - Operation errors collected from a runPixel response.
 */
const assertPixelSuccess = (errors: string[]): void => {
	if (errors.length > 0) {
		throw new Error(errors.join(""));
	}
};

/**
 * One configurable parameter of a provider built-in tool, as written in the
 * meta/builtin-tools.json catalog. Unknown keys pass through untouched.
 */
export interface BuiltinToolParam {
	alias: string;
	display_name?: string;
	type?: "required" | "optional";
	input?: "string" | "number" | "boolean" | "list" | "map";
	options?: (string | number | boolean)[];
	default?: unknown;
	show_in_ui?: boolean;
	/** The user's chosen value; the catalog `default` applies when absent. */
	value?: unknown;
	[key: string]: unknown;
}

/**
 * One provider built-in tool from the meta/builtin-tools.json catalog.
 * Unknown keys pass through untouched, which also makes a definition
 * directly storable as a {@link BuiltinToolSelection}.
 */
export interface BuiltinToolDefinition {
	alias: string;
	display_name?: string;
	description?: string;
	params?: BuiltinToolParam[];
	constraints?: { api?: string; models?: string[]; regions?: string[] };
	[key: string]: unknown;
}

/**
 * Stored selection for one provider built-in tool: the catalog definition
 * copied as-is, with a `value` on any parameter the user changed from its
 * default. Kept catalog-shaped on purpose, so whatever reads the stored
 * JSON can render the tool's options without a second catalog lookup.
 */
export interface BuiltinToolSelection {
	alias?: string;
	display_name?: string;
	description?: string;
	params?: BuiltinToolParam[];
	[key: string]: unknown;
}

/** Shape returned by the GetModelBuiltinTools pixel. */
export interface ModelBuiltinTools {
	engineId?: string;
	modelId?: string;
	modelProvider?: string;
	servingProvider?: string;
	tools?: Record<string, BuiltinToolDefinition>;
	selected?: Record<string, BuiltinToolSelection>;
}

/**
 * The provider-hosted built-in tools a model engine can use, plus the
 * selection already saved on it. Returns empty maps when the install ships no
 * catalog or the engine's providers are unknown to it — that is not an error.
 *
 * @name getModelBuiltinTools
 * @param insightId - Insight the pixel executes against.
 * @param engineId - Model engine to resolve the catalog for.
 * @return The catalog and the engine's saved selection.
 */
export const getModelBuiltinTools = async (
	insightId: string,
	engineId: string,
): Promise<ModelBuiltinTools> => {
	const response = await runPixel<[ModelBuiltinTools]>(
		`GetModelBuiltinTools(engine=[${JSON.stringify(engineId)}]);`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	return response.pixelReturn[0]?.output ?? {};
};

/**
 * What a model engine accepts as input. GetModelMetadata returns far more than
 * this; only the attachment-related fields are read, so only they are typed.
 *
 * Both fields are tri-state on purpose — a missing one means the provider
 * never reported it, not "no".
 *
 * @name getModelInputSupport
 * @param insightId - Insight the pixel executes against.
 * @param engineId - Model engine to describe.
 * @return The attachment flag and the input modalities, either possibly absent.
 */
export const getModelInputSupport = async (
	insightId: string,
	engineId: string,
): Promise<{
	/** Whether the model accepts file attachments. */
	attachment?: boolean | null;
	/** Input modalities the model accepts (TEXT, IMAGE, PDF, ...). */
	inputModalities?: string[] | null;
}> => {
	const response = await runPixel<
		[Awaited<ReturnType<typeof getModelInputSupport>>]
	>(`GetModelMetadata(engine=[${JSON.stringify(engineId)}]);`, insightId);
	assertPixelSuccess(response.errors);

	return response.pixelReturn[0]?.output ?? {};
};

const processPostData = (data: Record<string, unknown>) => {
	const postRecordData: Record<string, unknown> = {};
	Object.keys(data).forEach((item) => {
		postRecordData[item] = data[item];
	});
	return postRecordData;
};
