import { Migration } from "./migration.types";

/**
 * @name config
 * @description - This addresses a change in how we store our variables.
 *
 * 1. Add onMount listener to e-chart
 *  */
const config: Migration = {
    versionFrom: "1.0.0-alpha.6",
    versionTo: "1.0.0-alpha.7",
    run: (state) => {
        const newState = { ...state };

        Object.entries(newState.blocks).forEach((keyValue) => {
            const block = keyValue[1];

            if (block.widget === "e-chart") {
                block.listeners["preProcess"] = {
                    type: 'sync',
                    order: []
                };
            }
        });

        return newState;
    },
};

export default config;
