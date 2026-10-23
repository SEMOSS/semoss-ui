import type { PanelWireOutput } from "./implementation-output-types";

/**
 * Query, frame and task output contracts traced through the backend serializers.
 * @remarks Database cells, user-authored task options and engine configuration
 * retain unknown values. The containing objects are source-verified. These types
 * describe successful JSON output; they do not validate transport responses.
 * @source Semoss/src/prerna/sablecc2/PixelStreamUtility.java
 * @source Semoss/src/prerna/util/gson/GsonUtility.java
 */
export interface NestedPixelOutput<Output = unknown> {
	output: Output;
	operationType: string[];
	additionalOutput?: NestedPixelOutput[];
}

/** @source Semoss/src/prerna/sablecc2/PixelStreamUtility.java */
export interface FrameWireOutput {
	type: "GRID" | "GRAPH" | "R" | "PY" | "NATIVE" | "IGRAPH";
	name?: string;
	queryName?: string;
}

/** @source Semoss/src/prerna/util/gson/NounMetadataAdapter.java */
export interface QueryNounWireOutput {
	pixelType: string;
	class?: string | (string | null)[];
	/** The serializer always wraps noun values in an array. */
	value: unknown[];
	opType: string[];
}

/** @source Semoss/src/prerna/util/gson/QueryColumnSelectorAdapter.java */
export interface QueryColumnWireOutput {
	type: "COLUMN";
	content: {
		table?: string;
		column?: string;
		alias?: string;
		tableAlias?: string;
		dataType?: string;
	};
}

/** @source Semoss/src/prerna/util/gson/QueryFunctionSelectorAdapter.java */
interface QueryFunctionWireOutput {
	type: "FUNCTION";
	content: {
		alias?: string;
		function?: string;
		distinct: boolean;
		colCast?: string;
		dataType?: string;
		innerSelectors: QuerySelectorWireOutput[];
		additionalFunctionParams: (string | number | boolean | null)[][];
	};
}

/** @source Semoss/src/prerna/util/gson/IQuerySelectorAdapterHelper.java */
export type QuerySelectorWireOutput =
	| QueryColumnWireOutput
	| QueryFunctionWireOutput
	| {
			type: "ARITHMETIC";
			content: {
				alias?: string;
				mathExpr?: string;
				left: [QuerySelectorWireOutput];
				right: [QuerySelectorWireOutput];
			};
	  }
	| {
			type: "CONSTANT";
			content: {
				alias?: string;
				constant?:
					| string
					| number
					| boolean
					| SubQueryExpressionWireOutput;
			};
	  }
	| {
			type: "IF_ELSE";
			content: {
				condition?: QueryFilterWireOutput;
				precedent?: QuerySelectorWireOutput;
				antecedent?: QuerySelectorWireOutput;
				alias?: string;
				pixelString?: string;
			};
	  }
	| {
			type: "OPAQUE";
			content: { alias?: string; table?: string; querySyntax?: string };
	  };

/**
 * @source Semoss/src/prerna/util/gson/SimpleQueryFilterAdapter.java
 * @source Semoss/src/prerna/util/gson/AndQueryFilterAdapter.java
 * @source Semoss/src/prerna/util/gson/OrQueryFilterAdapter.java
 * @remarks FunctionQueryFilterAdapter currently emits invalid JSON. No invented
 * FUNCTION object contract is included for that backend serialization failure.
 */
export type QueryFilterWireOutput =
	| {
			type: "SIMPLE";
			content: {
				left?: QueryNounWireOutput;
				comparator?: string;
				right?: QueryNounWireOutput;
			};
	  }
	| { type: "AND" | "OR"; content: QueryFilterWireOutput[] };

/**
 * @source Semoss/src/prerna/util/gson/QueryColumnOrderBySelectorAdapter.java
 * @source Semoss/src/prerna/util/gson/QueryCustomOrderByAdapter.java
 */
export type QuerySortWireOutput =
	| {
			type: "COLUMN";
			content: QueryColumnWireOutput["content"] & { direction: string };
	  }
	| {
			type: "CUSTOM";
			content: {
				columnToSort: QuerySelectorWireOutput;
				values: (string | number | null)[];
			};
	  };

