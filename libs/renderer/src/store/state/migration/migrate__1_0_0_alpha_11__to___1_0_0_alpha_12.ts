import type { Migration, MigrationState } from "./migration.types";

const migrate__1_0_0_alpha_11_to_1_0_0_alpha_12: Migration = {
	versionFrom: "1.0.0-alpha.11",
	versionTo: "1.0.0-alpha.12",
	// This function performs a migration on the state by updating button blocks
	async run(state: MigrationState): Promise<MigrationState> {
		const newState: MigrationState = { ...state };
		const blocks = state.blocks as Record<string, any>;
		// Clone blocks to avoid mutating the original state
		const newBlocks: Record<string, any> = {};

		for (const [key, block] of Object.entries(blocks)) {
			// Clone the block to avoid mutation
			const newBlock = { ...block, data: { ...block.data } };
			if (newBlock.widget === "button" && !newBlock.data.type) {
				newBlock.data.type = "button";
			}
			newBlocks[key] = newBlock;
		}

		// Destructured state into newState and updated the blocks
		newState.blocks = newBlocks;
		return newState;
	},
};

export default migrate__1_0_0_alpha_11_to_1_0_0_alpha_12;
