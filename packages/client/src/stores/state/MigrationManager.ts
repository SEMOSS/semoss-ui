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
type MigrationFunction = (state: State, to: string) => Promise<State>;

// Define a type for the migrations map
interface Migrations {
    [version: string]: {
        migrate: MigrationFunction;
        to: string;
    };
}

export const STATE_STORE_CURRENT_VERSION = '1.0.0-alpha.1';

export class MigrationManager {
    private latestVersion: string;
    private migrations: Migrations;

    constructor() {
        this.latestVersion = STATE_STORE_CURRENT_VERSION;
        this.migrations = {
            '1.0.0-alpha': {
                migrate: migrate__1_0_0_alpha_to_1_0_0_alpha_1,
                to: '1.0.0-alpha.1',
            },
            // Add future migrations here
            '1.0.0-alpha.1': {
                migrate: migrate__1_0_0_alpha_1_to_1_0_0_alpha_2,
                to: '1.0.0-alpha.2',
            },
        };
    }

    async run(state) {
        while (state.version !== this.latestVersion) {
            //  If state.version is undefined, it is safe to assume this was an old app before we introduced version
            const migration =
                this.migrations[state.version ? state.version : '1.0.0-alpha'];
            if (migration) {
                state = await migration.migrate(state, migration.to);
            } else {
                console.error(
                    `No migration function available for version ${state.version}`,
                );
                break; // Exit the loop if no migration is found
            }
        }
        return state;
    }
}
