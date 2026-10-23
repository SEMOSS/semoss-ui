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

export interface FrameReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/frame/rdbms/AddColumnReactor.java
	 * @source Semoss/src/prerna/reactor/frame/py/AddColumnReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/AddColumnReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddColumn: ReactorContract<
		SourceParameters<
			"additionalDataType" | "dataType" | "frame" | "newCol",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filtermodel2/AddFilterModelStateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddFilterModelState: ReactorContract<
		SourceParameters<"frame" | "panel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filter/AddFrameFilterReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddFrameFilter: ReactorContract<
		SourceParameters<"frame" | "taskRefresh", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/AddOpenAIKeyReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddOpenAIKey: ReactorContract<
		SourceParameters<"apikey", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/AutoCleanColumnReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AutoCleanColumn: ReactorContract<
		SourceParameters<"column" | "frame" | "override", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/CacheNativeFrame.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CacheNativeFrame: ReactorContract<
		SourceParameters<"frame" | "frameType" | "inThread", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/rdbms/ChangeColumnTypeReactor.java
	 * @source Semoss/src/prerna/reactor/frame/py/ChangeColumnTypeReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/ChangeColumnTypeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ChangeColumnType: ReactorContract<
		| SourceParameters<
				| "additionalDataType"
				| "column"
				| "dataType"
				| "format"
				| "frame",
				"both"
		  >
		| SourceParameters<
				"additionalDataType" | "column" | "dataType" | "frame",
				"both"
		  >,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/graph/r/ChangeGraphLayoutReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ChangeGraphLayout: ReactorContract<
		SourceParameters<
			"frame" | "graphLayout" | "xMax" | "xMin" | "yMax" | "yMin",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filtermodel2/ClearFilterModelStateCacheReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ClearFilterModelStateCache: ReactorContract<
		SourceParameters<never, "named">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/graph/r/ClusterGraphReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ClusterGraph: ReactorContract<
		SourceParameters<"frame" | "routine", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/CollapseReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/CollapseReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Collapse: ReactorContract<
		SourceParameters<
			"delimiter" | "frame" | "groupByColumn" | "maintainCols" | "value",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/CollectNewColReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CollectNewCol: ReactorContract<
		SourceParameters<"FORMATTED_DATA_SET" | "qs" | "task", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/CollectNewTemporalColReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CollectNewTemporalCol: ReactorContract<
		SourceParameters<"FORMATTED_DATA_SET" | "qs" | "task", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/ColumnAverageReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/ColumnAverageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ColumnAverage: ReactorContract<
		SourceParameters<"columns" | "frame" | "newCol", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/ColumnCountReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/ColumnCountReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ColumnCount: ReactorContract<
		SourceParameters<"column" | "frame" | "panel" | "top", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/ConcatenateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Concatenate: ReactorContract<
		SourceParameters<"delimiter" | "frame" | "newCol" | "values", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/graph/ConnectedNodesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ConnectedNodes: ReactorContract<
		SourceParameters<"column" | "deg" | "dir" | "frame" | "values", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/convert/ConvertReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Convert: ReactorContract<
		SourceParameters<"alias" | "frame" | "frameType", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/ConvertFrameToVegaVizReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ConvertFrameToVegaViz: ReactorContract<
		SourceParameters<"frame" | "model" | "userInput", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/rdbms/CountIfReactor.java
	 * @source Semoss/src/prerna/reactor/frame/py/CountIfReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/CountIfReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CountIf: ReactorContract<
		| SourceParameters<"frame", "both">
		| SourceParameters<"column" | "frame" | "newCol" | "regex", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/CreateFrameReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateFrame: ReactorContract<
		SourceParameters<"alias" | "frameType" | "override", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/CumulativeSumReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/CumulativeSumReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CumulativeSum: ReactorContract<
		SourceParameters<
			"frame" | "groupByCols" | "newCol" | "sort" | "sortCols" | "value",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/CurrentFrameReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CurrentFrame: ReactorContract<
		SourceParameters<never, "named">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/DateAddValueReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/DateAddValueReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DateAddValue: ReactorContract<
		SourceParameters<
			"column" | "frame" | "new_col" | "unit" | "val_to_add",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/DateDifferenceReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/DateDifferenceReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DateDifference: ReactorContract<
		SourceParameters<
			| "end_column"
			| "frame"
			| "input_date"
			| "input_use"
			| "newCol"
			| "start_column"
			| "unit",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/DateExpanderReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/DateExpanderReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DateExpander: ReactorContract<
		SourceParameters<"column" | "frame" | "options", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/DecodeURIReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/DecodeURIReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DecodeURI: ReactorContract<
		SourceParameters<"columns" | "frame", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filter/DeleteFrameFilterReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteFrameFilter: ReactorContract<
		SourceParameters<"frame" | "index" | "taskRefresh", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/DescriptiveStatsReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/DescriptiveStatsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DescriptiveStats: ReactorContract<
		SourceParameters<"column" | "frame" | "panel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/DiscretizeReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/DiscretizeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Discretize: ReactorContract<
		| SourceParameters<"frame" | "requestMap", "both">
		| SourceParameters<"frame", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/DivisionReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/DivisionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Division: ReactorContract<
		SourceParameters<
			"denominator" | "frame" | "newCol" | "numerator" | "round",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/rdbms/DropColumnReactor.java
	 * @source Semoss/src/prerna/reactor/frame/py/DropColumnReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/DropColumnReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DropColumn: ReactorContract<
		| SourceParameters<"frame", "both">
		| SourceParameters<"columns" | "frame", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/rdbms/DropRowsReactor.java
	 * @source Semoss/src/prerna/reactor/frame/py/DropRowsReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/DropRowsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DropRows: ReactorContract<
		| SourceParameters<"frame", "both">
		| SourceParameters<"frame" | "qs", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/rdbms/DuplicateColumnReactor.java
	 * @source Semoss/src/prerna/reactor/frame/py/DuplicateColumnReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/DuplicateColumnReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DuplicateColumn: ReactorContract<
		SourceParameters<"column" | "frame" | "newCol", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/rdbms/EncodeColumnReactor.java
	 * @source Semoss/src/prerna/reactor/frame/py/EncodeColumnReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/EncodeColumnReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EncodeColumn: ReactorContract<
		| SourceParameters<"frame", "both">
		| SourceParameters<"columns" | "frame", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/EncodeURIReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/EncodeURIReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EncodeURI: ReactorContract<
		SourceParameters<"columns" | "frame", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/rdbms/ExtractLettersReactor.java
	 * @source Semoss/src/prerna/reactor/frame/py/ExtractLettersReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/ExtractLettersReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExtractLetters: ReactorContract<
		SourceParameters<"columns" | "frame" | "override", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/rdbms/ExtractNumbersReactor.java
	 * @source Semoss/src/prerna/reactor/frame/py/ExtractNumbersReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/ExtractNumbersReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExtractNumbers: ReactorContract<
		SourceParameters<"columns" | "frame" | "override", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/gaas/ner/FillFormReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FillForm: ReactorContract<
		SourceParameters<"command" | "form_fields" | "project", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/FilterEmptyValuesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FilterEmptyValues: ReactorContract<
		SourceParameters<"columns" | "frame", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filtermodel2/FilterModelStateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FilterModelState: ReactorContract<
		SourceParameters<
			| "column"
			| "dynamic"
			| "filterWord"
			| "frame"
			| "limit"
			| "offset"
			| "optionsCache"
			| "panel",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/graph/FindPathsConnectingGroupsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FindPathsConnectingGroups: ReactorContract<
		SourceParameters<
			"column1" | "column2" | "frame" | "max" | "values1" | "values2",
			"both"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/graph/FindPathsConnectingNodesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FindPathsConnectingNodes: ReactorContract<
		SourceParameters<"column" | "deg" | "frame" | "values", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filter/FrameFilterEmptyValuesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FrameFilterEmptyValues: ReactorContract<
		SourceParameters<"columns" | "frame" | "taskRefresh", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filtermodel/FrameFilterModelReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FrameFilterModel: ReactorContract<
		SourceParameters<
			"column" | "filterWord" | "frame" | "limit" | "offset" | "panel",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filtermodel/FrameFilterModelFilteredValuesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FrameFilterModelFilteredValues: ReactorContract<
		SourceParameters<
			"column" | "filterWord" | "frame" | "limit" | "offset" | "panel",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filtermodel/FrameFilterModelNumericRangeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FrameFilterModelNumericRange: ReactorContract<
		SourceParameters<"column" | "frame" | "panel", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filtermodel/FrameFilterModelVisibleValuesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FrameFilterModelVisibleValues: ReactorContract<
		SourceParameters<
			"column" | "filterWord" | "frame" | "limit" | "offset" | "panel",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/FrameFilterWithSQLReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FrameFilterWithSQL: ReactorContract<
		SourceParameters<"frame" | "query", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/FrameHeaderExistsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FrameHeaderExists: ReactorContract<
		SourceParameters<"column" | "frame", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/FrameHeadersReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FrameHeaders: ReactorContract<
		SourceParameters<"frame" | "headerTypes" | "reset", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/FrameProfileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FrameProfile: ReactorContract<
		SourceParameters<"frame", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/FrameTypeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FrameType: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/GenerateFrameFromPyVariableReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GenerateFrameFromPyVariable: ReactorContract<
		SourceParameters<"override" | "variable", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/GenerateFrameFromRVariableReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GenerateFrameFromRVariable: ReactorContract<
		SourceParameters<"override" | "variable", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/GenerateH2FrameFromRVariableReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GenerateH2FrameFromRVariable: ReactorContract<
		SourceParameters<"override" | "variable", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/sql/GenerateQueryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GenerateQuery: ReactorContract<
		SourceParameters<"sql", "both", ["sql"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filtermodel/GetFrameFilterRange.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetFrameFilterRange: ReactorContract<
		SourceParameters<
			"column" | "dynamic" | "frame" | "optionsCache" | "panel",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filtermodel/GetFrameFilterStateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetFrameFilterState: ReactorContract<
		SourceParameters<
			| "column"
			| "dynamic"
			| "filterWord"
			| "frame"
			| "limit"
			| "offset"
			| "optionsCache"
			| "panel",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filter/GetFrameFiltersReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetFrameFilters: ReactorContract<
		SourceParameters<"frame", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filter/GetFrameFiltersQSReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetFrameFiltersQS: ReactorContract<
		SourceParameters<"frame", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/GetFrameMetamodelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetFrameMetamodel: ReactorContract<
		SourceParameters<"frame", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/GetFrameTableStructureReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetFrameTableStructure: ReactorContract<
		SourceParameters<"frame", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filtermodel/GetPanelFilterStateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetPanelFilterState: ReactorContract<
		SourceParameters<
			"column" | "filterWord" | "frame" | "limit" | "offset" | "panel",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/sql/GetParamValuesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetParamValues: ReactorContract<
		SourceParameters<"params" | "sql", "both", ["sql", "params"], 2>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/analytics/GetRFResultsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetRFResults: ReactorContract<
		SourceParameters<"panel" | "requestItem" | "sortBy", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/HasDuplicatesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	HasDuplicates: ReactorContract<
		SourceParameters<"frame", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/HistogramReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/HistogramReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Histogram: ReactorContract<
		SourceParameters<"breaks" | "column" | "frame" | "panel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/ImputeNullValuesReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/ImputeNullValuesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ImputeNullValues: ReactorContract<
		| SourceParameters<"columns" | "frame", "both">
		| SourceParameters<"columns" | "frame" | "handleNull", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/rdbms/JoinColumnsReactor.java
	 * @source Semoss/src/prerna/reactor/frame/py/JoinColumnsReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/JoinColumnsReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JoinColumns: ReactorContract<
		| SourceParameters<"frame", "both">
		| SourceParameters<
				"columns" | "delimiter" | "frame" | "newCol",
				"both"
		  >,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/LastUsedFrameReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	LastUsedFrame: ReactorContract<
		SourceParameters<never, "named">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/LookupGenerateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	LookupGenerate: ReactorContract<
		SourceParameters<
			"column" | "comment" | "fileName" | "frame" | "space",
			"both"
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/LookupMatchReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	LookupMatch: ReactorContract<
		SourceParameters<"count" | "fileName" | "instance" | "space", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/LookupMergeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	LookupMerge: ReactorContract<
		SourceParameters<"column" | "frame" | "matches", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/MatchColumnValuesReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/MatchColumnValuesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MatchColumnValues: ReactorContract<
		SourceParameters<"column" | "frame", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/gaas/MooseReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Moose: ReactorContract<
		SourceParameters<"command" | "project", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/gaas/NLPQuery3Reactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	NLPQuery3: ReactorContract<
		SourceParameters<
			| "allFrames"
			| "command"
			| "dialect"
			| "engine"
			| "frame"
			| "json"
			| "tokenCount",
			"both"
		>,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/nativeframe/NativeCollectNewColReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	NativeCollectNewCol: ReactorContract<
		SourceParameters<"FORMATTED_DATA_SET" | "qs" | "task", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/graph/r/NodeDetailsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	NodeDetails: ReactorContract<
		SourceParameters<"column" | "frame" | "panel" | "value", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/sql/ParseSQL2Wrapper.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ParseSQL2Wrapper: ReactorContract<
		SourceParameters<"sql", "both", ["sql"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/PivotReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/PivotReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Pivot: ReactorContract<
		SourceParameters<
			| "frame"
			| "function"
			| "maintainCols"
			| "naReplace"
			| "pivotCol"
			| "valueCol",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/PivotTableReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PivotTable: ReactorContract<
		SourceParameters<"columns" | "frame" | "rowGroups" | "values", "both">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/PurgeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Purge: ReactorContract<
		SourceParameters<"frame", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/PyCollectNewColReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PyCollectNewCol: ReactorContract<
		SourceParameters<"FORMATTED_DATA_SET" | "qs" | "task", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/PyLoadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PyLoad: ReactorContract<
		SourceParameters<"filePath" | "space", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/analytics/PyNumericalCorrelationReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PyNumericalCorrelation: ReactorContract<
		SourceParameters<"attributes" | "frame" | "panel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/PyPlotReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PyPlot: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/RCollectNewColReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RCollectNewCol: ReactorContract<
		SourceParameters<"FORMATTED_DATA_SET" | "qs" | "task", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/RankReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/RankReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Rank: ReactorContract<
		SourceParameters<
			"columns" | "frame" | "newCol" | "partitionByCols" | "sort",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/RegexReplaceColumnValueReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/RegexReplaceColumnValueReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RegexReplaceColumnValue: ReactorContract<
		SourceParameters<"column" | "frame" | "newValue" | "value", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/RemoveDuplicateRowsReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/RemoveDuplicateRowsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoveDuplicateRows: ReactorContract<
		SourceParameters<"frame", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filter/RemoveFrameFilterReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoveFrameFilter: ReactorContract<
		SourceParameters<"frame" | "taskRefresh", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/graph/RemoveIntermediaryNodeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoveIntermediaryNode: ReactorContract<
		SourceParameters<"column" | "frame", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/graph/r/RemoveNodeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoveNode: ReactorContract<
		SourceParameters<"column" | "frame" | "value", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/rdbms/RenameColumnReactor.java
	 * @source Semoss/src/prerna/reactor/frame/py/RenameColumnReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/RenameColumnReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RenameColumn: ReactorContract<
		| SourceParameters<"frame", "both">
		| SourceParameters<"column" | "frame" | "newCol", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/ReplaceColumnValueReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/ReplaceColumnValueReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ReplaceColumnValue: ReactorContract<
		SourceParameters<"column" | "frame" | "newValue" | "value", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filter/ReplaceFrameFilterReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ReplaceFrameFilter: ReactorContract<
		SourceParameters<"frame" | "taskRefresh", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/sql/ReplaceParamReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ReplaceParam: ReactorContract<
		SourceParameters<
			"params" | "sql" | "value",
			"both",
			["sql", "params", "value"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filter/ResetAllFilters.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ResetAllFilters: ReactorContract<
		SourceParameters<"frame", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/ResetFrameToOriginalNameReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ResetFrameToOriginalName: ReactorContract<
		SourceParameters<"frame", "both">,
		boolean | { type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/analytics/RunAssociatedLearningReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunAssociatedLearning: ReactorContract<
		SourceParameters<
			| "attributes"
			| "column"
			| "conf"
			| "frame"
			| "lift"
			| "panel"
			| "ruleSide"
			| "support"
			| "values",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/analytics/RunClassificationReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunClassification: ReactorContract<
		SourceParameters<"attributes" | "classify" | "frame" | "panel", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/analytics/RunClusteringReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunClustering: ReactorContract<
		SourceParameters<
			| "algorithm"
			| "attributes"
			| "frame"
			| "instance"
			| "maxNumClusters"
			| "minNumClusters"
			| "multiOption"
			| "numClusters"
			| "uniqInstPerRow",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/analytics/RunDescriptionGeneratorReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunDescriptionGenerator: ReactorContract<
		SourceParameters<"frame" | "instance", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/analytics/RunDocCosSimilarityReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunDocCosSimilarity: ReactorContract<
		SourceParameters<
			"description" | "frame" | "instance" | "override",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/analytics/RunLOFReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunLOF: ReactorContract<
		SourceParameters<
			| "attributes"
			| "frame"
			| "instance"
			| "kNeighbors"
			| "uniqInstPerRow",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/analytics/RunNumericalColumnSimilarityReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunNumericalColumnSimilarity: ReactorContract<
		SourceParameters<
			| "columns"
			| "frame"
			| "panel"
			| "sampleSize"
			| "showAll"
			| "significance",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/analytics/RunNumericalModelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunNumericalModel: ReactorContract<
		SourceParameters<"column" | "frame" | "panel", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/analytics/RunOutlierReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunOutlier: ReactorContract<
		SourceParameters<
			"alpha" | "attributes" | "frame" | "nullHandleType",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/analytics/RunRandomForestReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunRandomForest: ReactorContract<
		SourceParameters<
			| "attributes"
			| "classify"
			| "filename"
			| "frame"
			| "mode"
			| "null_handler"
			| "panel"
			| "settings"
			| "space"
			| "tree_settings",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/analytics/RunSimilarityReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunSimilarity: ReactorContract<
		SourceParameters<"attributes" | "frame" | "instance", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/analytics/RunSimilarityHeatReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunSimilarityHeat: ReactorContract<
		SourceParameters<
			"attributes" | "frame" | "instance" | "override",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/SemanticBlendingReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SemanticBlending: ReactorContract<
		SourceParameters<
			| "columns"
			| "display"
			| "frame"
			| "frameName"
			| "genFrame"
			| "randomVals",
			"both"
		>,
		| Record<string, unknown>
		| { type: string; name?: string; queryName?: string }
		| null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/SemanticDescription.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SemanticDescription: ReactorContract<
		SourceParameters<"input", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/SeparateColumnReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SeparateColumn: ReactorContract<
		SourceParameters<
			"column" | "frame" | "index" | "lName" | "rName",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/SetAdditionalDataTypeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetAdditionalDataType: ReactorContract<
		SourceParameters<"columns" | "format" | "frame", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/SetCurrentFrameReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetCurrentFrame: ReactorContract<
		SourceParameters<"frame", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filtermodel2/SetFilterModelStateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetFilterModelState: ReactorContract<
		SourceParameters<"frame" | "panel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filter/SetFrameFilterReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetFrameFilter: ReactorContract<
		SourceParameters<"frame" | "taskRefresh", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/SortColumnReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SortColumn: ReactorContract<
		SourceParameters<"column" | "frame" | "sort", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/rdbms/SplitColumnsReactor.java
	 * @source Semoss/src/prerna/reactor/frame/py/SplitColumnsReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/SplitColumnsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SplitColumns: ReactorContract<
		| SourceParameters<"columns" | "frame" | "search" | "sep", "both">
		| SourceParameters<
				"columns" | "delimiter" | "frame" | "search",
				"both"
		  >,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/SplitUnpivotReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/SplitUnpivotReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SplitUnpivot: ReactorContract<
		SourceParameters<"columns" | "delimiter" | "frame", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/StringExtractReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/StringExtractReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	StringExtract: ReactorContract<
		SourceParameters<
			"amount" | "column" | "frame" | "newCol" | "option" | "where",
			"both"
		>,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/SummaryStatsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SummaryStats: ReactorContract<
		SourceParameters<"column" | "frame" | "panel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/SwapFrameReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SwapFrame: ReactorContract<
		SourceParameters<"frame", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/convert/SyncGraphToRReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SyncGraphToR: ReactorContract<
		SourceParameters<"frame", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/SynchronizeToRReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SynchronizeToR: ReactorContract<
		SourceParameters<"Wd" | "frame" | "rDataTable", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/TimestampDataReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/TimestampDataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	TimestampData: ReactorContract<
		SourceParameters<"frame" | "newCol" | "time", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/rdbms/ToLowerCaseReactor.java
	 * @source Semoss/src/prerna/reactor/frame/py/ToLowerCaseReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/ToLowerCaseReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ToLowerCase: ReactorContract<
		| SourceParameters<"frame", "both">
		| SourceParameters<"columns" | "frame", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/rdbms/ToPercentReactor.java
	 * @source Semoss/src/prerna/reactor/frame/py/ToPercentReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/ToPercentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ToPercent: ReactorContract<
		SourceParameters<
			"by100" | "column" | "frame" | "newCol" | "sigDigits",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/ToProperCaseReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/ToProperCaseReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ToProperCase: ReactorContract<
		SourceParameters<"columns" | "frame", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/rdbms/ToUpperCaseReactor.java
	 * @source Semoss/src/prerna/reactor/frame/py/ToUpperCaseReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/ToUpperCaseReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ToUpperCase: ReactorContract<
		| SourceParameters<"frame", "both">
		| SourceParameters<"columns" | "frame", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/TransposeReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/TransposeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Transpose: ReactorContract<
		SourceParameters<"frame", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/rdbms/TrimColumnReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	TrimColumn: ReactorContract<
		SourceParameters<"frame", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/TrimColumnsReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/TrimColumnsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	TrimColumns: ReactorContract<
		SourceParameters<"columns" | "frame", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filter/UnfilterFrameReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UnfilterFrame: ReactorContract<
		SourceParameters<"frame" | "taskRefresh", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/UnpivotReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/UnpivotReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Unpivot: ReactorContract<
		SourceParameters<"columns" | "frame", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/UpdateMatchColumnValuesReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/UpdateMatchColumnValuesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdateMatchColumnValues: ReactorContract<
		SourceParameters<
			"column" | "frame" | "matches" | "matchesTable",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/rdbms/UpdateRowValuesReactor.java
	 * @source Semoss/src/prerna/reactor/frame/py/UpdateRowValuesReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/UpdateRowValuesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdateRowValues: ReactorContract<
		| SourceParameters<"frame", "both">
		| SourceParameters<"column" | "frame" | "qs" | "value", "both">,
		string | { type: string; name?: string; queryName?: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/rdbms/UpdateValueReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdateValue: ReactorContract<
		SourceParameters<"frame", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
}
