import { Env, get, post } from "@semoss/sdk";

export const apiGet = async (
	path: string,
	// params?: Record<string, unknown>,
) => {
	const response = await get(`${Env.MODULE}${path}`).catch((error) => {
		throw Error(error);
	});
	return response.data;
};

export const apiPost = async (path: string, data?: Record<string, unknown>) => {
	const response = await post(`${Env.MODULE}${path}`, data).catch((error) => {
		throw Error(error);
	});
	return response.data;
};
