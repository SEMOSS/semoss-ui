export type Config = {
    /** Id of the app */
    app: string;

    /** Name of the app */
    name: string;

    /** Deploy options */
    deploy: {
        /** glob pattern(s) to ignore files */
        ignore: string | string[];
    };
};
