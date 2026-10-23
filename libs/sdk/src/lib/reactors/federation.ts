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

export interface FederationReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/federation/FederationBestMatches.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FederationBestMatches: ReactorContract<
		SourceParameters<
			| "column"
			| "concept"
			| "database"
			| "frame"
			| "frameCol"
			| "outputFrame",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/federation/FederationBlend.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FederationBlend: ReactorContract<
		SourceParameters<
			| "additionalCols"
			| "column"
			| "concept"
			| "database"
			| "fedFrame"
			| "frame"
			| "frameCol"
			| "joinType"
			| "matches"
			| "nonMatches"
			| "propagation",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/federation/FuzzyMatchesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FuzzyMatches: ReactorContract<
		SourceParameters<
			"frame" | "frameCol" | "outputFrame" | "qs" | "task",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/federation/FuzzyMergeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FuzzyMerge: ReactorContract<
		SourceParameters<
			| "fedFrame"
			| "frame"
			| "joins"
			| "matches"
			| "nonMatches"
			| "propagation",
			"both"
		>,
		unknown,
		false
	>;
}
