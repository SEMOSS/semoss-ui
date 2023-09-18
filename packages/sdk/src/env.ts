export class Env {
    /**
     * Variables that are loaded into the enviornment
     */
    private static _variables = {
        APP: '',
        MODULE: '',
        ACCESS_KEY: '',
        SECRET_KEY: '',
    };

    /**
     * Readonly getter of the variables
     */
    static get variables() {
        return this._variables;
    }

    /**
     *
     * @param updated - updated variables
     */
    static updateVariables = (
        updated: Partial<typeof Env['variables']> = {},
    ) => {
        // update the env
        if (updated.APP) {
            this._variables.APP = updated.APP;
        }

        if (updated.MODULE) {
            this._variables.MODULE = updated.MODULE;
        }

        if (updated.ACCESS_KEY) {
            this._variables.ACCESS_KEY = updated.ACCESS_KEY;
        }

        if (updated.SECRET_KEY) {
            this._variables.SECRET_KEY = updated.SECRET_KEY;
        }
    };
}
