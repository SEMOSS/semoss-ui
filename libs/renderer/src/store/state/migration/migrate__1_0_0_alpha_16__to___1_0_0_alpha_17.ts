import type { Migration, MigrationState } from "./migration.types";

const migrate__1_0_0_alpha_16__to_1_0_0_alpha_17: Migration = {
	versionFrom: "1.0.0-alpha.16",
	versionTo: "1.0.0-alpha.17",
	// This function performs a migration on the state by updating image block data
	async run(state: MigrationState): Promise<MigrationState> {
		const newState: MigrationState = { ...state };
		console.log(
			"Migrating state from 1.0.0-alpha.16 to 1.0.0-alpha.17",
			newState,
		);
		// if the state queries does not containe mcp_driver json and state variables does not contain mcp_driver variable and mcp_driver--1 variable, then migrate to 1.0.0-alpha.17
		if (
			!newState.queries?.["mcp_driver"] &&
			!newState.variables?.["mcp_driver"] &&
			!newState.variables?.["mcp_driver--1"]
		) {
			newState.queries = {
				...(newState.queries as Record<string, unknown>),
				mcp_driver: {
					id: "mcp_driver",
					cells: [
						{
							id: "1",
							widget: "code",
							parameters: {
								code: "",
								type: "pixel",
							},
						},
					],
				},
			};

			newState.variables = {
				...(newState.variables as Record<string, unknown>),
				mcp_driver: {
					type: "query",
					to: "mcp_driver",
					cellId: "1",
				},
				"mcp_driver--1": {
					type: "cell",
					to: "mcp_driver",
					cellId: "1",
				},
			};
		}

		return newState;
	},
};

export default migrate__1_0_0_alpha_16__to_1_0_0_alpha_17;