/**
 * @source Semoss/src/prerna/util/gson/BasicRelationshipAdapter.java
 * @source Semoss/src/prerna/util/gson/SubqueryRelationshipAdapter.java
 * @remarks Both adapters emit BASIC, including subquery relationships.
 */
type QueryRelationWireOutput = {
	type: "BASIC";
	content:
		| {
				fromConcept?: string;
				joinType?: string;
				toConcept?: string;
				comparator?: string;
				relationName?: string;
		  }
		| {
				queryAlias?: string;
				joinType?: string;
				qs?: SelectQueryStructWireOutput;
				joinOnDetails: string[][];
		  };
};

interface QueryStructClauses {
	qsType: string;
	engineName?: string;
	frameName?: string;
	frameType?: string;
	selectors?: QuerySelectorWireOutput[];
	explicitFilters?: QueryFilterWireOutput[];
	implicitFilters?: QueryFilterWireOutput[];
	havingFilters?: QueryFilterWireOutput[];
	relations?: QueryRelationWireOutput[];
}

/** @source Semoss/src/prerna/util/gson/SelectQueryStructAdapter.java */
export interface SelectQueryStructWireOutput extends QueryStructClauses {
	engineId?: string;
	isDistinct: boolean;
	overrideImplicit: boolean;
	limit: number;
	offset: number;
	queryAll: boolean;
	customFrom?: string;
	customFromAliasName?: string;
	groups?: QuerySelectorWireOutput[];
	orders?: QuerySortWireOutput[];
	withPanels?: string[];
}

/** @source Semoss/src/prerna/util/gson/UpdateQueryStructAdapter.java */
export interface UpdateQueryStructWireOutput extends QueryStructClauses {
	overrideImplicit: boolean;
	updateValues?: unknown[];
}

/**
 * @source Semoss/src/prerna/util/gson/HardSelectQueryStructAdapter.java
 * @source Semoss/src/prerna/util/gson/TemporalEngineHardSelectQueryStructAdapter.java
 */
export interface HardQueryStructWireOutput {
	qsType: string;
	engineName?: string;
	frameName?: string;
	frameType?: string;
	query?: string;
	config?: Record<string, unknown>;
}

/** @source Semoss/src/prerna/util/gson/CsvQueryStructAdapter.java */
interface CsvQueryStructWireOutput extends FileQueryStructWireOutput {
	/** Java char is written with JsonWriter.value(long): comma is 44. */
	delimiter: number;
}

/**
 * @source Semoss/src/prerna/util/gson/ExcelQueryStructAdapter.java
 * @source Semoss/src/prerna/util/gson/ParquetQueryStructAdapter.java
 */
interface FileQueryStructWireOutput extends SelectQueryStructWireOutput {
	filePath?: string;
	newHeaderNames: Record<string, string>;
	columnTypes: Record<string, string>;
	additionalTypes: Record<string, string>;
	sheetName?: string;
	sheetRange?: string;
	excelPassword?: string;
}

/**
 * ConfigSelectQueryStruct has no registered Gson adapter and uses reflection.
 * @source Semoss/src/prerna/query/querystruct/ConfigSelectQueryStruct.java
 * @source Semoss/src/prerna/query/querystruct/AbstractQueryStruct.java
 * @source Semoss/src/prerna/query/querystruct/SelectQueryStruct.java
 */
interface ConfigQueryStructWireOutput {
	config?: Record<string, unknown>;
	qsType: string;
	isDistinct: boolean;
	orderByOperations: QuerySortWireOutput[];
	groupBy: QuerySelectorWireOutput[];
	limit: number;
	offset: number;
	selectors: QuerySelectorWireOutput[];
	explicitFilters: QueryFilterWireOutput[];
	implicitFilters: QueryFilterWireOutput[];
	havingFilters: QueryFilterWireOutput[];
	relationsSet: QueryRelationWireOutput[];
	overrideImplicit: boolean;
	customFrom?: string;
	customFromAliasName?: string;
	frameName?: string;
	frameType?: string;
	engineId?: string;
	bigDataEngine?: boolean;
	panelIdList: string[];
	queryAll: boolean;
	aliasHash: Record<string, QueryStructWireOutput>;
	randomHash: Record<string, unknown>;
	/** Legacy expression trees depend on parser-created node classes. */
	joins: unknown[];
	nselectors: unknown[];
	ngroupBy: unknown[];
	norderBy: unknown[];
	ignoreFilters: boolean;
}

