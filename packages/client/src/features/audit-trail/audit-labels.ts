import { formatUnderscoreLabel } from "@semoss/utility/text";

/** What each event the audit trail records is called, by its stored type. */
export const AUDIT_EVENT_LABELS: Readonly<Record<string, string>> = {
	LOGIN: "Signed In",
	LOGOUT: "Signed Out",
	LOGIN_FAILED: "Sign In Failed",
	AUTHORIZATION_DENIED: "Access Denied",
	PERMISSION_ADD: "Access Given",
	PERMISSION_UPDATE: "Access Changed",
	PERMISSION_DELETE: "Access Removed",
	PERMISSION_BULK_GRANT: "Access Given In Bulk",
	PERMISSION_BATCH_APPLY: "Access Changes Saved",
	ACCESS_REQUEST_APPROVE: "Access Request Approved",
	ACCESS_REQUEST_REJECT: "Access Request Rejected",
	USAGE_LIMIT_UPDATE: "Usage Limit Changed",
	USER_CREATE: "User Created",
	USER_UPDATE: "User Updated",
	USER_DELETE: "User Deleted",
	USER_ACTIVATE: "User Unlocked",
	USER_DEACTIVATE: "User Locked",
	USER_ROLE_UPDATE: "User Roles Changed",
	USER_PASSWORD_RESET: "Password Reset",
	GROUP_CREATE: "Team Created",
	GROUP_UPDATE: "Team Updated",
	GROUP_DELETE: "Team Deleted",
	GROUP_MEMBER_ADD: "Team Member Added",
	GROUP_MEMBER_REMOVE: "Team Member Removed",
	GROUP_MANAGER_ADD: "Team Manager Added",
	GROUP_MANAGER_REMOVE: "Team Manager Removed",
	API_KEY_CREATE: "API Key Created",
	API_KEY_DELETE: "API Key Deleted",
	PROJECT_CREATE: "App Created",
	PROJECT_UPDATE: "App Updated",
	PROJECT_RENAME: "App Renamed",
	PROJECT_DISPLAY_NAME_UPDATE: "App Display Name Changed",
	PROJECT_GLOBAL_UPDATE: "App Made Public Or Private",
	PROJECT_DISCOVERABLE_UPDATE: "App Discoverability Changed",
	PROJECT_TEMPLATE_UPDATE: "App Template Setting Changed",
	PROJECT_METADATA_UPDATE: "App Metadata Changed",
	PROJECT_BLOCKS_UPDATE: "App Blocks Saved",
	PROJECT_DELETE: "App Deleted",
	PROJECT_UPLOAD: "App Uploaded",
	PROJECT_REPLACE: "App Replaced By Upload",
	PROJECT_EXPORT: "App Exported",
	PROJECT_VIEW: "App Opened",
	INSIGHT_UPDATE: "Insight Updated",
	INSIGHT_DELETE: "Insight Deleted",
	WORKSPACE_CREATE: "Workspace Created",
	WORKSPACE_UPDATE: "Workspace Updated",
	WORKSPACE_DELETE: "Workspace Deleted",
	AGENT_ROOM_CLOSE: "Agent Room Closed",
	ENGINE_CREATE: "Engine Created",
	ENGINE_UPDATE: "Engine Updated",
	ENGINE_RENAME: "Engine Renamed",
	ENGINE_DISPLAY_NAME_UPDATE: "Engine Display Name Changed",
	ENGINE_GLOBAL_UPDATE: "Engine Made Public Or Private",
	ENGINE_DISCOVERABLE_UPDATE: "Engine Discoverability Changed",
	ENGINE_METADATA_UPDATE: "Engine Metadata Changed",
	ENGINE_VISIBILITY_UPDATE: "Engine Shown Or Hidden In A User's Lists",
	ENGINE_DELETE: "Engine Deleted",
	ENGINE_EXPORT: "Engine Exported",
	MODEL_CREATE: "Model Created",
	VECTOR_CREATE: "Vector Database Created",
	STORAGE_CREATE: "Storage Created",
	FUNCTION_CREATE: "Function Created",
	GUARDRAIL_CREATE: "Guardrail Created",
	DATABASE_WRITE: "Database Write",
	GUARDRAIL_BLOCK: "Guardrail Blocked A Call",
	GUARDRAIL_MASK: "Guardrail Masked A Call",
	GUARDRAIL_RESPOND: "Guardrail Answered A Call",
	GUARDRAIL_ROOM_CLOSE: "Room Closed By Guardrail Hits",
	GUARDRAIL_USER_LOCK: "User Locked Out By Guardrail Hits",
	GUARDRAIL_LOCKED_REQUEST: "Call Refused While Locked Out",
	GUARDRAIL_LOCK_CLEAR: "Guardrail Lock Cleared",
	AUTOMATION_CREATE: "Automation Created",
	AUTOMATION_UPDATE: "Automation Saved",
	AUTOMATION_RUN_START: "Automation Run Started",
	AUTOMATION_RUN_END: "Automation Run Ended",
	AUTOMATION_RUN_CANCEL: "Automation Run Cancelled",
	AUTOMATION_RUN_RESUME: "Automation Run Resumed",
	AUTOMATION_ACTION_RESOLVE: "Automation Action Resolved",
	AUTOMATION_AGENT_STOP: "Automation Agent Stopped",
	SKILL_CREATE: "Skill Created",
	SKILL_UPDATE: "Skill Updated",
	SKILL_DELETE: "Skill Deleted",
	SKILL_ATTACH: "Skill Attached",
	SKILL_DETACH: "Skill Detached",
	JOB_CREATE: "Job Scheduled",
	JOB_UPDATE: "Job Updated",
	JOB_DELETE: "Job Deleted",
	JOB_PAUSE: "Job Paused",
	JOB_RESUME: "Job Resumed",
	CONFIG_UPDATE: "Configuration Changed",
	AUDIT_QUERY: "Audit Trail Read",
	AUDIT_QUERY_REQUEST: "Audit Trail Query Prepared",
	AUDIT_EXPORT: "Audit Trail Exported",
	AUDIT_VERIFY: "Audit Trail Verified",
};

