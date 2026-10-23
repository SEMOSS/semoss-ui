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

export interface VenvReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/venv/ActivateVirtualEnvReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ActivateVirtualEnv: ReactorContract<
		SourceParameters<"engine", "both", ["engine"], 1>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/venv/AddPackageToVenvReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddPackageToVenv: ReactorContract<
		SourceParameters<
			"engine" | "paramValues",
			"both",
			["engine", "paramValues"],
			2
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/venv/upload/CreateVenvEngineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateVenvEngine: ReactorContract<
		SourceParameters<
			"global" | "venv" | "venvDetails",
			"both",
			["venv", "venvDetails"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/venv/ListPackagesInVirtualEnvReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ListPackagesInVirtualEnv: ReactorContract<
		SourceParameters<"engine", "both", ["engine"], 1>,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/venv/RemovePackageFromVenvReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemovePackageFromVenv: ReactorContract<
		SourceParameters<
			"engine" | "paramValues",
			"both",
			["engine", "paramValues"],
			2
		>,
		boolean,
		false
	>;
}
