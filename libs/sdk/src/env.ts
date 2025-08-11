/**
 * Singleton variable holding environment information
 */
export class Env {
	/**
	 * Variables that are loaded into the enviornment
	 */
	private static _store = {
		APP: "",
		MODULE: "",
		ACCESS_KEY: "",
		SECRET_KEY: "",
		CSRF: false,
	};

	/**
	 * Get the APP ID
	 */
	static get APP() {
		return Env._store.APP;
	}

	/**
	 * Ready only getter
	 */
	static get MODULE() {
		return Env._store.MODULE;
	}

	/**
	 * Ready only getter
	 */
	static get ACCESS_KEY() {
		return Env._store.ACCESS_KEY;
	}

	/**
	 * Ready only getter
	 */
	static get SECRET_KEY() {
		return Env._store.SECRET_KEY;
	}

	/**
	 * Ready only getter
	 */
	static get CSRF() {
		return Env._store.CSRF;
	}

	/**
	 *
	 * @param updated - updated variables
	 */
	static update = (updated: Partial<(typeof Env)["_store"]> = {}) => {
		if (Object.hasOwn(updated, "APP")) {
			this._store.APP = updated.APP;
		}

		if (Object.hasOwn(updated, "MODULE")) {
			this._store.MODULE = updated.MODULE;
		}

		if (Object.hasOwn(updated, "ACCESS_KEY")) {
			this._store.ACCESS_KEY = updated.ACCESS_KEY;
		}

		if (Object.hasOwn(updated, "SECRET_KEY")) {
			this._store.SECRET_KEY = updated.SECRET_KEY;
		}

		if (Object.hasOwn(updated, "CSRF")) {
			this._store.CSRF = updated.CSRF;
		}
	};
}
