/**
 * Singleton variable holding environment information
 */
export class Env {
    /**
     * Variables that are loaded into the enviornment
     */
    private static _store = {
        MODULE: '',
        ACCESS_KEY: '',
        SECRET_KEY: '',
    };

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
    static update = (updated: Partial<typeof Env['_store']> = {}) => {
        if (updated.MODULE) {
            this._store.MODULE = updated.MODULE;
        }

        if (updated.ACCESS_KEY) {
            this._store.ACCESS_KEY = updated.ACCESS_KEY;
        }

        if (updated.SECRET_KEY) {
            this._store.SECRET_KEY = updated.SECRET_KEY;
        }
    };
}
