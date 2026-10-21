/**
 * PUBLIC: configure the connection, re-exported from `@semoss/monolith`.
 *
 * `ApiClient` only writes the internal `ApiSettings` store; endpoint
 * functions read it through `@/utility/http`.
 *
 * @example
 * import { ApiClient } from "@semoss/monolith";
 *
 * ApiClient.configure({ basePath: "/Monolith" }); // browser
 * ApiClient.configure({ // Node
 *     basePath: "http://localhost:8080/Monolith",
 *     auth: { type: "basic", accessKey, secretKey },
 * });
 */

import { ApiSettings } from "@/lib/api-settings";

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
	 * `basePath` or `auth` also clears the CSRF token and cookies, since they
	 * belong to the previous server or user.
	 *
	 * @name configure
	 * @param settings - The settings to change; omitted keys keep their value.
	 * @returns Nothing.
	 */
	static configure(settings: Partial<ApiSettings>): void {
		if ("basePath" in settings || "auth" in settings) {
			ApiSettings.clear();
		}
		Object.assign(ApiSettings.current, settings);
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
	 * switching users). Logging out through `@semoss/monolith/api/auth` does this.
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