/**
 * @source Semoss/src/prerna/reactor/qs/AbstractQueryStructReactor.java
 * @remarks Inherited named qs input can retain an update, raw or file subtype.
 */
export type QueryStructWireOutput =
	| SelectQueryStructWireOutput
	| UpdateQueryStructWireOutput
	| HardQueryStructWireOutput
	| FileQueryStructWireOutput
	| CsvQueryStructWireOutput
	| ConfigQueryStructWireOutput;

/** @source Semoss/src/prerna/util/gson/SubQueryExpressionAdapter.java */
interface SubQueryExpressionWireOutput {
	qsType?: string;
	qs?: QueryStructWireOutput;
}

/** @source Semoss/src/prerna/query/querystruct/filters/GenRowFilters.java */
export interface FormattedFilterOutput {
	filterObj: SimpleFormattedFilterOutput;
	filterStr: string;
	pixelString: string;
}

type SimpleFormattedFilterOutput =
	| {
			filterType: "SIMPLE";
			comparator?: string;
			left: { type: string; value?: unknown };
			right: { type: string; value?: unknown };
	  }
	| { filterType: "AND" | "OR"; value: SimpleFormattedFilterOutput[] }
	| { filterType: "FUNCTION"; function: string[] };

/** @source Semoss/src/prerna/sablecc2/PixelStreamUtility.java */
export interface TaskReferenceOutput {
	taskId: string;
}

/**
 * @source Semoss/src/prerna/sablecc2/om/task/AbstractTask.java
 * @remarks Headers may be supplied by a formatter or task transformation. Known
 * built-in fields remain available alongside task-specific metadata.
 */
interface TaskHeaderOutput {
	header?: string;
	alias?: string;
	type?: string;
	derived?: boolean;
	additionalDataType?: string;
	calculatedBy?: string;
	math?: string;
	[key: string]: unknown;
}

/**
 * @source Semoss/src/prerna/sablecc2/PixelStreamUtility.java
 * @source Semoss/src/prerna/sablecc2/om/task/AbstractTask.java
 */
export interface TaskCollectionOutput<Data = unknown> {
	data: Data;
	taskId: string;
	headerInfo: TaskHeaderOutput[] | null;
	numCollected: number;
	sources: { type?: string; name?: string }[] | null;
	format?: { type?: string; options?: Record<string, unknown> };
	taskOptions?: Record<string, unknown>;
	sortInfo?: Record<string, unknown>[] | null;
	filterInfo?: Record<string, unknown>[] | null;
	numRows?: number;
}

/** @source Semoss/src/prerna/sablecc2/PixelStreamUtility.java */
export interface TableTaskData {
	values: unknown[][];
	headers: (string | null)[] | null;
	rawHeaders: (string | null)[] | null;
}

/** @source Semoss/src/prerna/reactor/task/constant/ConstantTaskCreationHelper.java */
export interface ConstantTableTaskData {
	values: unknown[][];
	headers: (string | null)[];
}

/** @source Semoss/src/prerna/reactor/task/CollectMetaReactor.java */
interface CollectedTaskMetadataOutput {
	taskId?: string;
	headerInfo?: TaskHeaderOutput[];
	sortInfo?: Record<string, unknown>[];
	filterInfo?: Record<string, unknown>[];
	/** CollectMeta serializes the TaskOptions object, not just its options map. */
	taskOptions?: {
		options?: Record<string, unknown>;
		ornament: boolean;
		collectStore?: Record<string, unknown>;
	};
}

/** @source Semoss/src/prerna/query/querystruct/filters/BooleanValMetadata.java */
interface FilterMutationOutput {
	type: "FRAME" | "PANEL";
	name?: string;
	filterVal: boolean;
}

/** @source Semoss/src/prerna/reactor/frame/filtermodel/FrameFilterModelReactor.java */
interface FrameFilterModelOutput {
	column: string;
	limit: number;
	offset: number;
	filterWord?: string;
	unfilterValues: unknown[];
	filterValues: unknown[];
	minMax?: FilterRangeOutput;
}

