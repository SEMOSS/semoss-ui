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

export interface PlatformReactorCatalog {
	/**
	 * @source Semoss/src/prerna/util/git/reactors/BrowseAssetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrowseAsset: ReactorContract<
		SourceParameters<"filePath" | "space", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/git/reactors/CommitAssetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CommitAsset: ReactorContract<
		SourceParameters<"comment" | "filePath" | "space", "both">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/git/reactors/CopyReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Copy: ReactorContract<
		SourceParameters<
			| "comment"
			| "override"
			| "source"
			| "sourceFilePath"
			| "sourceType"
			| "target"
			| "targetFilePath"
			| "targetType",
			"both",
			["sourceType", "sourceFilePath", "targetType", "targetFilePath"],
			6
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/usertracking/reactors/recommendations/DatabaseRecommendationsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DatabaseRecommendations: ReactorContract<
		SourceParameters<"access" | "communities", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/query/querystruct/delete/DeleteReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Delete: ReactorContract<
		SourceParameters<"from" | "qs", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/git/reactors/DeleteAssetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteAsset: ReactorContract<
		SourceParameters<"comment" | "filePath" | "space", "both">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/git/reactors/DownloadAssetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DownloadAsset: ReactorContract<
		SourceParameters<"filePath" | "space", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/usertracking/reactors/ExtractDatabaseMetaReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExtractAppMeta: ReactorContract<
		SourceParameters<"database", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/usertracking/reactors/ExtractDatabaseMetaReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExtractDatabaseMeta: ReactorContract<
		SourceParameters<"database", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/git/reactors/GetAssetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAsset: ReactorContract<
		SourceParameters<
			"filePath" | "space" | "version",
			"both",
			["filePath"],
			1
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/git/reactors/GetAssetCommentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAssetComment: ReactorContract<
		SourceParameters<"filePath" | "space", "both">,
		string | unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/poi/main/helper/excel/GetExcelFormReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetExcelForm: ReactorContract<
		SourceParameters<"database" | "filePath" | "sheetName", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/git/reactors/GetImageAssetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetImageAsset: ReactorContract<
		SourceParameters<
			"filePath" | "space" | "version",
			"both",
			["filePath"],
			1
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/git/reactors/GitAddTagReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GitAddTag: ReactorContract<
		SourceParameters<
			"commitId" | "project" | "tags",
			"both",
			["project", "commitId", "tags"],
			3
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/git/reactors/GitCloneReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GitClone: ReactorContract<
		SourceParameters<"filePath" | "space" | "url", "both", ["url"], 1>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/git/reactors/GitCloneIntoProjectPortalsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GitCloneIntoProjectPortals: ReactorContract<
		SourceParameters<
			"branch" | "comment" | "project" | "repo" | "subdirectory",
			"both",
			["project", "repo"],
			2
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/git/gitlab/GitlabListBranchesForProjectReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GitlabListBranchesForProject: ReactorContract<
		SourceParameters<
			| "gitlabPrivateToken"
			| "gitlabProjectId"
			| "host"
			| "useApplicationCert",
			"both"
		>,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/git/gitlab/GitlabListJobsForProjectReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GitlabListJobsForProject: ReactorContract<
		SourceParameters<
			| "gitlabJobScope"
			| "gitlabPrivateToken"
			| "gitlabProjectId"
			| "host"
			| "useApplicationCert",
			"both"
		>,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/git/gitlab/GitlabPullJobArtifactByIdReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GitlabPullJobArtifactById: ReactorContract<
		SourceParameters<
			| "gitlabJobId"
			| "gitlabPrivateToken"
			| "gitlabProjectId"
			| "host"
			| "useApplicationCert",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/git/gitlab/GitlabPullLastSuccessfulJobArtifactReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GitlabPullLastSuccessfulJobArtifact: ReactorContract<
		SourceParameters<
			| "gitlabBranchName"
			| "gitlabJobName"
			| "gitlabPrivateToken"
			| "gitlabProjectId"
			| "host"
			| "useApplicationCert",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/git/reactors/MakeDirectoryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MakeDirectory: ReactorContract<
		SourceParameters<"filePath" | "space", "both", ["filePath"], 1>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/query/parsers/ModifyParamQueryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ModifyParamQuery: ReactorContract<
		SourceParameters<"filterWord" | "qs" | "query", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/query/querystruct/RegenSQLReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RegenSQL: ReactorContract<
		SourceParameters<never, "named">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/git/reactors/RenameAssetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RenameAsset: ReactorContract<
		SourceParameters<
			"comment" | "filePath" | "newValue" | "space",
			"both",
			["filePath", "newValue"],
			2
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/query/querystruct/SQLGetParamsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SQLGetParams: ReactorContract<
		SourceParameters<"id" | "id_type", "both">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/query/querystruct/SQLSetParamsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SQLSetParams: ReactorContract<
		SourceParameters<"id" | "id_type" | "value", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/git/reactors/SaveAssetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SaveAsset: ReactorContract<
		SourceParameters<
			"comment" | "content" | "fileName" | "space",
			"both",
			["fileName", "content"],
			2
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/git/reactors/SearchAssetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SearchAsset: ReactorContract<
		SourceParameters<
			"filePath" | "search" | "space",
			"both",
			["search"],
			1
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/query/querystruct/SetParamsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetParams: ReactorContract<
		SourceParameters<
			| "column"
			| "id_type"
			| "operator"
			| "operatoru"
			| "pixelId"
			| "table"
			| "value",
			"both",
			["pixelId", "value", "column"],
			4
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/query/querystruct/update/reactors/UpdateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Update: ReactorContract<
		SourceParameters<"columns" | "qs" | "values", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/util/usertracking/reactors/recommendations/VizRecommendationsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	VizRecommendations: ReactorContract<
		SourceParameters<"max" | "task", "both">,
		Record<string, unknown> | null,
		false
	>;
}
