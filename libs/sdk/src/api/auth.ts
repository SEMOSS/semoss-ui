import { Env } from "../env";
import { get, post } from "../utility";

/**
 * Allow the user to login
 *
 * @param username - username to login with
 * @param password - password to login with
 * @returns true if successful
 */
export const login = async (
	username: string,
	password: string,
): Promise<boolean> => {
	await post(`${Env.MODULE}/api/auth/login`, {
		username: username,
		password: password,
		disableRedirect: true,
	});

	return true;
};

/**
 * Allow the user to login with outh
 *
 * @param provider - provider to login with
 * @param isPopup - check if in popup
 * @returns true if successful
 */
export const oauth = async (
	provider: string,
	isPopup = false,
): Promise<{ name?: string }> => {
	// check if the user is logged in
	const response = await get<{ name?: string }>(
		`${Env.MODULE}/api/auth/userinfo/${provider}`,
	);

	//check if they are already logged in
	if (response.data && response.data.name) {
		return response.data;
	}

	// if called from the popup, throw an error as the user was unable to login
	if (isPopup) {
		throw new Error("Unable to login");
	}

	return new Promise((resolve, reject) => {
		if (!window || !window.top) {
			reject("Unable to login");
			return;
		}

		const url = `${Env.MODULE}/api/auth/login/${provider}`;
		const popUpWindow = window.top.open(
			url,
			"_blank",
			"height=600,width=400,top=300,left=" + 600,
		);

		// setup an interval to see if the popup window is closed or successful
		const interval = setInterval(async () => {
			try {
				if (
					!popUpWindow ||
					popUpWindow.closed ||
					popUpWindow.closed === undefined
				) {
					clearInterval(interval);
				} else if (
					popUpWindow.document.location.href.indexOf(
						`${window.location.host}`,
					) > -1
				) {
					clearInterval(interval);

					// close it
					popUpWindow.close();

					// try to get the info again
					const response = await oauth(provider, true);

					// close it
					resolve(response);
				}
			} catch (err) {
				// do nothing
				// this is to work around the blocked frame error that comes up
			}
		}, 1000);
	});
};

/**
 * Allow the user to logout
 *
 * @returns true if successful
 */
export const logout = async (): Promise<boolean> => {
	// try to logout
	await get(`${Env.MODULE}/api/auth/logout/all`);

	return true;
};
