import type { Migration, MigrationState } from "./migration.types";

const migrate__1_0_0_alpha_16__to_1_0_0_alpha_17: Migration = {
	versionFrom: "1.0.0-alpha.16",
	versionTo: "1.0.0-alpha.17",
	// This function performs a migration on the state by updating image block data
	async run(state: MigrationState): Promise<MigrationState> {
		const newState: MigrationState = { ...state };
		// if the state queries does not containe smss_driver json and state variables does not contain smss_driver variable and smss_driver--1 variable, then migrate to 1.0.0-alpha.17
		if (
			!newState.queries?.["smss_driver"] &&
			!newState.variables?.["smss_driver"] &&
			!newState.variables?.["smss_driver--1"]
		) {
			newState.queries = {
				...newState.queries as Record<string, unknown>,
				"smss_driver": {
					id: "smss_driver",
					cells: [
						{
							id: "1",
							widget: "code",
							parameters: {
								code: "",
								type: "pixel"
							}
						}
					]
				}
			};
			
			newState.variables = {
				...newState.variables as Record<string, unknown>,
				"smss_driver": {
					type: "query",
					to: "smss_driver",
					cellId: "1"
				},
				"smss_driver--1": {
					type: "cell",
					to: "smss_driver",
					cellId: "1"
				}
			};
		}

		return newState;
	},
};

export default migrate__1_0_0_alpha_16__to_1_0_0_alpha_17;