/** @source Semoss/src/prerna/reactor/frame/filtermodel2/FilterModelStateReactor.java */
interface FilterModelStateOutput {
	column: string;
	limit: number;
	offset: number;
	filterWord?: string;
	options: unknown[];
	totalCount: number;
	selectedValues: unknown[];
	selectedCount: number;
}

/** Numeric/date cells preserve their query driver's actual JSON representation. */
interface FilterRangeOutput {
	absMin?: unknown;
	absMax?: unknown;
	min?: unknown;
	max?: unknown;
}

/**
 * @source Semoss/src/prerna/ds/shared/AbstractTableDataFrame.java
 * @source Semoss/src/prerna/ds/OwlTemporalEngineMeta.java
 */
interface FrameHeadersOutput {
	name: string;
	type: FrameWireOutput["type"];
	headerInfo: {
		headers: {
			header: string;
			isPrim: string | boolean;
			dataType: string;
			adtlType: string;
			qsName: string | Record<string, string[]>;
			parentNode: string;
			alias: string;
			displayName: string;
			isDerived: string | boolean;
			isFiltered: boolean;
		}[];
		joins: { fromNode: string; toNode: string; joinType: string }[];
	};
}

/** @source Semoss/src/prerna/ds/OwlTemporalEngineMeta.java */
interface FrameMetamodelOutput {
	nodes: { conceptualName: string; propSet: string[] }[];
	edges: { source: string; target: string; relation: string }[];
	dataTypes: Record<string, string>;
	additionalDataTypes: Record<string, string>;
}

/** @source Semoss/src/prerna/reactor/qs/AbstractSqlQueryReactor.java */
interface SqlStatementOutput {
	statement: number;
	query: string;
	route: "READ" | "LOCKING_READ" | "WRITE";
	status: "SUCCESS" | "ERROR" | "SKIPPED" | "ROLLED_BACK";
	type: "TABLE" | "MESSAGE" | "ERROR" | "SKIPPED";
	message?: string;
	output?: { headers?: (string | null)[]; values: unknown[][] };
	timeToRun: number;
	updateCount?: number;
	sqlState?: string;
	hasMoreRows?: boolean;
}

type SqlQueryOutput =
	| boolean
	| TaskCollectionOutput<TableTaskData>
	| SqlStatementOutput[]
	| {
			outcome: "COMMITTED" | "ROLLED_BACK" | "UNKNOWN";
			message: string;
			statements: SqlStatementOutput[];
	  };

/** @source Semoss/src/prerna/reactor/frame/r/analytics/RunClassificationReactor.java */
interface ClassificationTreeOutput {
	[label: string]: ClassificationTreeOutput;
}

interface ClassificationOutput {
	name: string;
	layout: "Dendrogram";
	panelId?: string;
	children: ClassificationTreeOutput;
	stats?: ({ Accuracy?: string } | { "Relevant Predictors": string })[];
}

/** @source Semoss/src/prerna/reactor/frame/r/analytics/RunRandomForestReactor.java */
interface RandomForestSummaryOutput {
	predictionError: (number | null)[];
	matrix?: unknown[][];
	headers?: string[];
	tree_options: [number | null, number | null];
	filename: string;
}

/** @source Semoss/src/prerna/reactor/frame/gaas/NLPQuery3Reactor.java */
interface NaturalLanguageQueryOutput {
	Query: string;
	SAMPLE?: string;
	frameType?: FrameWireOutput["type"];
	frame?: string;
	COMMAND?: string;
	COLUMN_CHANGE?: string;
}

/**
 * @source Semoss/src/prerna/reactor/export/CollectGGPlotReactor.java
 * @source Semoss/src/prerna/reactor/export/CollectSeabornReactor.java
 * @source Semoss/src/prerna/reactor/export/CollectVizNetworkReactor.java
 */
interface PlotTaskData {
	headers: string[];
	rawHeaders: string[];
	values?: (string | null)[];
	format?: string;
	ggplot?: string;
	splot?: string;
	visNetwork?: string;
}

/** @source Semoss/src/prerna/reactor/frame/py/CollectPivotReactor.java */
interface PivotTaskData {
	headers: string[];
	rawHeaders: string[];
	values: (string | null)[];
	pivotData: {
		rowGroups: string[];
		columns: string[];
		values: { alias: string; math: string }[];
		sections?: string[];
		optional?: string[];
	};
}

