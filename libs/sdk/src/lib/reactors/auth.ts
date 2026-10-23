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

export interface AuthReactorCatalog {
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminDatabaseReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminDatabase: ReactorContract<
		SourceParameters<"database" | "qs", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminEngineInfoReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminEngineInfo: ReactorContract<
		SourceParameters<"engine" | "metaKeys", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminExecQueryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminExecQuery: ReactorContract<
		SourceParameters<"qs", "named">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminExportAllUsersReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminExportAllUsers: ReactorContract<
		SourceParameters<
			"fileName" | "filePath" | "panel" | "password" | "task",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminExportEnterpriseUsageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminExportEnterpriseUsage: ReactorContract<
		SourceParameters<
			| "app"
			| "comparisonEndDate"
			| "comparisonStartDate"
			| "dimension"
			| "endDate"
			| "engine"
			| "format"
			| "model"
			| "source"
			| "startDate"
			| "user"
			| "view",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminExportUserDatabasePermissionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminExportUserDatabasePermissions: ReactorContract<
		SourceParameters<
			"database" | "fileName" | "filePath" | "panel" | "password",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminGetAllEngineUsageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminGetAllEngineUsage: ReactorContract<
		SourceParameters<
			"endDate" | "engine" | "limit" | "offset" | "startDate",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminGetEngineMarkdownReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminGetEngineMarkdown: ReactorContract<
		SourceParameters<"engine", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminGetEngineSMSSReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminGetEngineSMSS: ReactorContract<
		SourceParameters<"engine", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminGetEngineUsagePerProjectReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminGetEngineUsagePerProject: ReactorContract<
		SourceParameters<
			"endDate" | "engine" | "limit" | "offset" | "startDate",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminGetEngineUsagePerUserReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminGetEngineUsagePerUser: ReactorContract<
		SourceParameters<
			"endDate" | "engine" | "limit" | "offset" | "startDate",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminGetEnterpriseUsageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminGetEnterpriseUsage: ReactorContract<
		SourceParameters<
			| "app"
			| "dimension"
			| "endDate"
			| "engine"
			| "limit"
			| "model"
			| "offset"
			| "source"
			| "startDate"
			| "user"
			| "view",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminGetEnterpriseUsageDetailReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminGetEnterpriseUsageDetail: ReactorContract<
		SourceParameters<"recordId" | "source", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminGetEnterpriseUsageFilterOptionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminGetEnterpriseUsageFilterOptions: ReactorContract<
		SourceParameters<
			"dimension" | "id" | "limit" | "offset" | "search",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminGetLlmFeedbackReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminGetLlmFeedback: ReactorContract<
		SourceParameters<
			| "endDate"
			| "engine"
			| "limit"
			| "offset"
			| "project"
			| "startDate"
			| "userId",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminGetLlmFeedbackCountReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminGetLlmFeedbackCount: ReactorContract<
		SourceParameters<
			"endDate" | "engine" | "project" | "startDate" | "userId",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminGetProjectAvailableReactorsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminGetProjectAvailableReactors: ReactorContract<
		SourceParameters<"project", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminGetProjectMarkdownReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminGetProjectMarkdown: ReactorContract<
		SourceParameters<"project", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminGetProjectPortalDetailsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminGetProjectPortalDetails: ReactorContract<
		SourceParameters<"project", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminGetProjectSMSSReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminGetProjectSMSS: ReactorContract<
		SourceParameters<"project", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminGetProjectUsageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminGetProjectUsage: ReactorContract<
		SourceParameters<"project", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminGetSystemInfoReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminGetSystemInfo: ReactorContract<
		SourceParameters<never, "named">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminLoadLdapUsersReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminLoadLdapUsers: ReactorContract<
		SourceParameters<
			| "authProvider"
			| "searchContextName"
			| "searchContextScope"
			| "searchFilter"
			| "updateAttributes",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminLockAccountWarningReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminLockAccountWarning: ReactorContract<
		SourceParameters<never, "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminLockAccountsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminLockAccounts: ReactorContract<
		SourceParameters<"days", "both">,
		number,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminMyEnginesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminMyEngines: ReactorContract<
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
			| "permissionUser"
			| "sort"
			| "userT",
			"both"
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminMyProjectsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminMyProjects: ReactorContract<
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
			| "permissionUser"
			| "project"
			| "projectType"
			| "sort"
			| "userT",
			"both"
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminProjectInfoReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminProjectInfo: ReactorContract<
		SourceParameters<"metaKeys" | "project", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminReloadSocialPropertiesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminReloadSocialProperties: ReactorContract<
		SourceParameters<never, "named">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminRemoveDuplicatesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminRemoveDuplicates: ReactorContract<
		SourceParameters<"database" | "drop" | "table", "both">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminResetPasswordRulesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminResetPasswordRules: ReactorContract<
		SourceParameters<never, "named">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminSqlQueryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminSqlQuery: ReactorContract<
		SourceParameters<"commit" | "database" | "limit" | "query", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminUploadEnginePermissionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminUploadEnginePermissions: ReactorContract<
		SourceParameters<"filePath" | "space", "named">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/auth/utils/reactors/admin/AdminUploadUsersReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminUploadUsers: ReactorContract<
		SourceParameters<"filePath" | "space", "named">,
		string,
		false
	>;
}
