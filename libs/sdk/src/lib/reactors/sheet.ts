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

export interface SheetReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/sheet/AddSheetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddSheet: ReactorContract<
		SourceParameters<"sheet", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/sheet/CachedSheetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CachedSheet: ReactorContract<
		SourceParameters<"sheet", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/sheet/CloseSheetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CloseSheet: ReactorContract<
		SourceParameters<never, "positional">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/sheet/GetSheetStateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetSheetState: ReactorContract<
		SourceParameters<"output" | "sheet", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/sheet/SetActiveSheetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetActiveSheet: ReactorContract<
		SourceParameters<"sheet", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/sheet/SetSheetBackgroundReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetSheetBackground: ReactorContract<
		SourceParameters<"sheet" | "sheetLabel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/sheet/SetSheetConfigReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetSheetConfig: ReactorContract<
		SourceParameters<"sheet" | "sheetConfig", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/sheet/SetSheetLabelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetSheetLabel: ReactorContract<
		SourceParameters<"sheet" | "sheetLabel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/sheet/SetSheetStateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetSheetState: ReactorContract<
		SourceParameters<"state", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/sheet/SheetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Sheet: ReactorContract<SourceParameters<"sheet", "both">, unknown, false>;
}
