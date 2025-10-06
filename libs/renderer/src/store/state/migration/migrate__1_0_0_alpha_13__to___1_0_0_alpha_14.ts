import type { Migration, MigrationState } from "./migration.types";

const migrate__1_0_0_alpha_13__to_1_0_0_alpha_14: Migration = {
	versionFrom: "1.0.0-alpha.13",
	versionTo: "1.0.0-alpha.14",
	// This function performs a migration on the state by updating button blocks
	async run(state: MigrationState): Promise<MigrationState> {
		const newState: MigrationState = { ...state };

		Object.entries(newState.blocks).forEach((keyValue) => {
			const block = keyValue[1];
			if (block.widget === "container") {
				block.data.loading = false;
				block.data.loadType = "Skeleton";
			}

			if (block.widget === "text") {
				block.data.loading = false;
				block.data.loadType = "Skeleton";
			}

			if (block.widget === "markdown") {
				block.data.loading = false;
				block.data.loadType = "Skeleton";
			}
		});

		return newState;
	},
};

export default migrate__1_0_0_alpha_13__to_1_0_0_alpha_14;
