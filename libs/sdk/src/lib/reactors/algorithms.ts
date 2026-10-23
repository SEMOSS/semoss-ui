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

export interface AlgorithmsReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/CreateNLPVizReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateNLPViz: ReactorContract<
		SourceParameters<
			| "columns"
			| "database"
			| "frame"
			| "panel"
			| "sortPixel"
			| "vizSelection",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/xray/GenerateXRayHashingReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GenerateXRayHashing: ReactorContract<
		SourceParameters<
			| "config"
			| "database"
			| "filePath"
			| "override"
			| "rowComparison"
			| "space",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/xray/GenerateXRayHashingFrameReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GenerateXRayHashingFrame: ReactorContract<
		SourceParameters<
			| "config"
			| "filePath"
			| "frame"
			| "override"
			| "rowComparison"
			| "space",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/xray/GenerateXRayMatchingReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GenerateXRayMatching: ReactorContract<
		SourceParameters<
			| "candidate"
			| "config"
			| "database"
			| "filePath"
			| "matchSameDb"
			| "override"
			| "rowComparison"
			| "similarity"
			| "space",
			"named"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/xray/GetCSVSchemaReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetCSVSchema: ReactorContract<
		SourceParameters<"delimiter" | "filePath", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/dataquality/GetDQRulesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetDQRules: ReactorContract<
		SourceParameters<never, "named">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/xray/GetLocalSchemaReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetLocalSchema: ReactorContract<
		SourceParameters<"database", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/GetNLPVizOptionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetNLPVizOptions: ReactorContract<
		SourceParameters<"columns" | "database" | "frame", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/xray/GetXLSchemaReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetXLSchema: ReactorContract<
		SourceParameters<"filePath" | "sheetName", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/xray/GetXrayConfigFileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetXrayConfigFile: ReactorContract<
		SourceParameters<"fileName", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/xray/GetXrayConfigListReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetXrayConfigList: ReactorContract<
		SourceParameters<never, "named">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/JsonLogicReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JsonLogic: ReactorContract<
		SourceParameters<"data" | "rule", "both", ["rule"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/LoadNLPSearchReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	LoadNLPSearch: ReactorContract<
		SourceParameters<never, "positional">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/NLPInstanceCacheReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	NLPInstanceCache: ReactorContract<
		SourceParameters<
			"columns" | "database" | "table" | "updateExistingValues",
			"both"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/NLSQueryHelperReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	NLSQueryHelper: ReactorContract<
		SourceParameters<
			"database" | "frame" | "global" | "helpOn" | "query",
			"both"
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/NaturalLanguageSearchReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	NaturalLanguageSearch: ReactorContract<
		SourceParameters<
			"database" | "frame" | "global" | "panel" | "query",
			"both"
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/CreateNLPVizReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PredictViz: ReactorContract<
		SourceParameters<
			| "columns"
			| "database"
			| "frame"
			| "panel"
			| "sortPixel"
			| "vizSelection",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/RatioReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Ratio: ReactorContract<
		SourceParameters<
			"attributes" | "frame" | "instance" | "weight",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/RunAnomalyReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunAnomaly: ReactorContract<
		SourceParameters<
			| "aggregateFunction"
			| "alpha"
			| "direction"
			| "frame"
			| "maxAnoms"
			| "period"
			| "seriesColumn"
			| "timeColumn",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/dataquality/RunDataQualityReactor.java
	 * @source Semoss/src/prerna/reactor/frame/py/RunDataQualityReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunDataQuality: ReactorContract<
		SourceParameters<
			"column" | "frame" | "inputTable" | "options" | "rule",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/RunDatabaseDescriptionGeneratorReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunDatabaseDescriptionGenerator: ReactorContract<
		SourceParameters<"database" | "size" | "words", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/RunDocumentSummarizationReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunDocumentSummarization: ReactorContract<
		SourceParameters<
			| "fileOrigin"
			| "frame"
			| "numSentences"
			| "numTopicTerms"
			| "numTopics"
			| "userInput",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/RunGPT2DescriptionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunGPT2Description: ReactorContract<
		SourceParameters<
			"database" | "descriptionType" | "numDescriptions" | "table",
			"both"
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/RunImpliedInsightsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunImpliedInsights: ReactorContract<
		SourceParameters<"frame", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/RunKeyAttributesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunKeyAttributes: ReactorContract<
		SourceParameters<"column" | "frame", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/RunMatrixRegressionReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/analytics/RunMatrixRegressionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunMatrixRegression: ReactorContract<
		| SourceParameters<
				"defaultValue" | "frame" | "panel" | "xColumns" | "yColumn",
				"both"
		  >
		| SourceParameters<"frame" | "panel" | "xColumns" | "yColumn", "both">,
		Record<string, unknown> | unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/RunNumericalCorrelationReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/analytics/RunNumericalCorrelationReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunNumericalCorrelation: ReactorContract<
		| SourceParameters<
				"attributes" | "defaultValue" | "frame" | "panel",
				"both"
		  >
		| SourceParameters<"attributes" | "frame" | "panel", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/RunSentimentAnalysisReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunSentimentAnalysis: ReactorContract<
		SourceParameters<
			"addEmotionCols" | "frame" | "groupCol" | "panel" | "sentimentCol",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/algorithms/UpdateNLPHistoryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdateNLPHistory: ReactorContract<
		SourceParameters<never, "positional">,
		string | null,
		false
	>;
}
