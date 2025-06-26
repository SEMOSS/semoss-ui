import { Migration, MigrationState } from "./migration.types";

const migrate__1_0_0_alpha_11_to_1_0_0_alpha_12: Migration = {
    versionFrom: "1.0.0-alpha.11",
    versionTo: "1.0.0-alpha.12",
    // This function performs a migration on the state by updating button blocks
    async run(state: MigrationState): Promise<MigrationState> {
        // Retrieve the blocks from the state, expected to be an object with block ids as keys
        const blocks = state.blocks as Record<string, any>; 

        // Iterate over each block in the blocks object
        for (const key in blocks) {
            // Check if the current property is a direct property of blocks
            if (blocks.hasOwnProperty(key)) {
                const block = blocks[key]; // Get the block associated with the current key

                // Check if the block is a button widget
                if (block.widget === "button") {
                    // Set the type to "button" if it's not already defined in block's data
                    if (!block.data.type) {
                        block.data.type = "button";
                    }
                }
                blocks[key] = block;
            }
        }

        // Return the updated state
        return state;
    }
};

export default migrate__1_0_0_alpha_11_to_1_0_0_alpha_12;
