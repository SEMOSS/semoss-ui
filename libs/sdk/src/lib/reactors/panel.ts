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

export interface PanelReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/panel/AddPanelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddPanel: ReactorContract<
		SourceParameters<"panel" | "sheet", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/rules/AddPanelColorByValueReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddPanelColorByValue: ReactorContract<
		SourceParameters<
			"MAP" | "name" | "options" | "panel" | "panelCbv" | "qs",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/comments/AddPanelCommentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddPanelComment: ReactorContract<
		SourceParameters<"comment" | "panel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/AddPanelConfigReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddPanelConfig: ReactorContract<
		SourceParameters<"config" | "panel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/events/AddPanelEventsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddPanelEvents: ReactorContract<
		SourceParameters<"events" | "panel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/filter/AddPanelFilterReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddPanelFilter: ReactorContract<
		SourceParameters<"panel" | "taskRefresh", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/AddPanelIfAbsentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddPanelIfAbsent: ReactorContract<
		SourceParameters<"panel" | "sheet", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/ornaments/AddPanelOrnamentsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddPanelOrnaments: ReactorContract<
		SourceParameters<"ornaments" | "panel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/sort/AddPanelSortReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddPanelSort: ReactorContract<
		SourceParameters<"columns" | "panel" | "sort", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/sort/AddPanelSortByReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddPanelSortBy: ReactorContract<
		SourceParameters<"column" | "panel" | "values", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/CachedPanelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CachedPanel: ReactorContract<
		SourceParameters<"panel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/CachedPanelCloneReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CachedPanelClone: ReactorContract<
		SourceParameters<"cloneId" | "panel", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/CloneReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Clone: ReactorContract<
		SourceParameters<"cloneId" | "panel" | "sheet", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/ClosePanelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ClosePanel: ReactorContract<
		SourceParameters<never, "positional">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/ClosePanelIfExistsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ClosePanelIfExists: ReactorContract<
		SourceParameters<never, "positional">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/filter/DeletePanelFilterReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeletePanelFilter: ReactorContract<
		SourceParameters<"index" | "panel" | "taskRefresh", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/GetPanelCollectReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetPanelCollect: ReactorContract<
		SourceParameters<"panel", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/rules/GetPanelColorByValueReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetPanelColorByValue: ReactorContract<
		SourceParameters<"panel", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/filter/GetPanelFiltersReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetPanelFilters: ReactorContract<
		SourceParameters<"panel", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/filter/GetPanelFiltersQSReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetPanelFiltersQS: ReactorContract<
		SourceParameters<"panel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/GetPanelIdReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetPanelId: ReactorContract<
		SourceParameters<"panel", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/sort/GetPanelSortReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetPanelSort: ReactorContract<
		SourceParameters<"panel", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/GetPanelStateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetPanelState: ReactorContract<
		SourceParameters<"output" | "panel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/InsightPanelIds.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	InsightPanelIds: ReactorContract<
		SourceParameters<never, "named">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/MovePanelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MovePanel: ReactorContract<
		SourceParameters<"panel" | "sheet", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/external/OpenTabReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpenTab: ReactorContract<
		SourceParameters<never, "positional">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/PanelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Panel: ReactorContract<SourceParameters<"panel", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/PanelExistsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PanelExists: ReactorContract<
		SourceParameters<never, "positional">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/RefreshPanelViewReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RefreshPanelView: ReactorContract<
		SourceParameters<"panel", "both">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/rules/RemovePanelColorByValueReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemovePanelColorByValue: ReactorContract<
		SourceParameters<"name" | "panel" | "panelCbv", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/comments/RemovePanelCommentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemovePanelComment: ReactorContract<
		SourceParameters<"comment" | "panel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/events/RemovePanelEventsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemovePanelEvents: ReactorContract<
		SourceParameters<"panel" | "traversal", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/ornaments/RemovePanelOrnamentsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemovePanelOrnaments: ReactorContract<
		SourceParameters<"panel" | "traversal", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/sort/UnsortPanelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemovePanelSort: ReactorContract<
		SourceParameters<"column" | "columns" | "panel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/filter/ReplacePanelFilterReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ReplacePanelFilter: ReactorContract<
		SourceParameters<"panel" | "taskRefresh", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/events/ResetPanelEventsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ResetPanelEvents: ReactorContract<
		SourceParameters<"panel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/ornaments/ResetPanelOrnamentsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ResetPanelOrnaments: ReactorContract<
		SourceParameters<"panel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/rules/RetrievePanelColorByValueReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RetrievePanelColorByValue: ReactorContract<
		SourceParameters<"name" | "panel" | "panelCbv", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/comments/RetrievePanelCommentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RetrievePanelComment: ReactorContract<
		SourceParameters<"comment" | "panel", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/events/RetrievePanelEventsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RetrievePanelEvents: ReactorContract<
		SourceParameters<"panel" | "traversal", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/ornaments/RetrievePanelOrnamentsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RetrievePanelOrnaments: ReactorContract<
		SourceParameters<"panel" | "traversal", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/sort/SetMultiTypePanelSortReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetMultiTypePanelSort: ReactorContract<
		SourceParameters<"panel" | "sortConfig", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/SetPanelCollectReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetPanelCollect: ReactorContract<
		SourceParameters<"limit" | "panel", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/filter/SetPanelFilterReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetPanelFilter: ReactorContract<
		SourceParameters<"panel" | "taskRefresh", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/SetPanelLabelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetPanelLabel: ReactorContract<
		SourceParameters<"panel" | "panelLabel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/SetPanelPositionReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetPanelPosition: ReactorContract<
		SourceParameters<"panel" | "position", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/SetPanelSheetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetPanelSheet: ReactorContract<
		SourceParameters<"panel" | "sheet", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/sort/SetPanelSortReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetPanelSort: ReactorContract<
		SourceParameters<"columns" | "panel" | "sort", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/sort/SetPanelSortByReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetPanelSortBy: ReactorContract<
		SourceParameters<
			"column" | "columns" | "panel" | "sort" | "values",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/SetPanelStateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetPanelState: ReactorContract<
		SourceParameters<"state", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/SetPanelViewReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetPanelView: ReactorContract<
		SourceParameters<"panel" | "panelView" | "panelViewOptions", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/filter/UnfilterPanelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UnfilterPanel: ReactorContract<
		SourceParameters<"panel" | "taskRefresh", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/sort/UnsortPanelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UnsortPanel: ReactorContract<
		SourceParameters<"column" | "columns" | "panel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/panel/comments/UpdatePanelCommentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdatePanelComment: ReactorContract<
		SourceParameters<"comment" | "panel", "both">,
		unknown,
		false
	>;
}
