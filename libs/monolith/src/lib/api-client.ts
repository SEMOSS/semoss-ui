/**
 * PUBLIC: configure the connection, exported from `@semoss/sdk/monolith`.
 *
 * `ApiClient` only writes the internal `ApiSettings` store; endpoint
 * functions read it through `utility/http`.
 *
 * @example
 * import { Env } from "@semoss/sdk";
 * import { ApiClient } from "@semoss/sdk/monolith";
 *
 * // basePath and auth come from Env: every Env.update sets them
 * Env.update({ MODULE: "http://localhost:8080/Monolith", ACCESS_KEY, SECRET_KEY });
 * ApiClient.configure({ headers: { "X-Example": "1" } }); // what Env doesn't cover
 */

import { ApiSettings } from "./api-settings";

/**
 * Configures the connection every endpoint function uses.
 *
 * @name ApiClient
 */
export class ApiClient {
	/**
	 * Never instantiated: there is one connection per process. Throws if
	 * called from JavaScript, where `private` is not enforced.
	 *
	 * @name constructor
	 */
	private constructor() {
		throw new Error("ApiClient is static; use ApiClient.configure()");
	}

	/**
	 * Merge connection settings (like the SDK's `Env.update`). Changing
	 * `basePath` or `auth` to a new value also clears the CSRF token and
	 * cookies, since they belong to the previous server or user; passing the
	 * same values again keeps them.
	 *
	 * @name configure
	 * @param settings - The settings to change; omitted keys keep their value.
	 * @returns Nothing.
	 */
	static configure(settings: Partial<ApiSettings>): void {
		const { basePath, auth } = ApiSettings.current;
		Object.assign(ApiSettings.current, settings);
		const next = ApiSettings.current;
		if (
			next.basePath !== basePath ||
			JSON.stringify(next.auth) !== JSON.stringify(auth)
		) {
			ApiSettings.clear();
		}
	}

	/**
	 * The current settings (a frozen copy). Never includes the CSRF token or
	 * cookies.
	 *
	 * @name settings
	 * @returns The settings.
	 */
	static get settings(): Readonly<ApiSettings> {
		return Object.freeze(
			Object.assign(new ApiSettings(), ApiSettings.current),
		);
	}

	/**
	 * Forget the CSRF token and cookies, keeping the settings (e.g. after
	 * switching users). Logging out through `@semoss/sdk/monolith/api/auth` does this.
	 *
	 * @name clear
	 * @returns Nothing.
	 */
	static clear(): void {
		ApiSettings.clear();
	}

	/**
	 * Reset the default settings and clear the session (mainly for tests).
	 *
	 * @name reset
	 * @returns Nothing.
	 */
	static reset(): void {
		ApiSettings.reset();
	}
}
