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

export interface QsReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/APIReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	API: ReactorContract<
		SourceParameters<
			| "alias"
			| "aliasFile"
			| "aliasMap"
			| "api_type"
			| "headersMap"
			| "qs",
			"named"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/AggregateAllReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AggregateAll: ReactorContract<
		SourceParameters<"ignoreCols" | "math" | "qs", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/AsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	As: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/filter/BetweenReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Between: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/CastReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Cast: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/ChangeOptionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ChangeOption: ReactorContract<
		SourceParameters<"qs", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/ChangeQueryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ChangeQuery: ReactorContract<
		SourceParameters<"qs", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/CoalesceReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Coalesce: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/ConvertFileReferenceReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ConvertFileReference: ReactorContract<
		SourceParameters<"fileKey", "both">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/ConvertRunPixelTaskDataToQueryStructReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ConvertRunPixelTaskDataToQueryStruct: ReactorContract<
		SourceParameters<
			"deleteAfterInsightClose" | "fileName" | "index" | "qs" | "value",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/CountReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Count: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/DatabaseReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Database: ReactorContract<
		SourceParameters<"database" | "qs", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/DateFormatReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DateFormat: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/DayNameReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DayName: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/DirectJdbcConnectionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DirectJDBCConnection: ReactorContract<
		SourceParameters<"conDetails" | "qs" | "query", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/DirectJdbcConnectionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DirectJdbcConnection: ReactorContract<
		SourceParameters<"conDetails" | "qs" | "query", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/DistinctReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Distinct: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/DropBoxFileRetrieverReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DropBoxFileRetriever: ReactorContract<
		SourceParameters<"path" | "qs", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/DropBoxListFilesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DropBoxListFiles: ReactorContract<
		SourceParameters<never, "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/ExecQueryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExecQuery: ReactorContract<
		SourceParameters<"commit" | "customSuccessMessage" | "qs", "named">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/FileReadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FileRead: ReactorContract<
		SourceParameters<
			| "additionalDataTypes"
			| "dataTypeMap"
			| "delimiter"
			| "filePath"
			| "newHeaders"
			| "password"
			| "qs"
			| "sheetName"
			| "sheetRange"
			| "space",
			"named"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/FileReferenceReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FileReference: ReactorContract<
		SourceParameters<"filePath" | "space", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/filter/FilterReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Filter: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/FrameReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Frame: ReactorContract<
		SourceParameters<"frame" | "qs", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/GenericSelectorFunctionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GenericSelectorFunction: ReactorContract<
		SourceParameters<"columns" | "qs", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/GoogleFileRetrieverReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleFileRetriever: ReactorContract<
		SourceParameters<"id" | "qs" | "type", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/GoogleListFilesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleListFiles: ReactorContract<
		SourceParameters<never, "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/GroupReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Group: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/GroupReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GroupBy: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/GroupConcatReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GroupConcat: ReactorContract<
		SourceParameters<"qs", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/filter/HavingReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Having: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/filter/IfQueryFilterComponentAnd.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	IfQueryFilterComponentAnd: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/filter/IfQueryFilterComponentOr.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	IfQueryFilterComponentOr: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/ImplicitFilterOverrideReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ImplicitFilterOverride: ReactorContract<
		SourceParameters<"qs", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/InsertReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Insert: ReactorContract<
		SourceParameters<
			"commit" | "customSuccessMessage" | "into" | "qs" | "values",
			"named"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/IsExcelPasswordProtectedReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	IsExcelPasswordProtected: ReactorContract<
		SourceParameters<"filePath" | "space", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/JdbcSourceReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JdbcSource: ReactorContract<
		SourceParameters<"conDetails" | "qs", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/JoinReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Join: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/LimitReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Limit: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/LowerReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Lower: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/MonthNameReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MonthName: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/OffsetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Offset: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/SortReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Order: ReactorContract<
		SourceParameters<"columns" | "qs" | "sort", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/PColReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PCol: ReactorContract<SourceParameters<"column", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/PSelectReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PSelect: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/PragmaReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Pragma: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/QuarterReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Quarter: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/QueryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Query: ReactorContract<
		SourceParameters<"qs" | "query", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/QueryAllReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	QueryAll: ReactorContract<SourceParameters<"qs", "named">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/filter/QueryFilterComponentAnd.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	QueryFilterComponentAnd: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/filter/QueryFilterComponentOr.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	QueryFilterComponentOr: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/filter/QueryFilterComponentSimple.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	QueryFilterComponentSimple: ReactorContract<
		SourceParameters<"filters", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/QuerySelectorExpressionAssimilator.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	QuerySelectorExpressionAssimilator: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/RDFFileSourceReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RDFFileSource: ReactorContract<
		SourceParameters<
			"baseUri" | "filePath" | "qs" | "query" | "rdfType",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/filter/RegexFilterReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RegexFilter: ReactorContract<
		SourceParameters<"qs", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/SelectReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Select: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/SelectTableReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SelectTable: ReactorContract<
		SourceParameters<"qs" | "table", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/SharePointWebDavPullReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SharePointWebDavPull: ReactorContract<
		SourceParameters<"path" | "qs", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/SortReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Sort: ReactorContract<
		SourceParameters<"columns" | "qs" | "sort", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/SortBy.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SortBy: ReactorContract<
		SourceParameters<"column" | "qs" | "values", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/SparqlQueryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SparqlQuery: ReactorContract<
		SourceParameters<
			"database" | "limit" | "query" | "raw",
			"both",
			["query", "database"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/SparqlQueryBase64Reactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SparqlQueryBase64: ReactorContract<
		SourceParameters<
			"database" | "limit" | "query" | "raw",
			"both",
			["query", "database"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/SqlQueryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SqlQuery: ReactorContract<
		SourceParameters<
			| "commit"
			| "database"
			| "limit"
			| "query"
			| "timeout"
			| "transaction",
			"both",
			["query", "database"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/SqlQueryBase64Reactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SqlQueryBase64: ReactorContract<
		SourceParameters<
			| "commit"
			| "database"
			| "limit"
			| "query"
			| "timeout"
			| "transaction",
			"both",
			["query", "database"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/StandardDeviationReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	StandardDeviation: ReactorContract<
		SourceParameters<"qs", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/SubQueryExpressionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SubQueryExpression: ReactorContract<
		SourceParameters<"qs", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/SubqueryJoinReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SubqueryJoin: ReactorContract<
		SourceParameters<
			"jType" | "on" | "qs" | "subQs" | "subQsAlias",
			"named"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/SubstringReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Substring: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/TextInputReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	TextInput: ReactorContract<
		SourceParameters<"dataTypeMap" | "delim" | "fileData" | "qs", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/URLSourceReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	URLSource: ReactorContract<
		SourceParameters<"delimiter" | "qs" | "url", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/UniqueAverageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UniqueAverage: ReactorContract<
		SourceParameters<"qs", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/UniqueCountReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UniqueCount: ReactorContract<
		SourceParameters<"qs", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/UniqueGroupConcatReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UniqueGroupConcat: ReactorContract<
		SourceParameters<"qs", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/UniqueAverageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UniqueMean: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/UniqueSumReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UniqueSum: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/WeekReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Week: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/WithReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	With: ReactorContract<
		SourceParameters<"panel" | "qs", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/YearReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Year: ReactorContract<SourceParameters<"qs", "both">, unknown, false>;
}