/** What each outcome is called. */
export const AUDIT_STATUS_LABELS: Readonly<Record<string, string>> = {
	SUCCESS: "Succeeded",
	FAILURE: "Failed",
	DENIED: "Denied",
	ERROR: "Error",
};

/** What each severity is called. */
export const AUDIT_SEVERITY_LABELS: Readonly<Record<string, string>> = {
	LOW: "Low",
	MEDIUM: "Medium",
	HIGH: "High",
	CRITICAL: "Critical",
};

/** What each part of the platform an event belongs to is called. */
export const AUDIT_CATEGORY_LABELS: Readonly<Record<string, string>> = {
	AUTH: "Sign In",
	AUTHZ: "Access",
	USAGE_LIMIT: "Usage Limits",
	USER_ADMIN: "Users",
	GROUP_ADMIN: "Teams",
	CREDENTIAL: "API Keys",
	PROJECT: "Apps",
	INSIGHT: "Insights",
	WORKSPACE: "Workspaces",
	ENGINE: "Engines",
	AUTOMATION: "Automations",
	SKILL: "Skills",
	JOB: "Jobs",
	CONFIG: "Configuration",
	AUDIT: "Audit Trail",
};

/** What each kind of thing an event is on is called. */
export const AUDIT_TARGET_LABELS: Readonly<Record<string, string>> = {
	USER: "User",
	GROUP: "Team",
	PROJECT: "App",
	INSIGHT: "Insight",
	WORKSPACE: "Workspace",
	ENGINE: "Engine",
	DATABASE: "Database",
	MODEL: "Model",
	VECTOR: "Vector Database",
	STORAGE: "Storage",
	FUNCTION: "Function",
	GUARDRAIL: "Guardrail",
	VENV: "Virtual Environment",
	AUTOMATION: "Automation",
	SKILL: "Skill",
	JOB: "Job",
	API_KEY: "API Key",
	PLATFORM: "Platform",
	PLATFORM_CONFIG: "Platform Configuration",
	PERMISSION_BATCH: "Permission Batch",
	AUDIT: "Audit Trail",
};

/**
 * The action of the PERMISSION_DELETE SEMOSS records when a grant's end date
 * passes and it removes the grant.
 */
export const PERMISSION_EXPIRED_ACTION = "PERMISSION_EXPIRED";

/**
 * A stored audit value as text.
 *
 * @param value an event's field, as the backend returns it
 * @returns the text, or an empty string for a value that is not text
 */
export function auditText(value: unknown): string {
	return typeof value === "string" ? value : "";
}

/**
 * The label of a stored audit value, such as an event type or a status.
 *
 * @param labels the labels of the field's values
 * @param value the stored value
 * @returns its label, the value in words when it has none, or an empty string
 *          when there is no value
 */
export function auditLabel(
	labels: Readonly<Record<string, string>>,
	value: unknown,
): string {
	const text = auditText(value);
	if (!text) return "";
	return labels[text] ?? formatUnderscoreLabel(text.toLowerCase());
}

/**
 * Names an event: a denied request is Access Denied, whatever it tried, and a
 * grant SEMOSS removed when its end date passed is Access Ended.
 *
 * @param eventType the stored event type
 * @param action the stored action
 * @param status the stored outcome
 * @returns the event's label
 */
export function describeAuditEvent(
	eventType: unknown,
	action: unknown,
	status: unknown,
): string {
	if (status === "DENIED") return AUDIT_EVENT_LABELS.AUTHORIZATION_DENIED;
	if (
		eventType === "PERMISSION_DELETE" &&
		action === PERMISSION_EXPIRED_ACTION
	)
		return "Access Ended";
	return auditLabel(AUDIT_EVENT_LABELS, eventType);
}

/**
 * What a denied request tried, or the action of an event when it differs from
 * the event's type, such as a bulk grant's kind.
 *
 * @param eventType the stored event type
 * @param action the stored action
 * @returns the action to show beside the event, or an empty string
 */
export function describeAuditAction(
	eventType: unknown,
	action: unknown,
): string {
	const text = auditText(action);
	if (!text || text === eventType || text === PERMISSION_EXPIRED_ACTION)
		return "";
	return text;
}
