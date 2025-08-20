import type { Migration, MigrationState } from "./migration.types";

const migrate__1_0_0_alpha_14__to_1_0_0_alpha_15: Migration = {
	versionFrom: "1.0.0-alpha.14",
	versionTo: "1.0.0-alpha.15",
	// This function performs a migration on the state by updating button blocks
	async run(state: MigrationState): Promise<MigrationState> {
		const newState: MigrationState = { ...state };

		Object.entries(newState.blocks).forEach((keyValue) => {
			const block = keyValue[1];
			if (block.widget === "container") {
				block.data.loading = false;
				block.data.loadType = "Skeleton";
			}
		});

		return newState;
	},
};

export default migrate__1_0_0_alpha_14__to_1_0_0_alpha_15;
