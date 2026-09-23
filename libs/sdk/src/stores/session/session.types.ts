import type { StoreApi } from "zustand/vanilla";
import type { download, runPixel, upload } from "../../api";
import type { Role } from "../../types";

/** Resource kinds whose effective permission can be resolved by the SDK. */
export type ResourceType = "ENGINE" | "PROJECT" | "INSIGHT";

/** One cached permission, including a stale value while refreshing or after failure. */
export type AccessEntry =
	| { status: "loading"; permission?: Role }
	| { status: "ready"; permission: Role }
	| { status: "error"; permission?: Role; error: Error };

/** State owned by one scoped SDK session store. */
export interface SessionState {
	lifecycle: {
		initialization: "idle" | "loading" | "ready" | "error";
		authentication: "unknown" | "unauthenticated" | "authenticated";
		error: Error | null;
	};

	config: {
		data:
			| ({
					r: boolean;
					python: boolean;
					security: true;
					anonymousUsers: boolean;
					anonymousUserUploadData: boolean;
					useLogoutPage: boolean;
					"file-limit"?: number;
					fileSharedPath?: string;
					version?: { version: string; datetime: string };
					defaultFrameType: string;
					defaultScriptingLanguage: string;
					localDeployment: boolean;
					cacheInsightByDefault: boolean;
					cacheInsightMinutes: number;
					cacheInsightEncrypt: boolean;
					cacheCron: string | null;
					showWelcomeBanner: boolean;
					permissionMappingString: {
						OWNER: 1;
						EDIT: 2;
						READ_ONLY: 3;
					};
					permissionMappingInteger: {
						1: "OWNER";
						2: "EDIT";
						3: "READ_ONLY";
					};
					pipelineLandingFilter: string[] | null;
					pipelineSourceFilter: string[] | null;
					widgetTabShareExportList: string[] | null;
					adminOnlyInsightAddAccess: boolean;
					adminOnlyInsightSetPublic: boolean;
					adminOnlyInsightShare: boolean;
					adminOnlyViewMenuBarFlag: boolean;
					adminOnlyNonAprrovedFlag: boolean;
					applicationUrl: string;
					timeout: number;
					loginsAllowed: Record<string, boolean>;
					availableProviders: Array<{
						name: string;
						provider: string;
						isOauth: boolean;
						label: string;
					}>;
					nativeRegistration: boolean;
					passwordRequirements?: {
						minPassLength: number;
						requireUpperCase: boolean;
						requireLowerCase: boolean;
						requireNumeric: boolean;
						requireSpecial: boolean;
						passwordExpirationDays: number;
						requireAdminResetForExpiration: boolean;
						allowUserChangePassword: boolean;
						passReuseCount: number;
						daysToLock: number;
						daysToLockEmail: number;
					};
					logins: Record<string, string>;
					loginDetails: Record<
						string,
						{
							id: string | null;
							name: string;
							san?: Record<string, string>;
						}
					>;
					theme: {
						ID: string;
						THEME_NAME: string;
						THEME_MAP: string;
						IS_ACTIVE: boolean;
					} | null;
					csrf: boolean;
					notificationEnabled: boolean;
					auditLogEnabled: boolean;
					systemDate: string;
			  } & {
					[K in `adminOnly${
						| "Project"
						| "Workspace"
						| "Skill"
						| "Db"
						| "Model"
						| "Storage"
						| "Vector"
						| "Function"}${
						| "Add"
						| "Delete"
						| "AddAccess"
						| "SetPublic"
						| "SetDiscoverable"}`]: boolean;
			  } & {
					[K in `${
						| "database"
						| "engine"
						| "project"
						| "insight"
						| "user"}MetaKeys`]: Array<{
						metakey: string;
						single_multi: string;
						display_order: number;
						display_options: string;
						display_values: string | null;
					}>;
			  })
			| null;
		actions: {
			refresh(): Promise<void>;
		};
	};

	user: {
		current: {
			provider: string;
			id: string;
			name: string;
			username: string;
			email: string;
			admin: boolean;
			userEpoch: string;
			meta: Record<string, readonly string[]>;
			lastLogin: string | null;
			lastPasswordReset: string | null;
			san: Record<string, string>;
			groupInfo: {
				groupType: string | null;
				groups: readonly string[];
			};
		} | null;
		actions: {
			refresh(): Promise<void>;
			updateMetadata(key: string, value: string): Promise<void>;
		};
	};

	insightId: string | null;

	access: {
		entries: Record<ResourceType, Record<string, AccessEntry>>;
		actions: {
			loadPermission(type: ResourceType, id: string): Promise<Role>;
			refreshPermission(type: ResourceType, id: string): Promise<Role>;
			primePermission(
				type: ResourceType,
				id: string,
				permission: Role,
			): void;
			clearPermissions(): void;
			isOperationAvailable(
				type:
					| "PROJECT"
					| "WORKSPACE"
					| "SKILL"
					| "DATABASE"
					| "FUNCTION"
					| "MODEL"
					| "STORAGE"
					| "VECTOR"
					| "GUARDRAIL",
				operation:
					| "access"
					| "add"
					| "delete"
					| "discoverable"
					| "public",
			): boolean;
		};
	};

	actions: {
		initialize(): Promise<void>;
		login(
			input:
				| {
						method: "native" | "ldap";
						username: string;
						password: string;
				  }
				| { method: "oauth"; provider: string }
				| { method: "otp"; otp: string },
		): Promise<void>;
		requestOtp(input: {
			username: string;
			pin: string;
		}): Promise<"otp-required" | "password-change-required">;
		register(input: {
			name: string;
			username: string;
			email: string;
			password: string;
			phone: string;
			phoneExtension: string;
			countryCode: string;
		}): Promise<void>;
		logout(): Promise<void>;
		runPixel<O extends unknown[] | []>(
			pixel: string,
		): ReturnType<typeof runPixel<O>>;
		download(fileKey: string): ReturnType<typeof download>;
		upload(
			files: File | File[],
			projectId?: string | null,
			path?: string | null,
		): ReturnType<typeof upload>;
	};
}

/** The validated platform configuration stored by a session. */
export type SystemConfig = NonNullable<SessionState["config"]["data"]>;

/** The validated current-user record stored by a session. */
export type SessionUser = NonNullable<SessionState["user"]["current"]>;

/** Vanilla Zustand API for a scoped session. */
export type SessionStore = StoreApi<SessionState>;
