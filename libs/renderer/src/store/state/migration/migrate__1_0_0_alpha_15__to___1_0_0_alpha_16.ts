import type { Migration, MigrationState } from "./migration.types";

const migrate__1_0_0_alpha_15__to_1_0_0_alpha_16: Migration = {
	versionFrom: "1.0.0-alpha.15",
	versionTo: "1.0.0-alpha.16",
	// This function performs a migration on the state by updating button blocks
	async run(state: MigrationState): Promise<MigrationState> {
		const newState: MigrationState = { ...state };

		Object.entries(state.queries).forEach(([id, query]) => {
			query.cells.forEach((c, i) => {
				newState.queries[id].cells[i]["mcpEnabled"] = null;
				newState.queries[id].cells[i]["mcpParameters"] = null;
			});
		});

		console.log("new state", newState);
		return newState;
	},
};

export default migrate__1_0_0_alpha_15__to_1_0_0_alpha_16;
