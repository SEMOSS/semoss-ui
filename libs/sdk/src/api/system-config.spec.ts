import { describe, expect, it } from "vitest";
import { parseSystemConfig } from "./system-config";

const modules = [
	"Project",
	"Workspace",
	"Skill",
	"Db",
	"Model",
	"Storage",
	"Vector",
	"Function",
] as const;
const operations = [
	"Add",
	"Delete",
	"AddAccess",
	"SetPublic",
	"SetDiscoverable",
] as const;
const metaFields = [
	"databaseMetaKeys",
	"engineMetaKeys",
	"projectMetaKeys",
	"insightMetaKeys",
	"userMetaKeys",
] as const;

const createConfigFixture = (): Record<string, unknown> => {
	const fixture: Record<string, unknown> = {
		r: true,
		python: true,
		security: true,
		anonymousUsers: false,
		anonymousUserUploadData: false,
		useLogoutPage: false,
		"file-limit": 25,
		fileSharedPath: "/shared",
		version: { version: "1.2.3", datetime: "2026-09-23" },
		defaultFrameType: "GRID",
		defaultScriptingLanguage: "PYTHON",
		localDeployment: true,
		cacheInsightByDefault: false,
		cacheInsightMinutes: 30,
		cacheInsightEncrypt: true,
		cacheCron: null,
		showWelcomeBanner: true,
		permissionMappingString: { OWNER: 1, EDIT: 2, READ_ONLY: 3 },
		permissionMappingInteger: {
			1: "OWNER",
			2: "EDIT",
			3: "READ_ONLY",
		},
		pipelineLandingFilter: null,
		pipelineSourceFilter: ["DATABASE", "MODEL"],
		widgetTabShareExportList: [],
		adminOnlyInsightAddAccess: false,
		adminOnlyInsightSetPublic: true,
		adminOnlyInsightShare: false,
		adminOnlyViewMenuBarFlag: false,
		adminOnlyNonAprrovedFlag: true,
		applicationUrl: "https://example.test",
		timeout: 60,
		loginsAllowed: { NATIVE: true, SAML: false },
		availableProviders: [
			{
				name: "Native",
				provider: "NATIVE",
				isOauth: false,
				label: "Sign in",
			},
		],
		nativeRegistration: true,
		passwordRequirements: {
			minPassLength: 12,
			requireUpperCase: true,
			requireLowerCase: true,
			requireNumeric: true,
			requireSpecial: false,
			passwordExpirationDays: 90,
			requireAdminResetForExpiration: false,
			allowUserChangePassword: true,
			passReuseCount: 5,
			daysToLock: 30,
			daysToLockEmail: 25,
		},
		logins: { NATIVE: "user-1" },
		loginDetails: {
			NATIVE: {
				id: "user-1",
				name: "Ada",
				san: { department: "Research" },
			},
		},
		theme: {
			ID: "theme-1",
			THEME_NAME: "Default",
			THEME_MAP: "{}",
			IS_ACTIVE: true,
		},
		csrf: true,
		notificationEnabled: true,
		auditLogEnabled: false,
		systemDate: "2026-09-23T12:00:00Z",
		unknownBackendField: "discard me",
	};

	for (const moduleName of modules) {
		for (const operation of operations) {
			fixture[`adminOnly${moduleName}${operation}`] = false;
		}
	}
	for (const field of metaFields) {
		fixture[field] = [
			{
				metakey: "second",
				single_multi: "single",
				display_order: 2,
				display_options: "input",
				display_values: null,
			},
			{
				metakey: "first",
				single_multi: "multi",
				display_order: 1,
				display_options: "select",
				display_values: "a,b",
			},
		];
	}

	return fixture;
};

describe("parseSystemConfig", () => {
	it("validates the complete backend contract and discards unknown fields", () => {
		const config = parseSystemConfig(createConfigFixture());

		expect(config.permissionMappingString).toEqual({
			OWNER: 1,
			EDIT: 2,
			READ_ONLY: 3,
		});
		expect(config.permissionMappingInteger).toEqual({
			1: "OWNER",
			2: "EDIT",
			3: "READ_ONLY",
		});
		expect(config.adminOnlyNonAprrovedFlag).toBe(true);
		expect(config.databaseMetaKeys.map((entry) => entry.metakey)).toEqual([
			"second",
			"first",
		]);
		expect(config).not.toHaveProperty("unknownBackendField");
	});

	it("normalizes an empty theme and accepts omitted optional fields", () => {
		const fixture = createConfigFixture();
		fixture.theme = {};
		delete fixture["file-limit"];
		delete fixture.fileSharedPath;
		delete fixture.version;
		delete fixture.passwordRequirements;

		const config = parseSystemConfig(fixture);

		expect(config.theme).toBeNull();
		expect(config).not.toHaveProperty("file-limit");
		expect(config).not.toHaveProperty("fileSharedPath");
		expect(config).not.toHaveProperty("version");
		expect(config).not.toHaveProperty("passwordRequirements");
	});

	it("retains nullable filters", () => {
		const config = parseSystemConfig(createConfigFixture());

		expect(config.pipelineLandingFilter).toBeNull();
		expect(config.cacheCron).toBeNull();
	});

	it("rejects malformed required fields", () => {
		const fixture = createConfigFixture();
		fixture.timeout = "60";

		expect(() => parseSystemConfig(fixture)).toThrow(
			"timeout must be a finite number",
		);
	});

	it("rejects permission maps that differ from the backend constants", () => {
		const fixture = createConfigFixture();
		fixture.permissionMappingString = {
			OWNER: 1,
			EDIT: 3,
			READ_ONLY: 2,
		};

		expect(() => parseSystemConfig(fixture)).toThrow(
			"permissionMappingString",
		);
	});
});
