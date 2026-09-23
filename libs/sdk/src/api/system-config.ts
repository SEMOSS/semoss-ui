import type { SystemConfig } from "../stores/session/session.types";

const ADMIN_MODULES = [
	"Project",
	"Workspace",
	"Skill",
	"Db",
	"Model",
	"Storage",
	"Vector",
	"Function",
] as const;

const ADMIN_OPERATIONS = [
	"Add",
	"Delete",
	"AddAccess",
	"SetPublic",
	"SetDiscoverable",
] as const;

const META_KEY_FIELDS = [
	"databaseMetaKeys",
	"engineMetaKeys",
	"projectMetaKeys",
	"insightMetaKeys",
	"userMetaKeys",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const invalid = (path: string, expected: string): never => {
	throw new Error(
		`Invalid system configuration: ${path} must be ${expected}`,
	);
};

const expectRecord = (
	value: unknown,
	path: string,
): Record<string, unknown> => {
	if (!isRecord(value)) {
		return invalid(path, "an object");
	}

	return value;
};

const expectString = (value: unknown, path: string): string => {
	if (typeof value !== "string") {
		return invalid(path, "a string");
	}

	return value;
};

const expectBoolean = (value: unknown, path: string): boolean => {
	if (typeof value !== "boolean") {
		return invalid(path, "a boolean");
	}

	return value;
};

const expectNumber = (value: unknown, path: string): number => {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return invalid(path, "a finite number");
	}

	return value;
};

const expectNullableString = (value: unknown, path: string): string | null => {
	if (value === null) {
		return null;
	}

	return expectString(value, path);
};

const expectStringArrayOrNull = (
	value: unknown,
	path: string,
): string[] | null => {
	if (value === null) {
		return null;
	}

	if (!Array.isArray(value)) {
		return invalid(path, "an array of strings or null");
	}

	return value.map((item, index) => expectString(item, `${path}[${index}]`));
};

const expectStringRecord = (
	value: unknown,
	path: string,
): Record<string, string> => {
	const record = expectRecord(value, path);
	return Object.fromEntries(
		Object.entries(record).map(([key, entry]) => [
			key,
			expectString(entry, `${path}.${key}`),
		]),
	);
};

const expectBooleanRecord = (
	value: unknown,
	path: string,
): Record<string, boolean> => {
	const record = expectRecord(value, path);
	return Object.fromEntries(
		Object.entries(record).map(([key, entry]) => [
			key,
			expectBoolean(entry, `${path}.${key}`),
		]),
	);
};

const parseMetaKeys = (value: unknown, path: string) => {
	if (!Array.isArray(value)) {
		return invalid(path, "an array");
	}

	return value.map((item, index) => {
		const entryPath = `${path}[${index}]`;
		const record = expectRecord(item, entryPath);
		return {
			metakey: expectString(record.metakey, `${entryPath}.metakey`),
			single_multi: expectString(
				record.single_multi,
				`${entryPath}.single_multi`,
			),
			display_order: expectNumber(
				record.display_order,
				`${entryPath}.display_order`,
			),
			display_options: expectString(
				record.display_options,
				`${entryPath}.display_options`,
			),
			display_values: expectNullableString(
				record.display_values,
				`${entryPath}.display_values`,
			),
		};
	});
};

const parseTheme = (value: unknown): SystemConfig["theme"] => {
	const theme = expectRecord(value, "theme");
	if (Object.keys(theme).length === 0) {
		return null;
	}

	return {
		ID: expectString(theme.ID, "theme.ID"),
		THEME_NAME: expectString(theme.THEME_NAME, "theme.THEME_NAME"),
		THEME_MAP: expectString(theme.THEME_MAP, "theme.THEME_MAP"),
		IS_ACTIVE: expectBoolean(theme.IS_ACTIVE, "theme.IS_ACTIVE"),
	};
};

const parseAvailableProviders = (
	value: unknown,
): SystemConfig["availableProviders"] => {
	if (!Array.isArray(value)) {
		return invalid("availableProviders", "an array");
	}

	return value.map((item, index) => {
		const path = `availableProviders[${index}]`;
		const provider = expectRecord(item, path);
		return {
			name: expectString(provider.name, `${path}.name`),
			provider: expectString(provider.provider, `${path}.provider`),
			isOauth: expectBoolean(provider.isOauth, `${path}.isOauth`),
			label: expectString(provider.label, `${path}.label`),
		};
	});
};

