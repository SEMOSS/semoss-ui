import type { Migration, MigrationState } from "./migration.types";

const migrate__1_0_0_alpha_17__to_1_0_0_alpha_18: Migration = {
	versionFrom: "1.0.0-alpha.17",
	versionTo: "1.0.0-alpha.18",
	// This function performs a migration on the state by adding the export button to the layout
	async run(state: MigrationState): Promise<MigrationState> {
		const newState: MigrationState = { ...state };
		// We do not need to modify state queries, variables, etc.
		// We update the state, so the export button panel can be rendered in the Blocks Workspace layout
		return newState;
	},
};

export default migrate__1_0_0_alpha_17__to_1_0_0_alpha_18;
