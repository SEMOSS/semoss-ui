/**
 * Built-in reactor inventory at Semoss 12781b2478eb97e2a27a911e9bdbc94b6f34ee88.
 * Named keys include inherited constructors and reachable execution/helper reads.
 * Required inputs are included where reachable organizeKeys/checkOptional enforces
 * them. Output shapes follow source values and PixelStreamUtility. Remaining value,
 * validation, and nested-shape gaps are explicit in contract-gaps.json; audited
 * contracts override these base contracts in catalog.ts.
 */
import type { SourceParameters } from "./source-parameters";
import type { ReactorContract } from "./value-types";

export interface ClusterReactorCatalog {
	/**
	 * @source Semoss/src/prerna/cluster/util/AdminPushLocalToCloudReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminPushLocalToCloud: ReactorContract<
		SourceParameters<"dryRun", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/cluster/OpenDatabaseReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpenDatabase: ReactorContract<
		SourceParameters<"database", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/cluster/PullDatabaseFromCloudReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PullDatabaseFromCloud: ReactorContract<
		SourceParameters<"database", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/cluster/PullEngineFromCloudReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PullEngineFromCloud: ReactorContract<
		SourceParameters<"engine", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/cluster/PullInsightFolderFromCloudReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PullInsightFolderFromCloud: ReactorContract<
		SourceParameters<"id" | "project", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/cluster/PullProjectFolderFromCloudReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PullProjectFolderFromCloud: ReactorContract<
		SourceParameters<"project", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/cluster/PushDatabaseToCloudReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PushDatabaseToCloud: ReactorContract<
		SourceParameters<"database", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/cluster/PushEngineToCloudReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PushEngineToCloud: ReactorContract<
		SourceParameters<"engine", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/cluster/PushInsightFolderToCloudReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PushInsightFolderToCloud: ReactorContract<
		SourceParameters<"id" | "project", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/cluster/PushProjectFolderToCloudReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PushProjectFolderToCloud: ReactorContract<
		SourceParameters<"project", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/cluster/VersionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Version: ReactorContract<
		SourceParameters<"reload", "both">,
		Record<string, unknown> | null,
		false
	>;
}
