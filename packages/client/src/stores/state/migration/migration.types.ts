/**
 * Base state of the migration
 *
 */
export interface MigrationState {
    /**
     * Version of the Migration
     */
    version: string;
    [key: string]: unknown;
}

/**
 * Migration class that helps migrate the state from an older version to a new version
 *
 * @template F state that the migration manager is migrating from
 * @template T state that the migration manager is migrating to
 *
 */
export type Migration<
    F extends MigrationState = MigrationState,
    T extends MigrationState = MigrationState,
> = {
    /**
     * Version that the state will be transition from
     */
    versionFrom: string;

    /**
     * Version that the state will be transition from
     */
    versionTo: string;

    /**
     * Run the migration and transform the state
     */
    run: (state: F) => T | Promise<T>;
};