/** @source Semoss/src/prerna/ds/export/graph/TinkerFrameGraphExporter.java */
interface GraphTaskData {
	nodes: {
		uri: string;
		VERTEX_TYPE_PROPERTY?: string;
		VERTEX_LABEL_PROPERTY?: unknown;
		VERTEX_COLOR_PROPERTY: string;
		propHash: Record<string, unknown>;
	}[];
	edges: {
		uri: string;
		source: string;
		target: string;
		propHash: Record<string, unknown>;
	}[];
	graphMeta: Record<string, number>;
}

/** @source Semoss/src/prerna/reactor/export/CollectGraphReactor.java */
interface CollectedGraphOutput {
	data: GraphTaskData;
	format: { type: "GRAPH" };
	numCollected: "-1";
	headerInfo: TaskHeaderOutput[];
	taskOptions: Record<string, unknown>;
	sortInfo?: Record<string, unknown>[];
	filterInfo?: Record<string, unknown>[];
	taskId?: string;
	sources: { name?: string; type: "FRAME" }[];
}

/** Verified output overlay; parameters remain owned by the synced catalog. */
export interface QueryOutputTypes {
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/APIReactor.java
	 */
	API: ConfigQueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filtermodel2/AddFilterModelStateReactor.java
	 */
	AddFilterModelState: FilterMutationOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filter/AddFrameFilterReactor.java
	 */
	AddFrameFilter: FilterMutationOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/AddOpenAIKeyReactor.java
	 */
	AddOpenAIKey: { openai_defined: boolean };
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/AggregateAllReactor.java
	 */
	AggregateAll: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/AsReactor.java
	 */
	As: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/export/AsTaskReactor.java
	 */
	AsTask: TaskCollectionOutput<{
		headers: ["constant"];
		values: [[unknown]];
	}>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/filter/BetweenReactor.java
	 */
	Between: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/CacheNativeFrame.java
	 */
	CacheNativeFrame: FrameWireOutput | string;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/CastReactor.java
	 */
	Cast: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/ChangeOptionReactor.java
	 */
	ChangeOption: SelectQueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/ChangeQueryReactor.java
	 */
	ChangeQuery: SelectQueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/CoalesceReactor.java
	 */
	Coalesce: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/export/CollectReactor.java
	 */
	Collect: TaskCollectionOutput;
	/**
	 * @source Semoss/src/prerna/reactor/export/CollectAllReactor.java
	 */
	CollectAll: TaskCollectionOutput;
	/**
	 * @source Semoss/src/prerna/reactor/export/CollectGGPlotReactor.java
	 */
	CollectGGPlot: TaskCollectionOutput<PlotTaskData>;
	/**
	 * @source Semoss/src/prerna/reactor/export/CollectGraphReactor.java
	 */
	CollectGraph: CollectedGraphOutput;
	/**
	 * @source Semoss/src/prerna/reactor/task/CollectMetaReactor.java
	 */
	CollectMeta: CollectedTaskMetadataOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/CollectNewColReactor.java
	 */
	CollectNewCol: FrameWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/export/CollectPivotReactor.java
	 * @source Semoss/src/prerna/reactor/frame/py/CollectPivotReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/CollectPivotReactor.java
	 */
	CollectPivot: TaskCollectionOutput<PivotTaskData>;
	/**
	 * @source Semoss/src/prerna/reactor/export/CollectSeabornReactor.java
	 */
	CollectSeaborn: TaskCollectionOutput<PlotTaskData>;
	/**
	 * @source Semoss/src/prerna/reactor/export/CollectVizNetworkReactor.java
	 */
	CollectVizNetwork: TaskCollectionOutput<PlotTaskData>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/ColumnCountReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/ColumnCountReactor.java
	 */
	ColumnCount: TaskCollectionOutput<ConstantTableTaskData> | string;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/ConvertRunPixelTaskDataToQueryStructReactor.java
	 */
	ConvertRunPixelTaskDataToQueryStruct: CsvQueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/CountReactor.java
	 */
	Count: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/DatabaseReactor.java
	 */
	Database: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/DateFormatReactor.java
	 */
	DateFormat: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/DayNameReactor.java
	 */
	DayName: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filter/DeleteFrameFilterReactor.java
	 */
	DeleteFrameFilter: FilterMutationOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/DescriptiveStatsReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/DescriptiveStatsReactor.java
	 */
	DescriptiveStats: TaskCollectionOutput<ConstantTableTaskData>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/DirectJdbcConnectionReactor.java
	 */
	DirectJDBCConnection: HardQueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/DirectJdbcConnectionReactor.java
	 */
	DirectJdbcConnection: HardQueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/DistinctReactor.java
	 */
	Distinct: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/DropBoxFileRetrieverReactor.java
	 */
	DropBoxFileRetriever: CsvQueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/DropBoxListFilesReactor.java
	 */
	DropBoxListFiles: { name?: string; path?: string }[];
	/**
	 * @source Semoss/src/prerna/reactor/export/EmptyDataReactor.java
	 */
	EmptyData: boolean;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/FileReadReactor.java
	 */
	FileRead: FileQueryStructWireOutput | CsvQueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/FileReferenceReactor.java
	 */
	FileReference: { filePath?: string; space?: string };
	/**
	 * @source Semoss/src/prerna/reactor/frame/gaas/ner/FillFormReactor.java
	 */
	FillForm: Record<string, string>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filtermodel2/FilterModelStateReactor.java
	 */
	FilterModelState: FilterModelStateOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/FrameReactor.java
	 */
	Frame: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filter/FrameFilterEmptyValuesReactor.java
	 */
	FrameFilterEmptyValues: FilterMutationOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filtermodel/FrameFilterModelReactor.java
	 */
	FrameFilterModel: FrameFilterModelOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filtermodel/FrameFilterModelFilteredValuesReactor.java
	 */
	FrameFilterModelFilteredValues: Omit<
		FrameFilterModelOutput,
		"unfilterValues"
	>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filtermodel/FrameFilterModelNumericRangeReactor.java
	 */
	FrameFilterModelNumericRange: {
		column: string;
		minMax?: FilterRangeOutput;
	};
	/**
	 * @source Semoss/src/prerna/reactor/frame/filtermodel/FrameFilterModelVisibleValuesReactor.java
	 */
	FrameFilterModelVisibleValues: Omit<FrameFilterModelOutput, "filterValues">;
	/**
	 * @source Semoss/src/prerna/reactor/frame/FrameHeadersReactor.java
	 */
	FrameHeaders: FrameHeadersOutput | Record<string, never>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/sql/GenerateQueryReactor.java
	 */
	GenerateQuery: { query?: string };
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/GenericSelectorFunctionReactor.java
	 */
	GenericSelectorFunction: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filtermodel/GetFrameFilterRange.java
	 */
	GetFrameFilterRange: { column: string; minMax?: FilterRangeOutput };
	/**
	 * @source Semoss/src/prerna/reactor/frame/filtermodel/GetFrameFilterStateReactor.java
	 */
	GetFrameFilterState: FilterModelStateOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filter/GetFrameFiltersReactor.java
	 */
	GetFrameFilters: FormattedFilterOutput[];
	/**
	 * @source Semoss/src/prerna/reactor/frame/filter/GetFrameFiltersQSReactor.java
	 */
	GetFrameFiltersQS: SelectQueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/GetFrameMetamodelReactor.java
	 */
	GetFrameMetamodel: FrameMetamodelOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/GetFrameTableStructureReactor.java
	 */
	GetFrameTableStructure: [table: string, column: string, type: string][];
	/**
	 * @source Semoss/src/prerna/reactor/frame/filtermodel/GetPanelFilterStateReactor.java
	 */
	GetPanelFilterState: FilterModelStateOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/sql/GetParamValuesReactor.java
	 */
	GetParamValues: {
		query?: string;
		params?: Record<string, unknown> | string;
		[key: string]: Record<string, unknown> | string | undefined;
	};
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/analytics/GetRFResultsReactor.java
	 */
	GetRFResults: TaskCollectionOutput<ConstantTableTaskData>;
	/**
	 * @source Semoss/src/prerna/reactor/task/GetTaskHeadersReactor.java
	 */
	GetTaskHeaders: (string | null)[];
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/GoogleFileRetrieverReactor.java
	 */
	GoogleFileRetriever: CsvQueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/GoogleListFilesReactor.java
	 */
	GoogleListFiles: { name?: string; id?: string; type?: string }[];
	/**
	 * @source Semoss/src/prerna/reactor/export/GrabScalarElementReactor.java
	 */
	GrabScalarElement: unknown;
	/**
	 * @source Semoss/src/prerna/reactor/qs/GroupReactor.java
	 */
	Group: SelectQueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/GroupReactor.java
	 */
	GroupBy: SelectQueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/GroupConcatReactor.java
	 */
	GroupConcat: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/filter/HavingReactor.java
	 */
	Having: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/HistogramReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/HistogramReactor.java
	 */
	Histogram: TaskCollectionOutput<ConstantTableTaskData>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/filter/IfQueryFilterComponentAnd.java
	 */
	IfQueryFilterComponentAnd: QueryFilterWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/filter/IfQueryFilterComponentOr.java
	 */
	IfQueryFilterComponentOr: QueryFilterWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/ImplicitFilterOverrideReactor.java
	 */
	ImplicitFilterOverride: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/export/IterateReactor.java
	 */
	Iterate: TaskReferenceOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/JdbcSourceReactor.java
	 */
	JdbcSource: HardQueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/LimitReactor.java
	 */
	Limit: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/LookupMatchReactor.java
	 */
	LookupMatch: Record<string, Record<string, unknown>[]>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/LowerReactor.java
	 */
	Lower: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/MonthNameReactor.java
	 */
	MonthName: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/gaas/MooseReactor.java
	 */
	Moose:
		| Record<string, string>
		| NestedPixelOutput<NaturalLanguageQueryOutput | string>[];
	/**
	 * @source Semoss/src/prerna/reactor/frame/gaas/NLPQuery3Reactor.java
	 */
	NLPQuery3: NestedPixelOutput<NaturalLanguageQueryOutput | string>[];
	/**
	 * @source Semoss/src/prerna/reactor/frame/graph/r/NodeDetailsReactor.java
	 */
	NodeDetails: TaskCollectionOutput<ConstantTableTaskData>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/OffsetReactor.java
	 */
	Offset: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/SortReactor.java
	 */
	Order: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/PColReactor.java
	 */
	PCol: QueryColumnWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/PSelectReactor.java
	 */
	PSelect: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/sql/ParseSQL2Wrapper.java
	 */
	ParseSQL2Wrapper: {
		query: string;
		generated_query: string;
		params: Record<string, unknown>;
		ID: string;
	};
	/**
	 * @source Semoss/src/prerna/reactor/qs/PragmaReactor.java
	 */
	Pragma: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/analytics/PyNumericalCorrelationReactor.java
	 */
	PyNumericalCorrelation: TaskCollectionOutput<ConstantTableTaskData>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/py/PyPlotReactor.java
	 */
	PyPlot: NestedPixelOutput<
		PanelWireOutput | TaskCollectionOutput<PlotTaskData> | string
	>[];
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/QuarterReactor.java
	 */
	Quarter: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/QueryReactor.java
	 */
	Query: HardQueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/QueryAllReactor.java
	 */
	QueryAll: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/filter/QueryFilterComponentAnd.java
	 */
	QueryFilterComponentAnd: QueryFilterWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/filter/QueryFilterComponentOr.java
	 */
	QueryFilterComponentOr: QueryFilterWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/filter/QueryFilterComponentSimple.java
	 */
	QueryFilterComponentSimple: QueryFilterWireOutput | null;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/QuerySelectorExpressionAssimilator.java
	 */
	QuerySelectorExpressionAssimilator: SelectQueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/RDFFileSourceReactor.java
	 */
	RDFFileSource: HardQueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/task/RefreshAllPanelTasksReactor.java
	 */
	RefreshAllPanelTasks: NestedPixelOutput<TaskCollectionOutput | string>[];
	/**
	 * @source Semoss/src/prerna/reactor/task/RefreshPanelTaskReactor.java
	 */
	RefreshPanelTask: NestedPixelOutput<TaskCollectionOutput | string>[];
	/**
	 * @source Semoss/src/prerna/reactor/qs/filter/RegexFilterReactor.java
	 */
	RegexFilter: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filter/RemoveFrameFilterReactor.java
	 */
	RemoveFrameFilter: FilterMutationOutput;
	/**
	 * @source Semoss/src/prerna/reactor/task/RemoveLayerReactor.java
	 */
	RemoveLayer: { panel?: string; layer?: string };
	/**
	 * @source Semoss/src/prerna/reactor/task/RemoveTaskReactor.java
	 */
	RemoveTask: TaskReferenceOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filter/ReplaceFrameFilterReactor.java
	 */
	ReplaceFrameFilter: FilterMutationOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/sql/ReplaceParamReactor.java
	 */
	ReplaceParam: {
		query: string;
		generated_query: string;
		params: Record<string, unknown>;
	};
	/**
	 * @source Semoss/src/prerna/reactor/task/RefreshPanelTaskReactor.java
	 */
	ResetAll: NestedPixelOutput<TaskCollectionOutput | string>[];
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/analytics/RunAssociatedLearningReactor.java
	 */
	RunAssociatedLearning: TaskCollectionOutput<ConstantTableTaskData>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/analytics/RunClassificationReactor.java
	 */
	RunClassification: ClassificationOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/analytics/RunNumericalColumnSimilarityReactor.java
	 */
	RunNumericalColumnSimilarity: TaskCollectionOutput<ConstantTableTaskData>;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/analytics/RunRandomForestReactor.java
	 */
	RunRandomForest:
		| TaskCollectionOutput<ConstantTableTaskData>
		| NestedPixelOutput<
				| TaskCollectionOutput<ConstantTableTaskData>
				| RandomForestSummaryOutput
		  >[]
		| null;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/SelectTableReactor.java
	 */
	SelectTable: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/SemanticBlendingReactor.java
	 */
	SemanticBlending:
		| FrameWireOutput
		| { headers: string[]; data: (string | number | null)[][] };
	/**
	 * @source Semoss/src/prerna/reactor/frame/SetAdditionalDataTypeReactor.java
	 */
	SetAdditionalDataType: FrameHeadersOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filtermodel2/SetFilterModelStateReactor.java
	 */
	SetFilterModelState: FilterMutationOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filter/SetFrameFilterReactor.java
	 */
	SetFrameFilter: FilterMutationOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/SharePointWebDavPullReactor.java
	 */
	SharePointWebDavPull: CsvQueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/SortReactor.java
	 */
	Sort: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/SortBy.java
	 */
	SortBy: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/SparqlQueryReactor.java
	 */
	SparqlQuery: TaskCollectionOutput<TableTaskData>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/SparqlQueryBase64Reactor.java
	 */
	SparqlQueryBase64: TaskCollectionOutput<TableTaskData>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/SqlQueryReactor.java
	 */
	SqlQuery: SqlQueryOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/SqlQueryBase64Reactor.java
	 */
	SqlQueryBase64: SqlQueryOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/StandardDeviationReactor.java
	 */
	StandardDeviation: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/SubQueryExpressionReactor.java
	 */
	SubQueryExpression: SubQueryExpressionWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/SubqueryJoinReactor.java
	 */
	SubqueryJoin: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/SubstringReactor.java
	 */
	Substring: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/r/SummaryStatsReactor.java
	 */
	SummaryStats: TaskCollectionOutput<ConstantTableTaskData>;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/TextInputReactor.java
	 */
	TextInput: CsvQueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/source/URLSourceReactor.java
	 */
	URLSource: CsvQueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/frame/filter/UnfilterFrameReactor.java
	 */
	UnfilterFrame: FilterMutationOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/UniqueAverageReactor.java
	 */
	UniqueAverage: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/UniqueCountReactor.java
	 */
	UniqueCount: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/UniqueGroupConcatReactor.java
	 */
	UniqueGroupConcat: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/UniqueAverageReactor.java
	 */
	UniqueMean: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/UniqueSumReactor.java
	 */
	UniqueSum: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/WeekReactor.java
	 */
	Week: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/WithReactor.java
	 */
	With: QueryStructWireOutput;
	/**
	 * @source Semoss/src/prerna/reactor/qs/selectors/YearReactor.java
	 */
	Year: QueryStructWireOutput;
}
