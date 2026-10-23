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

export interface CodeexecReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/codeexec/AdminRClearAllUserRservesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminRClearAllUserRserves: ReactorContract<
		SourceParameters<never, "named">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/codeexec/CancelRReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CancelR: ReactorContract<SourceParameters<never, "named">, boolean, false>;
	/**
	 * @source Semoss/src/prerna/reactor/codeexec/LoadPyFromFileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	LoadPyFromFile: ReactorContract<
		SourceParameters<
			"alias" | "filePath" | "space",
			"both",
			["filePath", "alias"],
			2
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/codeexec/LoadPyFromFileProjectPyReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	LoadPyFromFileProjectPy: ReactorContract<
		SourceParameters<
			"alias" | "filePath" | "space",
			"both",
			["filePath", "alias", "space"],
			3
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/codeexec/PixelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Pixel: ReactorContract<SourceParameters<"code", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/codeexec/PixelBase64Reactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PixelBase64: ReactorContract<
		SourceParameters<"code", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/codeexec/PyReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Py: ReactorContract<
		SourceParameters<"code", "both">,
		string | unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/codeexec/PyBase64Reactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PyBase64: ReactorContract<
		SourceParameters<"code", "both">,
		string | unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/codeexec/PySourceReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PySource: ReactorContract<
		SourceParameters<"filePath" | "space", "both">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/codeexec/RReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	R: ReactorContract<SourceParameters<never, "positional">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/codeexec/REnableUserRecoveryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	REnableUserRecovery: ReactorContract<
		SourceParameters<"enable", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/codeexec/RSourceReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RSource: ReactorContract<
		SourceParameters<"filePath" | "space", "both">,
		unknown[],
		false
	>;
}
