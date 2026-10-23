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

export interface GuardrailReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/guardrail/upload/CreateGuardrailEngineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateGuardrailEngine: ReactorContract<
		SourceParameters<
			"global" | "guardrail" | "guardrailDetails",
			"both",
			["guardrail", "guardrailDetails"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/guardrail/GetSqlQueryPolicyDefaultsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetSqlQueryPolicyDefaults: ReactorContract<
		SourceParameters<"dialect", "both">,
		Record<string, unknown> | null,
		false
	>;
}