const parseLoginDetails = (value: unknown): SystemConfig["loginDetails"] => {
	const details = expectRecord(value, "loginDetails");
	return Object.fromEntries(
		Object.entries(details).map(([provider, rawDetail]) => {
			const path = `loginDetails.${provider}`;
			const detail = expectRecord(rawDetail, path);
			const id =
				detail.id === null
					? null
					: expectString(detail.id, `${path}.id`);
			const san =
				detail.san === undefined
					? undefined
					: expectStringRecord(detail.san, `${path}.san`);
			return [
				provider,
				{
					id,
					name: expectString(detail.name, `${path}.name`),
					...(san ? { san } : {}),
				},
			];
		}),
	);
};

const parsePasswordRequirements = (
	value: unknown,
): NonNullable<SystemConfig["passwordRequirements"]> => {
	const requirements = expectRecord(value, "passwordRequirements");
	return {
		minPassLength: expectNumber(
			requirements.minPassLength,
			"passwordRequirements.minPassLength",
		),
		requireUpperCase: expectBoolean(
			requirements.requireUpperCase,
			"passwordRequirements.requireUpperCase",
		),
		requireLowerCase: expectBoolean(
			requirements.requireLowerCase,
			"passwordRequirements.requireLowerCase",
		),
		requireNumeric: expectBoolean(
			requirements.requireNumeric,
			"passwordRequirements.requireNumeric",
		),
		requireSpecial: expectBoolean(
			requirements.requireSpecial,
			"passwordRequirements.requireSpecial",
		),
		passwordExpirationDays: expectNumber(
			requirements.passwordExpirationDays,
			"passwordRequirements.passwordExpirationDays",
		),
		requireAdminResetForExpiration: expectBoolean(
			requirements.requireAdminResetForExpiration,
			"passwordRequirements.requireAdminResetForExpiration",
		),
		allowUserChangePassword: expectBoolean(
			requirements.allowUserChangePassword,
			"passwordRequirements.allowUserChangePassword",
		),
		passReuseCount: expectNumber(
			requirements.passReuseCount,
			"passwordRequirements.passReuseCount",
		),
		daysToLock: expectNumber(
			requirements.daysToLock,
			"passwordRequirements.daysToLock",
		),
		daysToLockEmail: expectNumber(
			requirements.daysToLockEmail,
			"passwordRequirements.daysToLockEmail",
		),
	};
};

