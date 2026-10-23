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

export interface BlocksReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/blocks/AddBlockReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddBlock: ReactorContract<
		SourceParameters<"json" | "name" | "section", "both", ["name"], 1>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/blocks/DeleteBlockReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteBlock: ReactorContract<
		SourceParameters<"blockId" | "hardDelete", "both", ["blockId"], 1>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/blocks/GetClientBlocksReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetClientBlocks: ReactorContract<
		SourceParameters<"filters", "both">,
		unknown,
		false
	>;
}
