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

export interface SecurityReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/security/AdminGetRDFMapReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminGetRDFMap: ReactorContract<
		SourceParameters<never, "positional">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/AdminGetSystemDatabaseSchemaReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminGetSystemDatabaseSchema: ReactorContract<
		SourceParameters<"database", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/AdminSetUserMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminSetUserMetadata: ReactorContract<
		SourceParameters<
			"jsonCleanup" | "meta" | "provider" | "userId",
			"both",
			["userId", "provider", "meta"],
			3
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/AdminSetUserMetakeyOptionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminSetUserMetakeyOptions: ReactorContract<
		SourceParameters<"metaoptions", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/ApplyModelCatalogMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ApplyModelCatalogMetadata: ReactorContract<
		SourceParameters<
			"catalogKey" | "dryRun" | "engine",
			"both",
			["engine"],
			1
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/DatabaseInfoReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DatabaseInfo: ReactorContract<
		SourceParameters<"database" | "metaKeys", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/DatabaseUsersReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DatabaseUsers: ReactorContract<
		SourceParameters<"database", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/DatabaseUsersReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DatabaseUsersReactor: ReactorContract<
		SourceParameters<"database", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/EngineInfoReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EngineInfo: ReactorContract<
		SourceParameters<"engine" | "metaKeys", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GenerateEngineMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GenerateEngineMetadata: ReactorContract<
		SourceParameters<
			"engine" | "metaKeys" | "model" | "options",
			"both",
			["engine", "model"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetInsightsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAppInsights: ReactorContract<
		SourceParameters<
			| "filterWord"
			| "limit"
			| "metaFilters"
			| "noMeta"
			| "offset"
			| "onlyFavorites"
			| "project"
			| "sort",
			"both"
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetAvailableTagsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAvailableTags: ReactorContract<
		SourceParameters<"project", "both">,
		string | unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetDatabaseCategoryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetDatabaseCategory: ReactorContract<
		SourceParameters<"engine", "both", ["engine"], 1>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetDatabaseMarkdownReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetDatabaseMarkdown: ReactorContract<
		SourceParameters<"database", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetDatabaseMetaValuesReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetDatabaseMetaValues: ReactorContract<
		SourceParameters<"metaKeys", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetDatabaseMetadataReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetDatabaseMetadata: ReactorContract<
		SourceParameters<"database" | "metaKeys", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetDatabaseMetakeyOptionsReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetDatabaseMetakeyOptions: ReactorContract<
		SourceParameters<"metaKeys", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetDatabaseSMSSReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetDatabaseSMSS: ReactorContract<
		SourceParameters<"database", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetEngineMarkdownReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetEngineMarkdown: ReactorContract<
		SourceParameters<"engine", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetEngineMetaValuesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetEngineMetaValues: ReactorContract<
		SourceParameters<"engineTypes" | "metaKeys", "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetEngineMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetEngineMetadata: ReactorContract<
		SourceParameters<"engine" | "metaKeys", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetEngineMetakeyOptionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetEngineMetakeyOptions: ReactorContract<
		SourceParameters<"metaKeys", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetEngineSMSSReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetEngineSMSS: ReactorContract<
		SourceParameters<"engine", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetInsightFramesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetInsightFrames: ReactorContract<
		SourceParameters<"frame" | "id" | "project", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetInsightMetaValuesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetInsightMetaValues: ReactorContract<
		SourceParameters<"metaKeys", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetInsightMetakeyOptionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetInsightMetakeyOptions: ReactorContract<
		SourceParameters<"metaKeys", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetInsightsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetInsights: ReactorContract<
		SourceParameters<
			| "filterWord"
			| "limit"
			| "metaFilters"
			| "noMeta"
			| "offset"
			| "onlyFavorites"
			| "project"
			| "sort",
			"both"
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetModelMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetModelMetadata: ReactorContract<
		SourceParameters<"engine", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetProjectDependenciesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetProjectDependencies: ReactorContract<
		SourceParameters<"project", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetProjectMarkdownReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetProjectMarkdown: ReactorContract<
		SourceParameters<"project", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetProjectMetaValuesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetProjectMetaValues: ReactorContract<
		SourceParameters<"metaKeys" | "projectType", "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetProjectMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetProjectMetadata: ReactorContract<
		SourceParameters<"metaKeys" | "project", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetProjectMetakeyOptionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetProjectMetakeyOptions: ReactorContract<
		SourceParameters<"metaKeys", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetProjectSMSSReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetProjectSMSS: ReactorContract<
		SourceParameters<"project", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetSpecificInsightMetaReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetSpecificInsightMeta: ReactorContract<
		SourceParameters<"id" | "project", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetUserMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetUserMetadata: ReactorContract<
		SourceParameters<"metaKeys" | "provider" | "userId", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/GetUserMetakeyOptionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetUserMetakeyOptions: ReactorContract<
		SourceParameters<"metaKeys", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/InsightUsageStatisticsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	InsightUsageStatistics: ReactorContract<
		SourceParameters<"filterWord" | "panel" | "project" | "tags", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/LoadEngineMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	LoadEngineMetadata: ReactorContract<
		SourceParameters<"filePath" | "space", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/LoadProjectMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	LoadProjectMetadata: ReactorContract<
		SourceParameters<"filePath" | "space", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/MyDatabasesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MyDatabases: ReactorContract<
		SourceParameters<
			| "database"
			| "filterWord"
			| "limit"
			| "metaFilters"
			| "metaKeys"
			| "noMeta"
			| "offset"
			| "onlyFavorites"
			| "permissionFilters"
			| "userT",
			"both"
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/MyDiscoverableDatabasesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MyDiscoverableDatabases: ReactorContract<
		SourceParameters<
			| "database"
			| "filterWord"
			| "limit"
			| "metaFilters"
			| "metaKeys"
			| "noMeta"
			| "offset",
			"both"
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/MyDiscoverableEnginesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MyDiscoverableEngines: ReactorContract<
		SourceParameters<
			| "engine"
			| "engineTypes"
			| "filterWord"
			| "limit"
			| "metaFilters"
			| "metaKeys"
			| "noMeta"
			| "offset",
			"both"
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/MyEnginesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MyEngines: ReactorContract<
		SourceParameters<
			| "createdBy"
			| "createdByMe"
			| "effectivePermissions"
			| "engine"
			| "engineTypes"
			| "filterWord"
			| "limit"
			| "metaFilters"
			| "metaKeys"
			| "noMeta"
			| "offset"
			| "onlyFavorites"
			| "permissionFilters"
			| "sort"
			| "userT",
			"named"
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/PBEDecryptReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PBEDecrypt: ReactorContract<
		SourceParameters<"query", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/SetDatabaseMetadataReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetDatabaseMetadata: ReactorContract<
		SourceParameters<"database" | "jsonCleanup" | "meta", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/SetDatabaseMetakeyOptionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetDatabaseMetakeyOptions: ReactorContract<
		SourceParameters<"metaoptions", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/SetEngineDisplayNameReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetEngineDisplayName: ReactorContract<
		SourceParameters<"engine" | "name", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/SetEngineMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetEngineMetadata: ReactorContract<
		SourceParameters<"engine" | "jsonCleanup" | "meta", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/SetInsightMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetInsightMetadata: ReactorContract<
		SourceParameters<
			"app" | "id" | "jsonCleanup" | "meta" | "project",
			"both"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/SetInsightMetakeyOptionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetInsightMetakeyOptions: ReactorContract<
		SourceParameters<"metaoptions", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/SetProjectDependenciesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetProjectDependencies: ReactorContract<
		SourceParameters<"dependencies" | "project", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/SetProjectDisplayNameReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetProjectDisplayName: ReactorContract<
		SourceParameters<"name" | "project", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/SetProjectMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetProjectMetadata: ReactorContract<
		SourceParameters<"jsonCleanup" | "meta" | "project", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/SetProjectMetakeyOptionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetProjectMetakeyOptions: ReactorContract<
		SourceParameters<"metaoptions", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/SetUserMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetUserMetadata: ReactorContract<
		SourceParameters<"meta", "both", ["meta"], 1>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/UpdateEngineAppLinkReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdateEngineAppLink: ReactorContract<
		SourceParameters<"engine" | "project", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/UpdateModelMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdateModelMetadata: ReactorContract<
		SourceParameters<"engine" | "map", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/ValidateProjectDependenciesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ValidateProjectDependencies: ReactorContract<
		SourceParameters<"project", "both", ["project"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/security/ValidateUserProjectDependenciesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ValidateUserProjectDependencies: ReactorContract<
		SourceParameters<"project", "both">,
		Record<string, unknown> | null,
		false
	>;
}
