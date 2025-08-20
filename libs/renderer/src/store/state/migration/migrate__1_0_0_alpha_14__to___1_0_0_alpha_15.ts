import type { Migration, MigrationState } from "./migration.types";

const migrate__1_0_0_alpha_14__to_1_0_0_alpha_15: Migration = {
	versionFrom: "1.0.0-alpha.14",
	versionTo: "1.0.0-alpha.15",
	// This function performs a migration on the state by updating button blocks
	async run(state: MigrationState): Promise<MigrationState> {
		const newState: MigrationState = { ...state };

		Object.entries(newState.variables).forEach(([_, variable]) => {
			if (Object.hasOwn(variable, "isInput")) {
				delete variable.isInput;
			}

			if (Object.hasOwn(variable, "isOutput")) {
				delete variable.isOutput;
			}
		});

		return newState;
	},
};

export default migrate__1_0_0_alpha_14__to_1_0_0_alpha_15;
