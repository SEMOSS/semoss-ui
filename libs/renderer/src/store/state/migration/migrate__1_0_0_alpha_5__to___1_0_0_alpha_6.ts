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

        for (const block of Object.values(newState.blocks)) {
            for (const listener of Object.keys(block.listeners)) {
                const val = {
                    type: "sync",
                    order: newState.blocks[block.id].listeners[listener],
                };
                newState.blocks[block.id].listeners[listener] = val;
            }
        }

        // Object.values(newState.blocks).forEach((b) => {
        //     Object.keys(b.listeners).forEach((l) => {
        //         const val = {
        //             type: "sync",
        //             order: newState.blocks[b.id]['listeners'][l]
        //         }

        //         newState.blocks[b.id]['listeners'][l] = val
        //     })
        // })

        return newState;
    },
};

export default config;
