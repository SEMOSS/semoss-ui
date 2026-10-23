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

export interface TestReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/test/LSASpaceColumnLearnedReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	LSASpaceColumnLearned: ReactorContract<
		SourceParameters<"frame", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/test/RunAliasMatchReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunAliasMatch: ReactorContract<
		SourceParameters<"INPUT" | "PROPOSALS", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/test/RunLSILearnedReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunLSILearned: ReactorContract<
		SourceParameters<"column" | "frame" | "numValue", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/test/RuntimeClassTest.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RuntimeClassTest: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/test/RuntimeClassTestSingle.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RuntimeClassTestSingle: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
}
