import { STATE_STORE_CURRENT_VERSION } from './state.constants';

const __1_0_0_alpha_to_1_0_0_alpha_1 = (state) => {
    // custom logic
};

const latestVersion = STATE_STORE_CURRENT_VERSION;

const migrations = {
    '1.0.0-alpha': __1_0_0_alpha_to_1_0_0_alpha_1,
};

const MigrationRunner = async (state) => {
    if (state.version !== latestVersion) {
        const migrationFunction = migrations[state.version];

        if (migrationFunction) {
            const newState = await migrationFunction(state);
            await MigrationRunner(newState); // Recursive call to handle further migrations if necessary
        } else {
            console.error(
                `No migration function available for version ${state.version}`,
            );
        }
    }
};
