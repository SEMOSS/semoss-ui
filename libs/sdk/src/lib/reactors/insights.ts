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

export interface InsightsReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/insights/recipemanagement/AddInsightParameterReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddInsightParameter: ReactorContract<
		SourceParameters<"paramStruct", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/recipemanagement/AddPreDefinedParameterReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddPreDefinedParameter: ReactorContract<
		SourceParameters<
			"database" | "paramStruct" | "preDefinedParamStruct",
			"both"
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/fs/BrowseInsightAssetsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrowseInsightAssets: ReactorContract<
		SourceParameters<"filePath", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/save/CheckInsightNameExistsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CheckInsightNameExists: ReactorContract<
		SourceParameters<"insightName" | "project", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/ClearInsightReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ClearInsight: ReactorContract<
		SourceParameters<"output" | "suppress", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/copy/CopyInsightReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CopyInsight: ReactorContract<
		SourceParameters<"drop" | "limit" | "recipe", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/fs/CopyInsightAssetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CopyInsightAsset: ReactorContract<
		SourceParameters<
			"filePath" | "newValue" | "override",
			"both",
			["filePath", "newValue"],
			2
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/CurrentVariablesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CurrentVariables: ReactorContract<
		SourceParameters<never, "named">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/dashboard/DashboardInsightConfigReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DashboardInsightConfig: ReactorContract<
		SourceParameters<"insights" | "layout" | "oldIds", "named">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/save/DeleteInsightReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteInsight: ReactorContract<
		SourceParameters<"id" | "project", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/fs/DeleteInsightAssetsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteInsightAssets: ReactorContract<
		SourceParameters<"filePath", "both">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/save/DeleteInsightCacheReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteInsightCache: ReactorContract<
		SourceParameters<"id" | "paramValues" | "project", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/recipemanagement/DeleteInsightParameterReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteInsightParameter: ReactorContract<
		SourceParameters<"paramName", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/recipemanagement/DeleteInsightRecipeStepReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteInsightRecipeStep: ReactorContract<
		SourceParameters<"pixelId" | "propagate", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/recipemanagement/DownloadCurrentRecipeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DownloadCurrentRecipe: ReactorContract<
		SourceParameters<never, "named">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/fs/DownloadInsightAssetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DownloadInsightAsset: ReactorContract<
		SourceParameters<"filePath", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/recipemanagement/DownloadInsightRecipeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DownloadInsightRecipe: ReactorContract<
		SourceParameters<"id" | "project", "both">,
		Record<string, unknown> | string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/DropInsightReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DropInsight: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/recipemanagement/EditInsightRecipeStepReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EditInsightRecipeStep: ReactorContract<
		SourceParameters<"pixel" | "pixelId", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/GetAppConfigReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAppConfig: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/GetConsolidateUIStateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetConsolidateUIState: ReactorContract<
		SourceParameters<"output", "both">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/recipemanagement/GetConsolidatedCodeExecutionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetConsolidatedCodeExecution: ReactorContract<
		SourceParameters<"write", "both">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/GetCurrentContextProjectIdReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetCurrentContextProjectId: ReactorContract<
		SourceParameters<never, "named">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/GetCurrentInsightIdReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetCurrentInsightId: ReactorContract<
		SourceParameters<never, "named">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/recipemanagement/GetCurrentRecipeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetCurrentRecipe: ReactorContract<
		SourceParameters<never, "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/GetInsightActiveRoomModelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetInsightActiveRoomModel: ReactorContract<
		SourceParameters<never, "named">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/fs/GetInsightAssetsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetInsightAssets: ReactorContract<
		SourceParameters<"filePath", "both", ["filePath"], 1>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/fs/GetInsightAssetsBase64Reactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetInsightAssetsBase64: ReactorContract<
		SourceParameters<"filePath", "both", ["filePath"], 1>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/save/GetInsightCachedDateTimeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetInsightCachedDateTime: ReactorContract<
		SourceParameters<never, "named">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/GetInsightConfigReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetInsightConfig: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/GetInsightFrameStructureReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetInsightFrameStructure: ReactorContract<
		SourceParameters<"id" | "project", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/GetInsightMetamodelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetInsightMetamodel: ReactorContract<
		SourceParameters<"id" | "project", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/recipemanagement/GetInsightParametersReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetInsightParameters: ReactorContract<
		SourceParameters<never, "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/GetInsightUserAccessRequestReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetInsightUserAccessRequest: ReactorContract<
		SourceParameters<"id" | "project", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/recipemanagement/GetPipelineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetPipeline: ReactorContract<
		SourceParameters<never, "named">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/GetQueriedDatabasesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetQueriedDatabases: ReactorContract<
		SourceParameters<never, "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/GetRoomForInsightReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetRoomForInsight: ReactorContract<
		SourceParameters<never, "named">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/recipemanagement/ImportParamOptionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ImportParamOptions: ReactorContract<
		SourceParameters<never, "named">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/InsightHandleReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	InsightHandle: ReactorContract<
		SourceParameters<never, "positional">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/recipemanagement/InsightPixelListReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	InsightPixelList: ReactorContract<
		SourceParameters<never, "named">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/recipemanagement/InsightRecipeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	InsightRecipe: ReactorContract<
		SourceParameters<"id" | "project" | "vec", "both">,
		Record<string, unknown> | string | unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/IsInsightParameterizedReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	IsInsightParameterized: ReactorContract<
		SourceParameters<"app" | "id" | "project", "both">,
		Record<string, unknown> | boolean | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/LoadInsightReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	LoadInsight: ReactorContract<
		SourceParameters<
			| "additionalPixels"
			| "app"
			| "cache"
			| "id"
			| "origin"
			| "paramValues"
			| "params"
			| "project"
			| "useExistingIfOpen",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/MakeInsightMosfetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MakeInsightMosfet: ReactorContract<
		SourceParameters<"app" | "id" | "override" | "project", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/MyOpenInsightsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MyOpenInsights: ReactorContract<
		SourceParameters<never, "named">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/fs/NewInsightAssetsDirectoryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	NewInsightAssetsDirectory: ReactorContract<
		SourceParameters<"filePath", "both", ["filePath"], 1>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/fs/NewInsightAssetsFileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	NewInsightAssetsFile: ReactorContract<
		SourceParameters<"filePath", "both", ["filePath"], 1>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/OpenEmptyInsightReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpenEmptyInsight: ReactorContract<
		SourceParameters<"params" | "recipe", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/OpenInsightReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpenInsight: ReactorContract<
		SourceParameters<
			| "additionalPixels"
			| "app"
			| "cache"
			| "id"
			| "origin"
			| "paramValues"
			| "params"
			| "project"
			| "useExistingIfOpen",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/PositionInsightRecipeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PositionInsightRecipe: ReactorContract<
		SourceParameters<"positionMap", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/PositionInsightRecipeStepReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PositionInsightRecipeStep: ReactorContract<
		SourceParameters<"pixelId" | "positionMap", "both">,
		boolean | string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/themes/ReadInsightThemeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ReadInsightTheme: ReactorContract<
		SourceParameters<never, "named">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/dashboard/ReloadInsightReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ReloadInsight: ReactorContract<
		SourceParameters<
			| "additionalPixels"
			| "cache"
			| "id"
			| "origin"
			| "paramValues"
			| "params"
			| "project"
			| "useExistingIfOpen",
			"named"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/ReloadInsightClassesReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ReloadInsightClasses: ReactorContract<
		SourceParameters<"project" | "release", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/fs/RenameInsightAssetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RenameInsightAsset: ReactorContract<
		SourceParameters<
			"filePath" | "newValue",
			"both",
			["filePath", "newValue"],
			2
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/recipemanagement/ReplayRecipeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ReplayRecipe: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/RequestInsightReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RequestInsight: ReactorContract<
		SourceParameters<"comment" | "id" | "permission" | "project", "both">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/RetrieveInsightOrnamentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RetrieveInsightOrnament: ReactorContract<
		SourceParameters<never, "named">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/recipemanagement/RetrieveInsightPipelineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RetrieveInsightPipeline: ReactorContract<
		SourceParameters<"app" | "id" | "project", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/recipemanagement/RunParameterRecipeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunParameterRecipe: ReactorContract<
		SourceParameters<"fill" | "recipe", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/save/SaveInsightReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SaveInsight: ReactorContract<
		SourceParameters<
			| "app"
			| "cache"
			| "cacheCron"
			| "cacheEncrypt"
			| "cacheMinutes"
			| "description"
			| "global"
			| "image"
			| "insightName"
			| "layout"
			| "project"
			| "recipe"
			| "schemaName"
			| "tags",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/fs/SaveInsightAssetsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SaveInsightAssets: ReactorContract<
		SourceParameters<
			"content" | "filePath",
			"both",
			["filePath", "content"],
			2
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/fs/SaveInsightAssetsBase64Reactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SaveInsightAssetsBase64: ReactorContract<
		SourceParameters<
			"content" | "decode" | "filePath",
			"both",
			["filePath", "content"],
			2
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/fs/SearchInsightAssetsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SearchInsightAssets: ReactorContract<
		SourceParameters<
			"filePath" | "options" | "search",
			"both",
			["filePath", "search"],
			2
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/SetAppConfigReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetAppConfig: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/save/SetInsightCacheableReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetInsightCacheable: ReactorContract<
		SourceParameters<
			| "cache"
			| "cacheCron"
			| "cacheEncrypt"
			| "cacheMinutes"
			| "id"
			| "project",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/SetInsightConfigReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetInsightConfig: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/SetInsightGoldenLayoutReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetInsightGoldenLayout: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/SetInsightGraphOptionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetInsightGraphOptions: ReactorContract<
		SourceParameters<"options", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/save/SetInsightNameReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetInsightName: ReactorContract<
		SourceParameters<"app" | "id" | "insightName" | "project", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/SetInsightOrnamentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetInsightOrnament: ReactorContract<
		SourceParameters<never, "positional">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/recipemanagement/SetInsightParamValueReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetInsightParamValue: ReactorContract<
		SourceParameters<"paramName" | "paramValue", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/themes/SetInsightThemeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetInsightTheme: ReactorContract<
		SourceParameters<never, "positional">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/recipemanagement/SetOpenInsightParamValueReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetOpenInsightParamValue: ReactorContract<
		SourceParameters<"paramMap", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/SetRoomForInsightReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetRoomForInsight: ReactorContract<
		SourceParameters<"roomId", "both", ["roomId"], 1>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/StoreInsightRecipeStepMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	StoreInsightRecipeStepMetadata: ReactorContract<
		SourceParameters<"alias" | "description" | "pixelId", "both">,
		Record<string, unknown> | string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/fs/UnzipInsightAssetFileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UnzipInsightAssetFile: ReactorContract<
		SourceParameters<"filePath", "both", ["filePath"], 1>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/save/UpdateInsightReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdateInsight: ReactorContract<
		SourceParameters<
			| "app"
			| "cache"
			| "cacheCron"
			| "cacheEncrypt"
			| "cacheMinutes"
			| "description"
			| "global"
			| "id"
			| "image"
			| "insightName"
			| "layout"
			| "project"
			| "recipe"
			| "schemaName"
			| "tags",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/save/UpdateInsightImageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdateInsightImage: ReactorContract<
		SourceParameters<
			"app" | "id" | "imageWaitTime" | "params" | "project" | "url",
			"both"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/recipemanagement/UpdateInsightParameterReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdateInsightParameter: ReactorContract<
		SourceParameters<"paramStruct", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/insights/UploadInsightReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UploadInsight: ReactorContract<
		SourceParameters<"app" | "project", "both">,
		Record<string, unknown> | null,
		false
	>;
}
