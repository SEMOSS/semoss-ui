import { Env, get, post } from "@semoss/sdk/react";
import type { ThemeMap } from "@semoss/shared";

/**
 * Post process the ThemeMap string from the API and turn into an object
 * @param themeMapString
 * @returns
 */
const processThemeMap = (
	themeMapString: string,
): ThemeMap | Record<string, never> => {
	try {
		return JSON.parse(themeMapString) as ThemeMap;
	} catch (e) {
		console.warn("Failed to parse ThemeMap", e);
	}

	return {};
};

/**
 * Get the active admin theme
 */
export const getActiveAdminTheme = async () => {
	const response = await get<{
		ID: string;
		IS_ACTIVE: boolean;
		THEME_MAP: string;
		THEME_NAME: string;
	}>(`${Env.MODULE}/api/themes/getActiveAdminTheme`);

	return {
		ID: response.data.ID,
		IS_ACTIVE: response.data.IS_ACTIVE,
		THEME_NAME: response.data.THEME_NAME,
		THEME_MAP: processThemeMap(response.data.THEME_MAP),
	};
};

/**
 * Get all admin themes with pagination
 */
export const getAdminThemes = async (offset: number, limit: number) => {
	const response = await get<
		{
			ID: string;
			IS_ACTIVE: boolean;
			THEME_MAP: string;
			THEME_NAME: string;
		}[]
	>(
		`${Env.MODULE}/api/themes/getAdminThemes?limit=${limit}&offset=${offset}`,
	);

	return response.data.map((theme) => ({
		ID: theme.ID,
		IS_ACTIVE: theme.IS_ACTIVE,
		THEME_NAME: theme.THEME_NAME,
		THEME_MAP: processThemeMap(theme.THEME_MAP),
	}));
};

/**
 * Create a new admin theme
 */
export const createAdminTheme = async (
	name: string,
	theme: ThemeMap,
	isActive: boolean,
) => {
	const response = await post(`${Env.MODULE}/api/themes/createAdminTheme`, {
		name: name,
		json: JSON.stringify(theme),
		isActive: isActive,
	});

	return response.data;
};

/**
 * Edit an existing admin theme
 */
export const editAdminTheme = async (
	id: string,
	name: string,
	theme: ThemeMap,
	isActive: boolean,
) => {
	const response = await post(`${Env.MODULE}/api/themes/editAdminTheme`, {
		id: id,
		name: name,
		json: JSON.stringify(theme),
		isActive: isActive,
	});

	return response.data;
};

/**
 * Delete an admin theme
 */
export const deleteAdminTheme = async (id: string) => {
	const response = await post(`${Env.MODULE}/api/themes/deleteAdminTheme`, {
		id: id,
	});

	return response.data;
};

/**
 * Set an admin theme as active
 */
export const setActiveAdminTheme = async (id: string) => {
	const response = await post(
		`${Env.MODULE}/api/themes/setActiveAdminTheme`,
		{
			id: id,
		},
	);

	return response.data;
};

/**
 * Set all admin themes to inactive
 */
export const setAllAdminThemesInactive = async () => {
	const response = await post(
		`${Env.MODULE}/api/themes/setAllAdminThemesInactive`,
		{},
	);

	return response.data;
};