/** Validate and retain the known `/api/config` contract. */
export const parseSystemConfig = (value: unknown): SystemConfig => {
	const raw = expectRecord(value, "response");
	const permissionMappingString = expectRecord(
		raw.permissionMappingString,
		"permissionMappingString",
	);
	const permissionMappingInteger = expectRecord(
		raw.permissionMappingInteger,
		"permissionMappingInteger",
	);

	if (
		permissionMappingString.OWNER !== 1 ||
		permissionMappingString.EDIT !== 2 ||
		permissionMappingString.READ_ONLY !== 3
	) {
		return invalid(
			"permissionMappingString",
			"the OWNER/EDIT/READ_ONLY map",
		);
	}
	if (
		permissionMappingInteger["1"] !== "OWNER" ||
		permissionMappingInteger["2"] !== "EDIT" ||
		permissionMappingInteger["3"] !== "READ_ONLY"
	) {
		return invalid("permissionMappingInteger", "the 1/2/3 permission map");
	}

	const security = expectBoolean(raw.security, "security");
	if (!security) {
		return invalid("security", "true");
	}

	const config = {
		r: expectBoolean(raw.r, "r"),
		python: expectBoolean(raw.python, "python"),
		security: true as const,
		anonymousUsers: expectBoolean(raw.anonymousUsers, "anonymousUsers"),
		anonymousUserUploadData: expectBoolean(
			raw.anonymousUserUploadData,
			"anonymousUserUploadData",
		),
		useLogoutPage: expectBoolean(raw.useLogoutPage, "useLogoutPage"),
		...(raw["file-limit"] === undefined
			? {}
			: { "file-limit": expectNumber(raw["file-limit"], "file-limit") }),
		...(raw.fileSharedPath === undefined
			? {}
			: {
					fileSharedPath: expectString(
						raw.fileSharedPath,
						"fileSharedPath",
					),
				}),
		...(raw.version === undefined
			? {}
			: {
					version: (() => {
						const version = expectRecord(raw.version, "version");
						return {
							version: expectString(
								version.version,
								"version.version",
							),
							datetime: expectString(
								version.datetime,
								"version.datetime",
							),
						};
					})(),
				}),
		defaultFrameType: expectString(
			raw.defaultFrameType,
			"defaultFrameType",
		),
		defaultScriptingLanguage: expectString(
			raw.defaultScriptingLanguage,
			"defaultScriptingLanguage",
		),
		localDeployment: expectBoolean(raw.localDeployment, "localDeployment"),
		cacheInsightByDefault: expectBoolean(
			raw.cacheInsightByDefault,
			"cacheInsightByDefault",
		),
		cacheInsightMinutes: expectNumber(
			raw.cacheInsightMinutes,
			"cacheInsightMinutes",
		),
		cacheInsightEncrypt: expectBoolean(
			raw.cacheInsightEncrypt,
			"cacheInsightEncrypt",
		),
		cacheCron: expectNullableString(raw.cacheCron, "cacheCron"),
		showWelcomeBanner: expectBoolean(
			raw.showWelcomeBanner,
			"showWelcomeBanner",
		),
		permissionMappingString: { OWNER: 1, EDIT: 2, READ_ONLY: 3 },
		permissionMappingInteger: {
			1: "OWNER" as const,
			2: "EDIT" as const,
			3: "READ_ONLY" as const,
		},
		pipelineLandingFilter: expectStringArrayOrNull(
			raw.pipelineLandingFilter,
			"pipelineLandingFilter",
		),
		pipelineSourceFilter: expectStringArrayOrNull(
			raw.pipelineSourceFilter,
			"pipelineSourceFilter",
		),
		widgetTabShareExportList: expectStringArrayOrNull(
			raw.widgetTabShareExportList,
			"widgetTabShareExportList",
		),
		adminOnlyInsightAddAccess: expectBoolean(
			raw.adminOnlyInsightAddAccess,
			"adminOnlyInsightAddAccess",
		),
		adminOnlyInsightSetPublic: expectBoolean(
			raw.adminOnlyInsightSetPublic,
			"adminOnlyInsightSetPublic",
		),
		adminOnlyInsightShare: expectBoolean(
			raw.adminOnlyInsightShare,
			"adminOnlyInsightShare",
		),
		adminOnlyViewMenuBarFlag: expectBoolean(
			raw.adminOnlyViewMenuBarFlag,
			"adminOnlyViewMenuBarFlag",
		),
		adminOnlyNonAprrovedFlag: expectBoolean(
			raw.adminOnlyNonAprrovedFlag,
			"adminOnlyNonAprrovedFlag",
		),
		applicationUrl: expectString(raw.applicationUrl, "applicationUrl"),
		timeout: expectNumber(raw.timeout, "timeout"),
		loginsAllowed: expectBooleanRecord(raw.loginsAllowed, "loginsAllowed"),
		availableProviders: parseAvailableProviders(raw.availableProviders),
		nativeRegistration: expectBoolean(
			raw.nativeRegistration,
			"nativeRegistration",
		),
		...(raw.passwordRequirements === undefined
			? {}
			: {
					passwordRequirements: parsePasswordRequirements(
						raw.passwordRequirements,
					),
				}),
		logins: expectStringRecord(raw.logins, "logins"),
		loginDetails: parseLoginDetails(raw.loginDetails),
		theme: parseTheme(raw.theme),
		csrf: expectBoolean(raw.csrf, "csrf"),
		notificationEnabled: expectBoolean(
			raw.notificationEnabled,
			"notificationEnabled",
		),
		auditLogEnabled: expectBoolean(raw.auditLogEnabled, "auditLogEnabled"),
		systemDate: expectString(raw.systemDate, "systemDate"),
	} satisfies Omit<
		SystemConfig,
		| `adminOnly${
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
				| "SetDiscoverable"}`
		| `${"database" | "engine" | "project" | "insight" | "user"}MetaKeys`
	>;

	const adminFlags: Record<string, boolean> = {};
	for (const moduleName of ADMIN_MODULES) {
		for (const operation of ADMIN_OPERATIONS) {
			const key = `adminOnly${moduleName}${operation}`;
			adminFlags[key] = expectBoolean(raw[key], key);
		}
	}

	const metaKeys: Record<string, ReturnType<typeof parseMetaKeys>> = {};
	for (const key of META_KEY_FIELDS) {
		metaKeys[key] = parseMetaKeys(raw[key], key);
	}

	// Every dynamically named field above is validated before this intersection is formed.
	return { ...config, ...adminFlags, ...metaKeys } as SystemConfig;
};
