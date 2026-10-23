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

export interface PromptReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/prompt/AddPromptReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddPrompt: ReactorContract<
		SourceParameters<"map", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/prompt/CheckPromptTitleReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CheckPromptTitle: ReactorContract<
		SourceParameters<"promptTitle", "both">,
		boolean | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/prompt/DeletePromptReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeletePrompt: ReactorContract<
		SourceParameters<"promptId", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/prompt/GetPromptReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetPrompt: ReactorContract<
		SourceParameters<"promptId", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/prompt/GetPromptMetaValuesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetPromptMetaValues: ReactorContract<
		SourceParameters<"metaKeys", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/prompt/GetPromptWithVersionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetPromptWithVersions: ReactorContract<
		SourceParameters<"promptId", "both">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/prompt/ListPromptReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ListPrompt: ReactorContract<
		SourceParameters<
			"filters" | "limit" | "metaFilters" | "offset",
			"both"
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/prompt/UpdatePromptReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdatePrompt: ReactorContract<
		SourceParameters<"map", "both">,
		boolean,
		false
	>;
}
