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

export interface PlannerReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/planner/GraphPlanReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GraphPlan: ReactorContract<
		SourceParameters<"PLANNER" | "planner", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/planner/graph/LoadClientReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	LoadClient: ReactorContract<
		SourceParameters<
			| "assignment"
			| "returnType"
			| "separator"
			| "task"
			| "type"
			| "value",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/planner/graph/RunPlanReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunPlan: ReactorContract<
		SourceParameters<"PLANNER", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/planner/graph/UpdateGraphPlannerReactor2.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdateGraphPlannerReactor2: ReactorContract<
		SourceParameters<"pksls", "named">,
		unknown,
		false
	>;
}
