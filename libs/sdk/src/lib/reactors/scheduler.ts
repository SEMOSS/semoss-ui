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

export interface SchedulerReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/scheduler/EditScheduledJobReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EditScheduledJob: ReactorContract<
		SourceParameters<
			| "cronExpression"
			| "cronTz"
			| "curJobGroup"
			| "curJobName"
			| "jobGroup"
			| "jobId"
			| "jobName"
			| "jobTags"
			| "recipe"
			| "recipeParameters"
			| "triggerNow"
			| "triggerOnLoad"
			| "uiState",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/scheduler/ExecuteScheduledJobReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExecuteScheduledJob: ReactorContract<
		SourceParameters<"jobGroup" | "jobId", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/scheduler/ListAllJobsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ListAllJobs: ReactorContract<
		SourceParameters<"jobTags" | "myJobs" | "project" | "username", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/scheduler/PauseJobTriggerReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PauseJobTrigger: ReactorContract<
		SourceParameters<"jobGroup" | "jobId", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/scheduler/RemoveJobFromDBReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoveJobFromDB: ReactorContract<
		SourceParameters<"jobGroup" | "jobId", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/scheduler/ResumeJobTriggerReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ResumeJobTrigger: ReactorContract<
		SourceParameters<"jobGroup" | "jobId", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/scheduler/ScheduleJobReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ScheduleJob: ReactorContract<
		SourceParameters<
			| "cronExpression"
			| "cronTz"
			| "jobGroup"
			| "jobName"
			| "jobTags"
			| "recipe"
			| "recipeParameters"
			| "triggerNow"
			| "triggerOnLoad"
			| "uiState",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/scheduler/SchedulerHistoryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SchedulerHistory: ReactorContract<
		SourceParameters<
			"filters" | "jobTags" | "limit" | "offset" | "sort",
			"named"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/scheduler/SchedulerStatsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SchedulerStats: ReactorContract<
		SourceParameters<"window", "both">,
		Record<string, unknown> | null,
		false
	>;
}
