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

export interface UtilsReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/utils/AddOperationAliasReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddOperationAlias: ReactorContract<
		SourceParameters<"alias" | "reactor", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/AdditionalTypesHelpReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdditionalTypesHelp: ReactorContract<
		SourceParameters<never, "named">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/BackupDatabaseReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BackupDatabase: ReactorContract<
		SourceParameters<"database", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/CheckPyPackagesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CheckPyPackages: ReactorContract<
		SourceParameters<"reload", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/CheckRPackagesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CheckRPackages: ReactorContract<
		SourceParameters<"reload", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/CheckRecommendOptimizationReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CheckRecommendOptimization: ReactorContract<
		SourceParameters<"database", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/CloseEngineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CloseEngine: ReactorContract<
		SourceParameters<"engine", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/DatabaseMetadataToPdfReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DatabaseMetadataToPdf: ReactorContract<
		SourceParameters<"database", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/DatabaseProfileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DatabaseProfile: ReactorContract<
		SourceParameters<"concepts" | "database" | "frame", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/DeleteDatabaseReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteDatabase: ReactorContract<
		SourceParameters<"database", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/DeleteEngineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteEngine: ReactorContract<
		SourceParameters<"engine", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/DeleteProjectReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteProject: ReactorContract<
		SourceParameters<"project", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/ExportDatabaseReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExportDatabase: ReactorContract<
		SourceParameters<"database" | "keepGit", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/ExportEngineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExportEngine: ReactorContract<
		SourceParameters<"engine" | "keepGit", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/ExportProjectReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExportProject: ReactorContract<
		SourceParameters<"keepGit" | "project", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/ExportProjectAppReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExportProjectApp: ReactorContract<
		SourceParameters<"project", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/ExternalDatabaseProfileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExternalDatabaseProfile: ReactorContract<
		SourceParameters<
			"dbDriver" | "host" | "password" | "port" | "schema" | "username",
			"both"
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/GetCurrentUserReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetCurrentUser: ReactorContract<
		SourceParameters<"includeToken", "named">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/GetEngineUsageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetEngineUsage: ReactorContract<
		SourceParameters<"engine" | "type", "both">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/GetFramesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetFrames: ReactorContract<
		SourceParameters<never, "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/GetNumTableReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetNumTable: ReactorContract<
		SourceParameters<"aliasMap" | "url", "both">,
		number,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/GetRequestReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetRequest: ReactorContract<
		SourceParameters<
			"headersMap" | "saveFile" | "url" | "useApplicationCert",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/GetShareAuthTokenReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetShareAuthToken: ReactorContract<
		SourceParameters<never, "named">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/GetShareSessionTokenReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetShareSessionToken: ReactorContract<
		SourceParameters<never, "named">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/GetTableHeader.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetTableHeader: ReactorContract<
		SourceParameters<"aliasMap" | "alias_map" | "url", "both">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/GetUserActiveSavedInsightsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetUserActiveSavedInsights: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/GetUserInfoReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetUserInfo: ReactorContract<
		SourceParameters<"includeToken", "named">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/HelpReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Help: ReactorContract<
		SourceParameters<"reset", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/HelpJsonReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	HelpJson: ReactorContract<
		SourceParameters<"reset", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/ImageCaptureReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ImageCapture: ReactorContract<
		SourceParameters<
			"imageWaitTime" | "params" | "project" | "url",
			"both"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/PostRequestReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PostRequest: ReactorContract<
		SourceParameters<
			"bodyMap" | "headersMap" | "url" | "useApplicationCert",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/RemoteEngineRunReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoteEngineRun: ReactorContract<
		SourceParameters<"payload", "both", ["payload"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/RemoveFrameReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoveFrame: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/RemoveVariableReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoveVariable: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/SendEmailReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SendEmail: ReactorContract<
		SourceParameters<
			| "attachments"
			| "bcc"
			| "cc"
			| "emailSession"
			| "filePath"
			| "from"
			| "html"
			| "message"
			| "messageEncoded"
			| "mustache"
			| "mustacheVars"
			| "password"
			| "smtpHost"
			| "smtpPort"
			| "smtpSecurity"
			| "space"
			| "subject"
			| "to"
			| "username",
			"both"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/UnlockEngineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UnlockEngine: ReactorContract<
		SourceParameters<"engine", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/UnlockProjectsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UnlockProjects: ReactorContract<
		SourceParameters<"project", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/ValidateRReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ValidateR: ReactorContract<
		SourceParameters<"script", "both", ["script"], 1>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/VariableExistsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	VariableExists: ReactorContract<
		SourceParameters<never, "positional">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/utils/HelpReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	help: ReactorContract<
		SourceParameters<"reset", "both">,
		string | null,
		false
	>;
}
