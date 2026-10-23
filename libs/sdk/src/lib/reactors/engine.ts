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

export interface EngineReactorCatalog {
	/**
	 * @source Semoss/src/prerna/engine/impl/guardrail/AggressiveSelfHarmGuardrailEngine.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AggressiveSelfHarmGuardrailEngine: ReactorContract<
		SourceParameters<"prompt", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/fs/BrowseEngineAssetsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrowseEngineAssets: ReactorContract<
		SourceParameters<"engine" | "filePath", "both", ["engine"], 1>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/fs/CopyEngineAssetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CopyEngineAsset: ReactorContract<
		SourceParameters<
			"comment" | "engine" | "filePath" | "newValue" | "override",
			"both",
			["engine", "filePath", "newValue"],
			3
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/fs/DeleteEngineAssetsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteEngineAssets: ReactorContract<
		SourceParameters<
			"comment" | "engine" | "filePath",
			"both",
			["engine"],
			1
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/guardrail/DetoxifyGuardrailEngine.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DetoxifyGuardrailEngine: ReactorContract<
		SourceParameters<"prompt" | "threshold", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/fs/DownloadEngineAssetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DownloadEngineAsset: ReactorContract<
		SourceParameters<"engine" | "filePath", "both", ["engine"], 1>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/EngineCommitDetailsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EngineCommitDetails: ReactorContract<
		SourceParameters<
			"engine" | "limit" | "offset",
			"both",
			["engine", "limit", "offset"],
			3
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/EngineCommitDiffReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EngineCommitDiff: ReactorContract<
		SourceParameters<
			"commitId" | "engine" | "filePath",
			"both",
			["engine", "commitId"],
			2
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/EngineCommitRestoreReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EngineCommitRestore: ReactorContract<
		SourceParameters<
			"commitId" | "engine",
			"both",
			["engine", "commitId"],
			2
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/git/EngineGitBranchesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EngineGitBranches: ReactorContract<
		SourceParameters<"engine", "both", ["engine"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/git/EngineGitCheckoutReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EngineGitCheckout: ReactorContract<
		SourceParameters<"branch" | "engine", "both", ["engine", "branch"], 2>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/git/EngineGitCreateBranchReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EngineGitCreateBranch: ReactorContract<
		SourceParameters<
			"branch" | "engine" | "startPoint",
			"both",
			["engine", "branch"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/git/EngineGitDiffReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EngineGitDiff: ReactorContract<
		SourceParameters<
			"engine" | "filePath" | "side",
			"both",
			["engine", "filePath", "side"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/git/EngineGitResolveConflictReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EngineGitResolveConflict: ReactorContract<
		SourceParameters<
			"content" | "engine" | "filePath" | "resolution",
			"both",
			["engine", "filePath", "resolution"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/git/EngineGitStageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EngineGitStage: ReactorContract<
		SourceParameters<
			"action" | "engine" | "paths",
			"both",
			["engine", "paths", "action"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/git/EngineGitStatusReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EngineGitStatus: ReactorContract<
		SourceParameters<"engine", "both", ["engine"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/EnginePyReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EnginePy: ReactorContract<
		SourceParameters<"code" | "engine", "both">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/guardrail/GLiNERGuardrailEngine.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GLiNERGuardrailEngine: ReactorContract<
		SourceParameters<"labels" | "prompt" | "threshold", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/fs/GetEngineAssetsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetEngineAssets: ReactorContract<
		SourceParameters<
			"engine" | "filePath",
			"both",
			["engine", "filePath"],
			2
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/fs/GetEngineAssetsBase64Reactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetEngineAssetsBase64: ReactorContract<
		SourceParameters<
			"engine" | "filePath",
			"both",
			["engine", "filePath"],
			2
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/GetEngineUserAccessRequestReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetEngineUserAccessRequest: ReactorContract<
		SourceParameters<"engine", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/GetUsageStatisticsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetUsageStatistics: ReactorContract<
		SourceParameters<"agentId" | "endDate" | "startDate" | "type", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/guardrail/JevPolicyGuardrailEngine.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JevPolicyGuardrailEngine: ReactorContract<
		SourceParameters<
			| "blockedMessage"
			| "confidenceThreshold"
			| "judgeErrorVerdict"
			| "prompt"
			| "questionCriteria"
			| "questionInstructions"
			| "questionType"
			| "violationChoices"
			| "violationDirection",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/guardrail/LocalPythonGuardrailReactorFunctionEngine.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	LocalPythonGuardrailReactorFunctionEngine: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/fs/NewEngineAssetsDirectoryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	NewEngineAssetsDirectory: ReactorContract<
		SourceParameters<
			"comment" | "engine" | "filePath",
			"both",
			["engine", "filePath"],
			2
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/fs/NewEngineAssetsFileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	NewEngineAssetsFile: ReactorContract<
		SourceParameters<
			"comment" | "engine" | "filePath",
			"both",
			["engine", "filePath"],
			2
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/guardrail/OnTopicGuardrailEngine.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OnTopicGuardrailEngine: ReactorContract<
		SourceParameters<"limit" | "prompt" | "threshold", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/guardrail/PolicyComplianceGuardrailEngine.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PolicyComplianceGuardrailEngine: ReactorContract<
		SourceParameters<"policy" | "prompt", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/guardrail/PromptInjectionGuardrailEngine.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PromptInjectionGuardrailEngine: ReactorContract<
		SourceParameters<"maxLength" | "prompt" | "threshold", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/fs/RenameEngineAssetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RenameEngineAsset: ReactorContract<
		SourceParameters<
			"comment" | "engine" | "filePath" | "newValue",
			"both",
			["engine", "filePath", "newValue"],
			3
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/RequestEngineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RequestEngine: ReactorContract<
		SourceParameters<"comment" | "engine" | "permission", "both">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/fs/SaveEngineAssetsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SaveEngineAssets: ReactorContract<
		SourceParameters<
			"comment" | "content" | "engine" | "filePath",
			"both",
			["engine", "filePath", "content"],
			3
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/fs/SaveEngineAssetsBase64Reactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SaveEngineAssetsBase64: ReactorContract<
		SourceParameters<
			"comment" | "content" | "decode" | "engine" | "filePath",
			"both",
			["engine", "filePath", "content"],
			3
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/fs/SearchEngineAssetsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SearchEngineAssets: ReactorContract<
		SourceParameters<
			"engine" | "filePath" | "options" | "search",
			"both",
			["engine", "filePath", "search"],
			3
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/guardrail/SqlQueryGuardrailEngine.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SqlQueryGuardrailEngine: ReactorContract<
		SourceParameters<"databaseId" | "query" | "script", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/fs/UnzipEngineAssetFileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UnzipEngineAssetFile: ReactorContract<
		SourceParameters<
			"engine" | "filePath",
			"both",
			["engine", "filePath"],
			2
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/engine/UploadEngineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UploadEngine: ReactorContract<
		SourceParameters<"filePath" | "global" | "space", "both">,
		Record<string, unknown> | null,
		false
	>;
}
