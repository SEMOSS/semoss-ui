import { makeAutoObservable } from "mobx";
import { Env, get, logout, post } from "@semoss/sdk/react";
import type { RootStore } from "@/stores";

/**
 * Store that manages instances of the insights and handles applicaiton level querying
 */

/**
 * @deprecated Will be removed in future release, use SDK instead
 */
export class MonolithStore {
	private _root: RootStore;

	constructor(root: RootStore) {
		// register the root
		this._root = root;

		// make it observable
		makeAutoObservable(this);
	}

	// *********************************************************
	// Actions
	// *********************************************************
	/**
	 * Get the config
	 */
	async config() {
		// get the response
		const response = await get<{
			logins: { [key: string]: unknown };
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
	}

	/**
	 * Run a pixel string
	 *
	 * @param insightID - insightID to execute the pixel against
	 * @param pixel - pixel to execute
	 */
	async run<O extends unknown[] | []>(insightID: string, pixel: string) {
		// build the expression
		const postData: Record<string, unknown> = {
			expression: pixel,
		};
		if (insightID) {
			postData.insightId = insightID;
		}

		const response = await post<{
			insightID: string;
			pixelReturn: {
				isMeta: boolean;
				operationType: string[];
				additionalOutput: { output: string }[];
				output: O[number];
				pixelExpression: string;
				pixelId: string;
			}[];
		}>(`${Env.MODULE}/api/engine/runPixel`, postData, {}).catch((error) => {
			throw Error(error);
		});

		// there was no response, that is an error
		if (!response) {
			throw Error("No Pixel Response");
		}

		// collect the errors
		const errors: string[] = [];
		for (const p of response.data.pixelReturn) {
			const { output, operationType } = p;

			if (operationType.indexOf("ERROR") > -1) {
				errors.push(output as string);
			}
		}

		return {
			errors: errors,
			insightId: response.data.insightID,
			pixelReturn: response.data.pixelReturn,
		};
	}

	/**
	 * Run a pixel off of the query insight
	 *
	 * @param pixel - pixel to execute
	 */
	//TODO: switch to extend unknown
	async runQuery<O extends unknown[] | []>(
		pixel: string,
		insightId?: string,
	) {
		const { configStore } = this._root;

		return this.run<O>(insightId ?? configStore.store.insightID, pixel);
	}

	/**
	 * Download a file by using a unique key
	 *
	 * @param insightID - insightID to download the file
	 * @param fileKey - id for the file to download
	 */
	async download(insightID: string, fileKey: string) {
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
	}

	/**
	 * Run a download a file off of the query insight
	 *
	 * @param fileKey - id for the file to download
	 */
	async downloadQuery(fileKey: string) {
		const { configStore } = this._root;

		return this.download(configStore.store.insightID, fileKey);
	}

	/**
	 * Allow the user to login
	 *
	 * @param username - username to login with
	 * @param password - password to login with
	 * @returns true if successful
	 */
	async login(username: string, password: string): Promise<boolean> {
		const postData = {
			username,
			password,
			disableRedirect: true,
		};

		try {
			const response = await post(
				`${Env.MODULE}/api/auth/login`,
				postData,
				{},
			);

			if (
				response &&
				response.data &&
				typeof response.data === "object" &&
				"errorMessage" in response.data
			) {
				throw new Error(
					(response.data as { errorMessage: string }).errorMessage,
				);
			}

			return true;
		} catch (error) {
			throw new Error(error.message);
		}
	}

	/**
	 * Allow the user to login with lin otp
	 *
	 * @param username - username to login with
	 * @param password - password to login with
	 * @returns true if successful
	 */
	async loginOTP(
		username: string,
		password: string,
	): Promise<"success" | "change-password"> {
		const postData = {
			username: username,
			pin: password,
			disableRedirect: true,
		};

		// track the status
		let status: "success" | "change-password" = "success";

		await post(`${Env.MODULE}/api/auth/loginLinOTP`, postData, {}).catch(
			(error) => {
				if (
					error.response &&
					error.response.status === 401 &&
					error.response.data &&
					error.response.data.requirePwdChange
				) {
					status = "change-password";
					return;
				}

				// throw the message
				throw Error(error);
			},
		);

		return status;
	}

	/**
	 * Confirm the OTP from LinOTP
	 *
	 * @param otp - otp to login with
	 * @returns true if successful
	 */
	async confirmOTP(otp: string): Promise<boolean> {
		const postData = {
			otp: otp,
			disableRedirect: true,
		};

		await post(`${Env.MODULE}/api/auth/loginLinOTP`, postData, {}).catch(
			(error) => {
				// throw the message
				throw Error(error.response.data.errorMessage);
			},
		);

		return true;
	}

	/**
	 * Allow the user to login with lin otp
	 *
	 * @param username - username to login with
	 * @param password - password to login with
	 * @returns true if successful
	 */
	async loginLDAP(
		username: string,
		password: string,
	): Promise<"success" | "change-password"> {
		const postData = {
			username: username,
			pin: password,
			disableRedirect: true,
		};

		// track the status
		let status: "success" | "change-password" = "success";

		await post(`${Env.MODULE}/api/auth/loginLDAP`, postData, {}).catch(
			(error) => {
				if (
					error.response &&
					error.response.status === 401 &&
					error.response.data &&
					error.response.data.requirePwdChange
				) {
					status = "change-password";
					return;
				}

				// throw the message
				throw Error(error);
			},
		);

		return status;
	}

	/**     *
	 * @returns true if successful
	 */
	async logout(): Promise<boolean> {
		await logout();
		return true;
	}

	/**
	 * Allow the user to login using oauth
	 *
	 * @param provider - provider to login with
	 * @returns true if successful
	 */
	async oauth(provider: string): Promise<boolean> {
		// check if the user is logged in
		const response = await get<{ name: string }>(
			`${Env.MODULE}/api/auth/userinfo/${provider}`,
		).catch((error) => {
			throw Error(error);
		});

		//check if they are already logged in
		if (response.data?.name) {
			return true;
		}

		return new Promise((resolve) => {
			const url = `${Env.MODULE}/api/auth/login/${provider}`;
			const popUpWindow = window.top.open(
				url,
				"_blank",
				`height=600,width=400,top=300,left=${600}`,
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
						const response = await this.oauth(provider);

						// close it
						resolve(response);
					}
				} catch (_err: unknown) {
					// do nothing
					// this is to work around the blocked frame error that comes up
				}
			}, 1000);
		});
	}

	/**
	 * @name getLoginProperties
	 * @returns
	 */
	async getLoginProperties() {
		const url = `${Env.MODULE}/api/auth/loginProperties`;

		const response = await get(url).catch((error) => {
			throw Error(error);
		});

		return response.data;
	}

	async modifyLoginProperties(provider, properties) {
		const url = `${Env.MODULE}/api/auth/modifyLoginProperties/${provider}`;
		const postData: Record<string, unknown> = {
			modifications: JSON.stringify(properties),
		};

		const response = await post<boolean>(url, postData, {}).catch(
			(error) => {
				throw Error(error);
			},
		);

		return response.data;
	}

	/**
	 * @name isAdminUser
	 * @description Determines whether user is admin or
	 * @returns boolean
	 */
	async isAdminUser() {
		const url = `${Env.MODULE}/api/auth/admin/user/isAdminUser`;

		const response = await get(url).catch((error) => {
			throw Error(error);
		});

		if (!response) {
			throw Error("No Response to isAdminUSer");
		}

		return response.data;
	}

	// ----------------------------------------------------------------------
	// Engine
	// ----------------------------------------------------------------------
	/**
	 * @name getEngines
	 * @param admin - is admin user
	 * @returns AppInterface[]
	 */
	async getEngines(
		admin: boolean,
		search: string,
		engineType: string,
		offset?: number,
		limit?: number,
	) {
		let url = `${Env.MODULE}/api/auth/`;

		if (admin) {
			url += "admin/";
		}

		url += "engine/getEngines";

		const params = new URLSearchParams({
			engineTypes: engineType,
			filterWord: search ? search : "",
			offset: offset ? offset.toString() : "0",
			limit: limit ? limit.toString() : "10",
		});

		// get the response
		const response = await get(`${url}?${params.toString()}`).catch(
			(error) => {
				throw Error(error);
			},
		);

		// there was no response, that is an error
		if (!response) {
			throw Error("No Response to get Apps");
		}

		return response.data;
	}

	// ----------------------------------------------------------------------
	// Database Level
	// ----------------------------------------------------------------------
	/**
	 * @name getDatabases
	 * @param admin - is admin user
	 * @returns AppInterface[]
	 */
	async getDatabases(admin: boolean) {
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
	}

	// ----------------------------------------------------------------------
	// Project Level
	// ----------------------------------------------------------------------
	// ----------------------------------------------------------------------
	// Insight Level
	// ----------------------------------------------------------------------

	async getInsights() {
		console.error("needs to be added on BE");
	}

	// Verified Project Member actions
}
