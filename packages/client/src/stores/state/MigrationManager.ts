import { STATE_STORE_CURRENT_VERSION } from './state.constants';
import {
    migrate__1_0_0_alpha_to_1_0_0_alpha_1,
    migrate__1_0_0_alpha_1_to_1_0_0_alpha_2,
} from './migration-util';

// Define an interface for the state
interface State {
    version: string;
    [key: string]: any; // Add other state properties as needed
}

// Define a type for the migration functions
type MigrationFunction = (state: State) => Promise<State>;

// Define a type for the migrations map
interface Migrations {
    [version: string]: MigrationFunction;
}

export class MigrationManager {
    private latestVersion: string;
    private migrations: Migrations;

    constructor() {
        this.latestVersion = STATE_STORE_CURRENT_VERSION;
        this.migrations = {
            '1.0.0-alpha': migrate__1_0_0_alpha_to_1_0_0_alpha_1,
            // Add future migrations here
            '1.0.0-alpha.1': migrate__1_0_0_alpha_1_to_1_0_0_alpha_2,
        };
    }

    async run(state) {
        // TODO: break cycle if state.version does not change
        while (state.version !== this.latestVersion) {
            const migrationFunction = this.migrations[state.version];
            if (migrationFunction) {
                state = await migrationFunction(state);
            } else {
                throw new Error(
                    `No migration function available for version ${state.version}`,
                );

                console.error(
                    `No migration function available for version ${state.version}`,
                );
                break; // Exit the loop if no migration is found
            }
        }
        return state;
    }
}
