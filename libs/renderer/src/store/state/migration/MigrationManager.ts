import { STATE_VERSION as LATEST_STATE_VERSION } from "../../../version";
import migrate__1_0_0_alpha_to_1_0_0_alpha_1 from "./migrate__1_0_0_alpha__to__1_0_0_alpha_1";
import migrate__1_0_0_alpha_1_to_1_0_0_alpha_2 from "./migrate__1_0_0_alpha_1__to__1_0_0_alpha_2";
import migrate__1_0_0_alpha_2_to_1_0_0_alpha_3 from "./migrate__1_0_0_alpha_2__to___1_0_0_alpha_3";
import migrate__1_0_0_alpha_3_to_1_0_0_alpha_4 from "./migrate__1_0_0_alpha_3__to___1_0_0_alpha_4";
import migrate__1_0_0_alpha_4_to_1_0_0_alpha_5 from "./migrate__1_0_0_alpha_4__to___1_0_0_alpha_5";
import migrate__1_0_0_alpha_5_to_1_0_0_alpha_6 from "./migrate__1_0_0_alpha_5__to___1_0_0_alpha_6";
import migrate__1_0_0_alpha_6_to_1_0_0_alpha_7 from "./migrate__1_0_0_alpha_6__to___1_0_0_alpha_7";
import migrate__1_0_0_alpha_7_to_1_0_0_alpha_8 from "./migrate__1_0_0_alpha_7__to___1_0_0_alpha_8_";
import migrate__1_0_0_alpha_8_to_1_0_0_alpha_9 from "./migrate__1_0_0_alpha_8__to___1_0_0_alpha_9_";
import migrate__1_0_0_alpha_9_to_1_0_0_alpha_10 from "./migrate__1_0_0_alpha_9__to___1_0_0_alpha_10_";
import migrate__1_0_0_alpha_10_to_1_0_0_alpha_11 from "./migrate__1_0_0_alpha_10__to__1_0_0_alpha_11";
import migrate__1_0_0_alpha_11_to_1_0_0_alpha_12 from "./migrate__1_0_0_alpha_11__to___1_0_0_alpha_12";
import migrate__1_0_0_alpha_12_to_1_0_0_alpha_13 from "./migrate__1_0_0_alpha_12__to___1_0_0_alpha_13";
import migrate__1_0_0_alpha_13__to_1_0_0_alpha_14 from "./migrate__1_0_0_alpha_13__to___1_0_0_alpha_14";
import migrate__1_0_0_alpha_14__to_1_0_0_alpha_15 from "./migrate__1_0_0_alpha_14__to___1_0_0_alpha_15";
import migrate__1_0_0_alpha_15__to_1_0_0_alpha_16 from "./migrate__1_0_0_alpha_15__to___1_0_0_alpha_16";
import migrate__1_0_0_alpha_16__to_1_0_0_alpha_17 from "./migrate__1_0_0_alpha_16__to___1_0_0_alpha_17";
import migrate__1_0_0_alpha_17__to___1_0_0_alpha_18 from "./migrate__1_0_0_alpha_17__to___1_0_0_alpha_18";
import type { Migration, MigrationState } from "./migration.types";

// TODO: ANYTIME VERSION CHANGES
// 1. Update Template Apps
// 2. Update Agent Builder

export const STATE_VERSION = LATEST_STATE_VERSION;

export class MigrationManager {
	/**
	 * Latest version of the the state
	 */
	private latestVersion: string = LATEST_STATE_VERSION;

	/**
	 * Current record of all available migrations
	 */
	private migrations: Record<string, Migration> = {
		[migrate__1_0_0_alpha_to_1_0_0_alpha_1.versionFrom]:
			migrate__1_0_0_alpha_to_1_0_0_alpha_1,
		[migrate__1_0_0_alpha_1_to_1_0_0_alpha_2.versionFrom]:
			migrate__1_0_0_alpha_1_to_1_0_0_alpha_2,
		[migrate__1_0_0_alpha_2_to_1_0_0_alpha_3.versionFrom]:
			migrate__1_0_0_alpha_2_to_1_0_0_alpha_3,
		[migrate__1_0_0_alpha_3_to_1_0_0_alpha_4.versionFrom]:
			migrate__1_0_0_alpha_3_to_1_0_0_alpha_4,
		[migrate__1_0_0_alpha_4_to_1_0_0_alpha_5.versionFrom]:
			migrate__1_0_0_alpha_4_to_1_0_0_alpha_5,
		[migrate__1_0_0_alpha_5_to_1_0_0_alpha_6.versionFrom]:
			migrate__1_0_0_alpha_5_to_1_0_0_alpha_6,
		[migrate__1_0_0_alpha_6_to_1_0_0_alpha_7.versionFrom]:
			migrate__1_0_0_alpha_6_to_1_0_0_alpha_7,
		[migrate__1_0_0_alpha_7_to_1_0_0_alpha_8.versionFrom]:
			migrate__1_0_0_alpha_7_to_1_0_0_alpha_8,
		[migrate__1_0_0_alpha_8_to_1_0_0_alpha_9.versionFrom]:
			migrate__1_0_0_alpha_8_to_1_0_0_alpha_9,
		[migrate__1_0_0_alpha_9_to_1_0_0_alpha_10.versionFrom]:
			migrate__1_0_0_alpha_9_to_1_0_0_alpha_10,
		[migrate__1_0_0_alpha_10_to_1_0_0_alpha_11.versionFrom]:
			migrate__1_0_0_alpha_10_to_1_0_0_alpha_11,
		[migrate__1_0_0_alpha_11_to_1_0_0_alpha_12.versionFrom]:
			migrate__1_0_0_alpha_11_to_1_0_0_alpha_12,
		[migrate__1_0_0_alpha_12_to_1_0_0_alpha_13.versionFrom]:
			migrate__1_0_0_alpha_12_to_1_0_0_alpha_13,
		[migrate__1_0_0_alpha_13__to_1_0_0_alpha_14.versionFrom]:
			migrate__1_0_0_alpha_13__to_1_0_0_alpha_14,
		[migrate__1_0_0_alpha_14__to_1_0_0_alpha_15.versionFrom]:
			migrate__1_0_0_alpha_14__to_1_0_0_alpha_15,
		[migrate__1_0_0_alpha_15__to_1_0_0_alpha_16.versionFrom]:
			migrate__1_0_0_alpha_15__to_1_0_0_alpha_16,
		[migrate__1_0_0_alpha_16__to_1_0_0_alpha_17.versionFrom]:
			migrate__1_0_0_alpha_16__to_1_0_0_alpha_17,
		[migrate__1_0_0_alpha_17__to___1_0_0_alpha_18.versionFrom]:
			migrate__1_0_0_alpha_17__to___1_0_0_alpha_18,
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

		// notifiy developers
		if (newState.version !== this.latestVersion) {
			console.warn(
				`Migrating version ${state.version} to ${LATEST_STATE_VERSION}`,
			);
		}

		while (newState.version !== this.latestVersion) {
			//  If state.version is undefined, it is safe to assume this was an old app before we introduced version
			const migration =
				this.migrations[
					newState.version ? newState.version : "1.0.0-alpha"
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
						`Error migrating from ${migration.versionFrom} to ${migration.versionTo}`,
					);
				}
			} else {
				throw new Error(
					`No migration available for version ${state.version}`,
				);
			}
		}

		return newState;
	}
}
