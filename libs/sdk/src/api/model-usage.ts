import { Env } from "../env";
import { get, post } from "../lib/fetch";
import { type ModelUsageLimit, readModelUsageLimit } from "./access";

/** The base URL of the admin model usage calls */
const modelUsageUrl = (): string => `${Env.MODULE}/api/auth/admin/modelUsage`;

/**
 * Reads the `{ usageLimit }` a model usage read or set answers with
 * @param data - What the backend sent
 * @param what - What the call does, for the error
 * @returns The limit, or null for no limit defined
 * @throws When the response is not an object
 */
const readLimitResponse = (
	data: unknown,
	what: string,
): ModelUsageLimit | null => {
	if (typeof data !== "object" || data === null || Array.isArray(data)) {
		throw Error(`No Response to ${what}`);
	}
	return readModelUsageLimit((data as Record<string, unknown>).usageLimit);
};

/**
 * @param usageLimit - A limit, or null for no limit defined
 * @returns The limit as the form field the admin calls read: its JSON, or
 * empty to remove it
 */
const toLimitField = (usageLimit: ModelUsageLimit | null): string =>
	usageLimit ? JSON.stringify(usageLimit) : "";

/**
 * Read the platform default: the limit, across all models, of everyone with no
 * limit from their own grant, a team, public use or an all-models default of
 * their own. Admins only.
 * @returns The limit, or null for no limit defined
 */
export const getPlatformDefaultLimit =
	async (): Promise<ModelUsageLimit | null> => {
		const response = await get<unknown>(
			`${modelUsageUrl()}/getPlatformDefault`,
		);
		return readLimitResponse(response?.data, "read the platform default");
	};

/**
 * Set the platform default. Its rules count each person's own use across all
 * models. Admins only.
 * @param usageLimit - The limit, or null to remove it
 * @returns The limit as saved, or null for no limit defined
 * @throws When the save fails or its response is not an object
 */
export const setPlatformDefaultLimit = async (
	usageLimit: ModelUsageLimit | null,
): Promise<ModelUsageLimit | null> => {
	const response = await post<unknown>(
		`${modelUsageUrl()}/setPlatformDefault`,
		{ usageLimit: toLimitField(usageLimit) },
		{},
	);
	return readLimitResponse(response?.data, "set the platform default");
};

/**
 * Read a team's total: a ceiling on the calls billed to the team, on any
 * model. Admins only.
 * @param groupId - The team's name
 * @param type - The team's type, such as CUSTOM
 * @returns The limit, or null for no limit defined
 */
export const getTeamTotalLimit = async (
	groupId: string,
	type: string,
): Promise<ModelUsageLimit | null> => {
	const params = new URLSearchParams({ groupId, type });
	const response = await get<unknown>(
		`${modelUsageUrl()}/getTeamTotal?${params.toString()}`,
	);
	return readLimitResponse(response?.data, "read the team's total");
};

/**
 * Set a team's total. Its rules are shared by every call billed to the team.
 * Admins only.
 * @param groupId - The team's name
 * @param type - The team's type, such as CUSTOM
 * @param usageLimit - The limit, or null to remove it
 * @returns The limit as saved, or null for no limit defined
 * @throws When the save fails or its response is not an object
 */
export const setTeamTotalLimit = async (
	groupId: string,
	type: string,
	usageLimit: ModelUsageLimit | null,
): Promise<ModelUsageLimit | null> => {
	const response = await post<unknown>(
		`${modelUsageUrl()}/setTeamTotal`,
		{ groupId, type, usageLimit: toLimitField(usageLimit) },
		{},
	);
	return readLimitResponse(response?.data, "set the team's total");
};
