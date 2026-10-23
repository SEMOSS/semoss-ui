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

export interface ProjectReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/project/AddDefaultInsightsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddDefaultInsights: ReactorContract<
		SourceParameters<"database" | "insights" | "project", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/AddRPYProjectPathReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddRPYProjectPath: ReactorContract<
		SourceParameters<"project", "both", ["project"], 1>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/template/AddTemplateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddTemplate: ReactorContract<
		SourceParameters<"project" | "template_file" | "template_name", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/fs/BrowseAppAssetsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrowseAppAssets: ReactorContract<
		SourceParameters<"filePath" | "project", "both", ["project"], 1>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/BuildAndPublishAppReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BuildAndPublishApp: ReactorContract<
		SourceParameters<"project", "both", ["project"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/CompileAppReactorsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CompileAppReactors: ReactorContract<
		SourceParameters<"project" | "release", "both">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/fs/CopyAppAssetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CopyAppAsset: ReactorContract<
		SourceParameters<
			"comment" | "filePath" | "newValue" | "override" | "project",
			"both",
			["project", "filePath", "newValue"],
			3
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/fs/CopyAppAssetsToInsightReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CopyAppAssetsToInsight: ReactorContract<
		SourceParameters<
			"filePath" | "project",
			"both",
			["project", "filePath"],
			2
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/CreateAppFromBlocksReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateAppFromBlocks: ReactorContract<
		SourceParameters<
			"global" | "json" | "project" | "provider" | "url",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/CreateAppFromTemplateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateAppFromTemplate: ReactorContract<
		SourceParameters<
			"global" | "project" | "projectTemplate" | "provider" | "url",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/CreateNotebookReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateNotebook: ReactorContract<
		SourceParameters<"global" | "project", "both", ["project"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/CreateProjectReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateProject: ReactorContract<
		SourceParameters<
			"global" | "project" | "projectType" | "provider" | "url",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/fs/DeleteAppAssetsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteAppAssets: ReactorContract<
		SourceParameters<
			"comment" | "filePath" | "project",
			"both",
			["project"],
			1
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/template/DeleteTemplateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteTemplate: ReactorContract<
		SourceParameters<"project" | "template_file" | "template_name", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/fs/DownloadAppAssetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DownloadAppAsset: ReactorContract<
		SourceParameters<"filePath" | "project", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/DownloadAppNotebookReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DownloadAppNotebook: ReactorContract<
		SourceParameters<"project", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/DownloadProjectInsightsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DownloadProjectInsights: ReactorContract<
		SourceParameters<"project", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/ExecuteAppNotebookReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExecuteAppNotebook: ReactorContract<
		SourceParameters<"map" | "project", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/ExtractAndSetDependenciesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExtractAndSetDependencies: ReactorContract<
		SourceParameters<"filePath" | "project", "both", ["project"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/fs/GetAppAssetsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAppAssets: ReactorContract<
		SourceParameters<
			"filePath" | "project",
			"both",
			["project", "filePath"],
			2
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/fs/GetAppAssetsBase64Reactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAppAssetsBase64: ReactorContract<
		SourceParameters<
			"filePath" | "project",
			"both",
			["project", "filePath"],
			2
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/GetAppBlocksJsonReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAppBlocksJson: ReactorContract<
		SourceParameters<"project", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/template/GetPlaceHoldersReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetPlaceHolders: ReactorContract<
		SourceParameters<"project" | "template_name", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/GetProjectAuthorizationHeaderReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetProjectAuthorizationHeader: ReactorContract<
		SourceParameters<"project", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/GetProjectAvailableReactorsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetProjectAvailableReactors: ReactorContract<
		SourceParameters<"project", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/GetProjectListReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetProjectList: ReactorContract<
		SourceParameters<"project", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/GetProjectPortalDetailsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetProjectPortalDetails: ReactorContract<
		SourceParameters<"project", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/GetProjectPropertiesContentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetProjectPropertiesContent: ReactorContract<
		SourceParameters<"project", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/GetProjectReactorSignatureReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetProjectReactorSignature: ReactorContract<
		SourceParameters<
			"project" | "reactor",
			"both",
			["project", "reactor"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/GetProjectReactorStatusReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetProjectReactorStatus: ReactorContract<
		SourceParameters<"project", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/GetProjectUserAccessRequestReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetProjectUserAccessRequest: ReactorContract<
		SourceParameters<"project", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/template/GetTemplateList.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetTemplateList: ReactorContract<
		SourceParameters<"project", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/LoadAppReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	LoadApp: ReactorContract<
		SourceParameters<"project", "both", ["project"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/MyDiscoverableProjectsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MyDiscoverableProjects: ReactorContract<
		SourceParameters<
			| "filterWord"
			| "limit"
			| "metaFilters"
			| "metaKeys"
			| "noMeta"
			| "offset"
			| "project"
			| "projectType",
			"both"
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/MyProjectsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MyProjects: ReactorContract<
		SourceParameters<
			| "createdBy"
			| "createdByMe"
			| "effectivePermissions"
			| "filterWord"
			| "limit"
			| "metaFilters"
			| "metaKeys"
			| "noMeta"
			| "offset"
			| "onlyFavorites"
			| "onlyTemplates"
			| "permissionFilters"
			| "project"
			| "projectType"
			| "sort"
			| "userT",
			"named"
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/fs/NewAppAssetsDirectoryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	NewAppAssetsDirectory: ReactorContract<
		SourceParameters<
			"comment" | "filePath" | "project",
			"both",
			["project", "filePath"],
			2
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/fs/NewAppAssetsFileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	NewAppAssetsFile: ReactorContract<
		SourceParameters<
			"comment" | "filePath" | "project",
			"both",
			["project", "filePath"],
			2
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/ProjectCommitDetailsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ProjectCommitDetails: ReactorContract<
		SourceParameters<
			"limit" | "offset" | "project",
			"both",
			["project", "limit", "offset"],
			3
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/ProjectCommitDiffReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ProjectCommitDiff: ReactorContract<
		SourceParameters<
			"commitId" | "filePath" | "project",
			"both",
			["project", "commitId"],
			2
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/ProjectCommitRestoreReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ProjectCommitRestore: ReactorContract<
		SourceParameters<
			"commitId" | "project",
			"both",
			["project", "commitId"],
			2
		>,
		boolean | string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/git/ProjectGitBranchesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ProjectGitBranches: ReactorContract<
		SourceParameters<"project", "both", ["project"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/git/ProjectGitCheckoutReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ProjectGitCheckout: ReactorContract<
		SourceParameters<
			"branch" | "project",
			"both",
			["project", "branch"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/git/ProjectGitCreateBranchReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ProjectGitCreateBranch: ReactorContract<
		SourceParameters<
			"branch" | "project" | "startPoint",
			"both",
			["project", "branch"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/git/ProjectGitDetailsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ProjectGitDetails: ReactorContract<
		SourceParameters<"project", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/git/ProjectGitDiffReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ProjectGitDiff: ReactorContract<
		SourceParameters<
			"filePath" | "project" | "side",
			"both",
			["project", "filePath", "side"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/git/ProjectGitResolveConflictReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ProjectGitResolveConflict: ReactorContract<
		SourceParameters<
			"content" | "filePath" | "project" | "resolution",
			"both",
			["project", "filePath", "resolution"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/git/ProjectGitStageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ProjectGitStage: ReactorContract<
		SourceParameters<
			"action" | "paths" | "project",
			"both",
			["project", "paths", "action"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/git/ProjectGitStatusReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ProjectGitStatus: ReactorContract<
		SourceParameters<"project", "both", ["project"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/ProjectInfoReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ProjectInfo: ReactorContract<
		SourceParameters<"metaKeys" | "project", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/ProjectPyReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ProjectPy: ReactorContract<
		SourceParameters<"code" | "project", "both">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/ProjectPyBase64Reactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ProjectPyBase64: ReactorContract<
		SourceParameters<"code" | "project", "both">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/ProjectRReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ProjectR: ReactorContract<
		SourceParameters<"code" | "project", "both">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/ProjectReconnectServerReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ProjectReconnectServer: ReactorContract<
		SourceParameters<"project", "both">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/PublishProjectReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PublishProject: ReactorContract<
		SourceParameters<"project" | "release", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/ReloadProjectPropertiesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ReloadProjectProperties: ReactorContract<
		SourceParameters<"project", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/RemoveRPYProjectPathReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoveRPYProjectPath: ReactorContract<
		SourceParameters<"project", "both", ["project"], 1>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/fs/RenameAppAssetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RenameAppAsset: ReactorContract<
		SourceParameters<
			"comment" | "filePath" | "newValue" | "project",
			"both",
			["project", "filePath", "newValue"],
			3
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/ReplaceInaccessibleEnginesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ReplaceInaccessibleEngines: ReactorContract<
		SourceParameters<
			"filePath" | "map" | "project",
			"both",
			["project", "map"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/RequestProjectReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RequestProject: ReactorContract<
		SourceParameters<"comment" | "permission" | "project", "both">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/fs/SaveAppAssetsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SaveAppAssets: ReactorContract<
		SourceParameters<
			"comment" | "content" | "filePath" | "project",
			"both",
			["project", "filePath", "content"],
			3
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/fs/SaveAppAssetsBase64Reactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SaveAppAssetsBase64: ReactorContract<
		SourceParameters<
			"comment" | "content" | "decode" | "filePath" | "project",
			"both",
			["project", "filePath", "content"],
			3
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/SaveAppBlocksJsonReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SaveAppBlocksJson: ReactorContract<
		SourceParameters<"comment" | "json" | "project", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/fs/SearchAppAssetsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SearchAppAssets: ReactorContract<
		SourceParameters<
			"filePath" | "options" | "project" | "search",
			"both",
			["project", "filePath", "search"],
			3
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/SetContextReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetContext: ReactorContract<
		SourceParameters<"project", "both", ["project"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/SetProjectPropertiesContentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetProjectPropertiesContent: ReactorContract<
		SourceParameters<"project" | "propMap", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/fs/UnzipAppAssetFileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UnzipAppAssetFile: ReactorContract<
		SourceParameters<
			"filePath" | "project",
			"both",
			["project", "filePath"],
			2
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/template/UpdateTemplateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdateTemplate: ReactorContract<
		SourceParameters<"project" | "template_file" | "template_name", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/UploadProjectReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UploadProject: ReactorContract<
		SourceParameters<"filePath" | "global" | "space", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/project/UploadProjectAppReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UploadProjectApp: ReactorContract<
		SourceParameters<"filePath" | "global" | "mode" | "space", "both">,
		Record<string, unknown> | null,
		false
	>;
}
