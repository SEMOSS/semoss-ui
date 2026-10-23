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

export interface CoreReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/AddVarReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddVar: ReactorContract<
		SourceParameters<
			"expression" | "format" | "frame" | "language" | "variable",
			"both",
			["variable", "frame", "expression"],
			3
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/AssignmentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Assignment: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/Assimilator.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Assimilator: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/CalcVarReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CalcVar: ReactorContract<
		SourceParameters<"variable", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/CheckEngineNameReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CheckEngineName: ReactorContract<
		SourceParameters<"engine", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/CheckProjectNameReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CheckProjectName: ReactorContract<
		SourceParameters<"project", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/EchoReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Echo: ReactorContract<SourceParameters<"value", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/EmbeddedRoutineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EmbeddedRoutine: ReactorContract<
		SourceParameters<never, "named">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/EmbeddedScriptReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EmbeddedScript: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/GenericReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Generic: ReactorContract<SourceParameters<"KEY", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/IfReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	IF: ReactorContract<SourceParameters<never, "positional">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/IfReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	If: ReactorContract<SourceParameters<never, "positional">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/ListVarReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ListVar: ReactorContract<
		SourceParameters<never, "named">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/LogMessage.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	LogMessage: ReactorContract<
		SourceParameters<"message", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/MyEngineProjectReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MyEngineProject: ReactorContract<
		SourceParameters<
			| "engine"
			| "filterWord"
			| "limit"
			| "metaFilters"
			| "metaKeys"
			| "noMeta"
			| "offset"
			| "onlyFavorites"
			| "permissionFilters"
			| "project"
			| "projectType"
			| "subType"
			| "type",
			"both"
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/NegReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Neg: ReactorContract<SourceParameters<never, "positional">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/NegEvaluator.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	NegEvaluator: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/PixelSourceReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PixelSource: ReactorContract<
		SourceParameters<"filePath" | "space", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/PowAssimilator.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PowAssimilator: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/ReconnectServer.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ReconnectServer: ReactorContract<
		SourceParameters<never, "named">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/SendErrorMessageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SendErrorMessage: ReactorContract<
		SourceParameters<"message", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/SendSuccessMessageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SendSuccessMessage: ReactorContract<
		SourceParameters<"message", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/SendWarningMessageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SendWarningMessage: ReactorContract<
		SourceParameters<"message", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/SetFilterRefresh.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetFilterRefresh: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/StopPixelExecutionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	StopPixelExecution: ReactorContract<
		SourceParameters<"id", "both", ["id"], 1>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/UUIDReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UUID: ReactorContract<SourceParameters<never, "named">, string, true>;
	/**
	 * @source Semoss/src/prerna/reactor/VectorReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Vector: ReactorContract<
		SourceParameters<never, "positional">,
		unknown[],
		false
	>;
}
