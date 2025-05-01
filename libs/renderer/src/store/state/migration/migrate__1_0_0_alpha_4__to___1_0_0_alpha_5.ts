import { Migration } from "./migration.types";

/**
 * @name config
 * @description - This addresses a change in how we store our variables.
 *
 * 1. Go through blocks and add the onMount listeners to all blocks that received a new listener
 * Accordion
 *  */
const config: Migration = {
    versionFrom: "1.0.0-alpha.4",
    versionTo: "1.0.0-alpha.5",
    run: (state) => {
        const newState = { ...state };

        Object.entries(newState.blocks).forEach((keyValue) => {
            const block = keyValue[1];

            if (block.widget === "accordion") {
                block.listeners['onMount'] = []
            }
        });

        return newState;
    },
};

export default config;