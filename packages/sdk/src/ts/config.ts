/**
 * Environment options
 */
export const ENV: {
    APP: string;
    MODULE: string;
} = {
    APP: '',
    MODULE: '',
};

/**
 *  Configure the SDK with global options
 * @param updated - config of the sdk
 */
export const configure = (updated: Partial<typeof ENV> = {}) => {
    // set the options if passed in
    if (updated.APP) {
        ENV.APP = updated.APP;
    }

    if (updated.MODULE) {
        ENV.MODULE = updated.MODULE;
    }
};
