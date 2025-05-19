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
    };

    /**
     * Get the APP ID
     */
    static get APP() {
        return this._store.APP;
    }

    /**
     * Ready only getter
     */
    static get MODULE() {
        return this._store.MODULE;
    }

    /**
     * Ready only getter
     */
    static get ACCESS_KEY() {
        return this._store.ACCESS_KEY;
    }

    /**
     * Ready only getter
     */
    static get SECRET_KEY() {
        return this._store.SECRET_KEY;
    }

    /**
     *
     * @param updated - updated variables
     */
    static update = (updated: Partial<(typeof Env)["_store"]> = {}) => {
        if (updated.hasOwnProperty("APP")) {
            this._store.APP = updated.APP;
        }

        if (updated.hasOwnProperty("MODULE")) {
            this._store.MODULE = updated.MODULE;
        }

        if (updated.hasOwnProperty("ACCESS_KEY")) {
            this._store.ACCESS_KEY = updated.ACCESS_KEY;
        }

        if (updated.hasOwnProperty("SECRET_KEY")) {
            this._store.SECRET_KEY = updated.SECRET_KEY;
        }
    };
}
