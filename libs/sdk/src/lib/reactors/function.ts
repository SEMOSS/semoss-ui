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

export interface FunctionReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/function/upload/CreateFunctionEngineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateFunctionEngine: ReactorContract<
		SourceParameters<
			"filePath" | "function" | "functionDetails",
			"both",
			["function", "functionDetails"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/function/upload/CreatePythonFunctionEngineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreatePythonFunctionEngine: ReactorContract<
		SourceParameters<"content" | "function" | "functionDetails", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/function/ExecuteFunctionEngineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExecuteFunctionEngine: ReactorContract<
		SourceParameters<"engine" | "map", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/function/ExecuteGuardrailEngineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExecuteGuardrailEngine: ReactorContract<
		SourceParameters<"engine", "both", ["engine"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/function/ExecuteReactorFunctionEngineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExecuteReactorFunctionEngine: ReactorContract<
		SourceParameters<"engine", "both", ["engine"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/function/ExecuteStreamingFunctionEngineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExecuteStreamingFunctionEngine: ReactorContract<
		SourceParameters<"engine" | "map", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/function/GetFunctionEngineDefinitionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetFunctionEngineDefinition: ReactorContract<
		SourceParameters<"engine", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/function/GetGuardrailEngineDefinitionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetGuardrailEngineDefinition: ReactorContract<
		SourceParameters<"engine", "both">,
		unknown,
		false
	>;
}
