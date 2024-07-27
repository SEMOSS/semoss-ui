import { Migration, MigrationState } from './migration.types';

import migrate__1_0_0_alpha_to_1_0_0_alpha_1 from './migrate__1_0_0_alpha__to__1_0_0_alpha_1';
import migrate__1_0_0_alpha_1_to_1_0_0_alpha_2 from './migrate__1_0_0_alpha_1__to__1_0_0_alpha_2';

export const STATE_VERSION = '1.0.0-alpha.1';

export class MigrationManager {
    /**
     * Latest version of the the state
     */
    private latestVersion: string = STATE_VERSION;

    /**
     * Current record of all available migrations
     */
    private migrations: Record<string, Migration> = {
        [migrate__1_0_0_alpha_to_1_0_0_alpha_1.versionFrom]:
            migrate__1_0_0_alpha_to_1_0_0_alpha_1,
        [migrate__1_0_0_alpha_1_to_1_0_0_alpha_2.versionFrom]:
            migrate__1_0_0_alpha_1_to_1_0_0_alpha_2,
    };

    /**
     * Run the migration transforming the state. This mutates the original
     *
     * @template T state that the migration manager is migrating to
     *
     * @param state - state that will be transformed
     * @returns
     */
    async run<T extends MigrationState = MigrationState>(
        state: MigrationState,
    ): Promise<T> {
        // lazy deep copy
        let newState = JSON.parse(JSON.stringify(state));

        while (newState.version !== this.latestVersion) {
            //  If state.version is undefined, it is safe to assume this was an old app before we introduced version
            const migration =
                this.migrations[
                    newState.version ? newState.version : '1.0.0-alpha'
                ];

            if (migration) {
                try {
                    // migrate the state
                    newState = await migration.run(newState);

                    // update the version to the new one
                    newState.version = migration.versionTo;
                } catch (e) {
                    console.log(e);

                    throw new Error(
                        `Error upgrading from ${migration.versionFrom} to ${migration.versionTo}`,
                    );
                }
            } else {
                throw new Error(
                    `No migration function available for version ${state.version}`,
                );
            }
        }

        return newState;
    }
}
