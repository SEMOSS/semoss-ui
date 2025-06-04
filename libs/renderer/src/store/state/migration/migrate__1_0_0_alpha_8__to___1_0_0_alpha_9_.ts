import { Migration } from "./migration.types";

/**
 * @name config
 * @description - Add counter to queries for id generation
 *
 *  
 * */
const config: Migration = {
    versionFrom: "1.0.0-alpha.8",
    versionTo: "1.0.0-alpha.9",
    run: (state) => {
        const newState = { ...state };

        Object.entries(newState.queries).forEach((keyValue) => {
            if(!newState.queries[keyValue[0]]['counter']) {
                newState.queries[keyValue[0]]['counter'] = 1  
            }
        });

        return newState;
    },
};

export default config;
