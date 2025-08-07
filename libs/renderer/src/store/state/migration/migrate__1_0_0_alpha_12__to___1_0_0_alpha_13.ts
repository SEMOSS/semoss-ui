import type { ListenerActions } from "../state.types";
import type { Migration, MigrationState } from "./migration.types";

/**
 * Migration from version 1.0.0-alpha.12 to 1.0.0-alpha.13
 * This migration adds the onOpen listener to select blocks if it does not exist.
 */

const migrate__1_0_0_alpha_12_to_1_0_0_alpha_13: Migration = {
	versionFrom: "1.0.0-alpha.12",
	versionTo: "1.0.0-alpha.13",
	async run(state: MigrationState): Promise<MigrationState> {
		const newState: MigrationState = { ...state };
		const blocks = state.blocks as Record<string, any>;
		const newBlocks: Record<string, any> = {};
		for (const [key, block] of Object.entries(blocks)) {
			const newBlock = {
				...block,
				listeners: {
					...(block.listeners || {}),
				},
			};
			// Apply only for select blocks
			if (newBlock.widget === "select" && !newBlock.listeners.onOpen) {
				newBlock.listeners.onOpen = {
					type: "sync",
					order: [] as ListenerActions[],
				};
			}
			newBlocks[key] = newBlock;
		}
		newState.blocks = newBlocks;
		return newState;
	},
};
export default migrate__1_0_0_alpha_12_to_1_0_0_alpha_13;
