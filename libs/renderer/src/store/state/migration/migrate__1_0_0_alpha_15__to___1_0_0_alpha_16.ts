import type { Migration, MigrationState } from "./migration.types";

const migrate__1_0_0_alpha_15__to_1_0_0_alpha_16: Migration = {
	versionFrom: "1.0.0-alpha.15",
	versionTo: "1.0.0-alpha.16",
	// This function performs a migration on the state by updating image block data
	async run(state: MigrationState): Promise<MigrationState> {
		const newState: MigrationState = { ...state };
		// Ensure that all legacy image blocks have the 'unavailable' and 'placeholderText' fields
		Object.entries(newState.blocks).forEach((keyValue) => {
			const block = keyValue[1];
			if (
				block.widget === "image" &&
				(block.data.unavailable === undefined ||
					block.data.placeholderText === undefined)
			) {
				block.data.unavailable ??= "";
				block.data.placeholderText ??= "";
			}
		});

		return newState;
	},
};

export default migrate__1_0_0_alpha_15__to_1_0_0_alpha_16;
