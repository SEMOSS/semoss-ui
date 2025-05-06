import { Migration } from "./migration.types";

/**
 * @name config
 * @description - 
 *
 * 1. Go to all blocks and tie async to all events
 *  */
const config: Migration = {
    versionFrom: "1.0.0-alpha.5",
    versionTo: "1.0.0-alpha.6",
    run: (state) => {
        const newState = { ...state };

        Object.values(newState.blocks).forEach((b) => {
            Object.keys(b.listeners).forEach((l) => {
                const val = {
                    type: "sync",
                    order: newState.blocks[b.id]['listeners'][l]
                }

                newState.blocks[b.id]['listeners'][l] = val
            })
        })

        return newState;
    },
};

export default config;
