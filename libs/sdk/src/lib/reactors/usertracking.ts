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

export interface UsertrackingReactorCatalog {
	/**
	 * @source Semoss/src/prerna/usertracking/reactors/AdminAuditEventsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminAuditEvents: ReactorContract<
		SourceParameters<
			| "actorId"
			| "category"
			| "engineId"
			| "eventType"
			| "export"
			| "from"
			| "insightId"
			| "page"
			| "projectId"
			| "severity"
			| "snapshot"
			| "status"
			| "subjectId"
			| "targetId"
			| "targetType"
			| "to",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/usertracking/reactors/AdminUserAuditEventsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminUserAuditEvents: ReactorContract<
		SourceParameters<"export" | "qs", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/usertracking/reactors/AdminVerifyAuditTrailReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminVerifyAuditTrail: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/usertracking/reactors/EngineAuditEventsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EngineAuditEvents: ReactorContract<
		SourceParameters<
			| "actorId"
			| "category"
			| "direction"
			| "eventType"
			| "from"
			| "id"
			| "page"
			| "pageSize"
			| "severity"
			| "sort"
			| "status"
			| "subjectId"
			| "to",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/usertracking/reactors/GetUserEngineVotesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetUserEngineVotes: ReactorContract<
		SourceParameters<"engine", "both">,
		Record<string, unknown> | boolean | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/usertracking/reactors/ProjectAuditEventsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ProjectAuditEvents: ReactorContract<
		SourceParameters<
			| "actorId"
			| "category"
			| "direction"
			| "eventType"
			| "from"
			| "id"
			| "page"
			| "pageSize"
			| "severity"
			| "sort"
			| "status"
			| "subjectId"
			| "to",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/usertracking/reactors/UnvoteEngineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UnvoteEngine: ReactorContract<
		SourceParameters<"engine", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/usertracking/reactors/UserActivityReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UserActivity: ReactorContract<
		SourceParameters<"qs", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/usertracking/reactors/UserActivitySQLiteReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UserActivitySQLite: ReactorContract<
		SourceParameters<"qs", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/usertracking/reactors/VoteEngineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	VoteEngine: ReactorContract<
		SourceParameters<"engine" | "vote", "both">,
		boolean,
		false
	>;
}
