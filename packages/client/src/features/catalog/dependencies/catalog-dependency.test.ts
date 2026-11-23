import { describe, expect, it } from "vitest";
import type { CatalogType } from "@semoss/shared";
import { ALL_ENGINE_TYPES, ALL_PROJECT_TYPES } from "@/utility/catalog";
import {
	CATEGORY_META,
	canRequestDependency,
	canUseDependency,
	DEPENDENCY_ROLE_LABELS,
	DEPENDENCY_TYPE_CONFIG,
	getConfigurationPlace,
	getDependencyAccess,
	getDependencyAccessLabel,
	getDependencyDisplayName,
	getDependencyRoleLabel,
	getDependencyTypeConfig,
	getDependencyVisibilityLabel,
	isPrivateDependency,
	toCatalogDependencyPayload,
} from "./catalog-dependency";

describe("DEPENDENCY_TYPE_CONFIG", () => {
	it.each(ALL_ENGINE_TYPES)("maps the %s engine type", (type) => {
		const config = DEPENDENCY_TYPE_CONFIG[type];
		expect(config.kind).toBe("ENGINE");
		expect(config.label).not.toBe("");
		expect(config.icon).toBeDefined();
		expect(CATEGORY_META[type]).toBeDefined();
	});

	it.each(ALL_PROJECT_TYPES)("maps the %s project type", (type) => {
		const config = DEPENDENCY_TYPE_CONFIG[type];
		expect(config.kind).toBe("PROJECT");
		expect(config.label).not.toBe("");
		expect(config.icon).toBeDefined();
	});

	it("maps the backend's INSIGHTS spelling like INSIGHT", () => {
		expect(DEPENDENCY_TYPE_CONFIG.INSIGHTS).toEqual(
			DEPENDENCY_TYPE_CONFIG.INSIGHT,
		);
	});

	it("maps nothing but engine and project types", () => {
		const known = new Set<string>([
			...ALL_ENGINE_TYPES,
			...ALL_PROJECT_TYPES,
			"INSIGHTS",
		]);
		expect(
			Object.keys(DEPENDENCY_TYPE_CONFIG).filter(
				(type) => !known.has(type),
			),
		).toEqual([]);
	});

	it("falls back for a type it does not know", () => {
		expect(getDependencyTypeConfig("SOMETHING_NEW")).toMatchObject({
			kind: "ENGINE",
			label: "SOMETHING_NEW",
		});
	});
});

describe("toCatalogDependencyPayload", () => {
	it.each<CatalogType>(["SKILL", "NOTEBOOK", "WORKSPACE", "MODEL", "CODE"])(
		"sends the %s type as it is, never PROJECT",
		(type) => {
			expect(
				toCatalogDependencyPayload({
					catalog_id: "id-1",
					catalog_type: type,
				}),
			).toEqual({ id: "id-1", type });
		},
	);

	it("sends a trimmed name and description only when set", () => {
		expect(
			toCatalogDependencyPayload({
				catalog_id: "id-1",
				catalog_type: "MODEL",
				dependency_name: " Drafting ",
				dependency_description: "Writes the first draft",
			}),
		).toEqual({
			id: "id-1",
			type: "MODEL",
			name: "Drafting",
			description: "Writes the first draft",
		});
		expect(
			toCatalogDependencyPayload({
				catalog_id: "id-1",
				catalog_type: "MODEL",
				dependency_name: "  ",
				dependency_description: null,
			}),
		).toEqual({ id: "id-1", type: "MODEL" });
	});
});

describe("DEPENDENCY_ROLE_LABELS", () => {
	it("labels every role and falls back for a new one", () => {
		expect(getDependencyRoleLabel("JUDGE_MODEL")).toBe("Judge Model");
		expect(getDependencyRoleLabel("SUBAGENT")).toBe("Subagent");
		expect(getDependencyRoleLabel("SOMETHING_NEW")).toBe("SOMETHING_NEW");
		expect(
			Object.values(DEPENDENCY_ROLE_LABELS).every(
				(label) => label.length > 0,
			),
		).toBe(true);
	});
});

describe("dependency access", () => {
	const base = {
		catalog_id: "db1",
		catalog_type: "DATABASE" as const,
		catalog_name: "Payroll",
	};

	it("trusts the backend's is_private", () => {
		expect(isPrivateDependency({ is_private: true })).toBe(true);
		expect(
			isPrivateDependency({
				is_private: false,
				catalog_discoverable: false,
			}),
		).toBe(false);
	});

	it("reads private from the access fields on older backends", () => {
		expect(isPrivateDependency({})).toBe(true);
		expect(isPrivateDependency({ catalog_discoverable: true })).toBe(false);
		expect(isPrivateDependency({ catalog_global: true })).toBe(false);
		expect(isPrivateDependency({ permission_name: "READ_ONLY" })).toBe(
			false,
		);
		// a discoverable role is not a level
		expect(isPrivateDependency({ permission_name: "DISCOVERABLE" })).toBe(
			true,
		);
	});

	it("names a private dependency by its type, never its name", () => {
		expect(getDependencyDisplayName({ ...base, is_private: true })).toBe(
			"Private Database",
		);
		expect(
			getDependencyDisplayName({
				catalog_id: "m1",
				catalog_type: "MODEL",
				is_private: true,
			}),
		).toBe("Private Model");
		expect(
			getDependencyDisplayName({
				catalog_id: "a1",
				catalog_type: "WORKSPACE",
				is_private: true,
			}),
		).toBe("Private Agent");
	});

	it("names a visible dependency by its name, else its id", () => {
		expect(getDependencyDisplayName({ ...base, is_private: false })).toBe(
			"Payroll",
		);
		expect(
			getDependencyDisplayName({
				...base,
				catalog_name: "",
				is_private: false,
			}),
		).toBe("db1");
	});

	it("puts a level the user holds first", () => {
		const access = getDependencyAccess({
			permission_name: "EDIT",
			catalog_global: true,
		});
		expect(access).toEqual({ kind: "granted", level: "EDIT" });
		expect(getDependencyAccessLabel(access)).toBe("Editor");
		expect(canUseDependency(access)).toBe(true);
		expect(canRequestDependency(access)).toBe(false);
	});

	it("keeps a different level the user asked for beside the one they hold", () => {
		expect(
			getDependencyAccess({
				permission_name: "READ_ONLY",
				access_permission: 2,
			}),
		).toEqual({ kind: "granted", level: "READ_ONLY", requested: "EDIT" });
	});

	it("reads public, requested, requestable and private", () => {
		expect(getDependencyAccess({ catalog_global: true })).toEqual({
			kind: "public",
		});
		const requested = getDependencyAccess({
			catalog_discoverable: true,
			access_permission: 3,
		});
		expect(requested).toEqual({ kind: "requested", level: "READ_ONLY" });
		expect(getDependencyAccessLabel(requested)).toBe("Requested Read-Only");
		const requestable = getDependencyAccess({ catalog_discoverable: true });
		expect(requestable).toEqual({ kind: "requestable" });
		expect(canRequestDependency(requestable)).toBe(true);
		expect(getDependencyAccessLabel(requestable)).toBe("Can Request");
		const hidden = getDependencyAccess({ is_private: true });
		expect(hidden).toEqual({ kind: "private" });
		expect(canRequestDependency(hidden)).toBe(false);
		expect(getDependencyAccessLabel(hidden)).toBe("Hidden");
	});

	it("labels the catalog visibility", () => {
		expect(getDependencyVisibilityLabel({ catalog_global: true })).toBe(
			"Public",
		);
		expect(
			getDependencyVisibilityLabel({ catalog_discoverable: true }),
		).toBe("Discoverable");
		expect(getDependencyVisibilityLabel({})).toBe("Private");
	});
});

describe("getConfigurationPlace", () => {
	const guardrailOwner = {
		kind: "ENGINE" as const,
		type: "GUARDRAIL",
		id: "guard-1",
	};

	it.each([
		["JUDGE_MODEL", "SMSS", "/smss"],
		["KEYWORD_ENGINE", "SMSS", "/smss"],
		["IMAGE_MODEL", "SMSS", "/smss"],
		["GUARDRAIL", "Guardrails Settings", "/settings/guardrails"],
		["ROUTE_MODEL", "Model Settings", "/settings/model"],
	])("sends an engine's %s to its %s", (role, label, suffix) => {
		const place = getConfigurationPlace(role, guardrailOwner);
		expect(place.label).toBe(label);
		expect(place.path?.endsWith(`guard-1${suffix}`)).toBe(true);
	});

	it("sends a project's automatic links to its own editor", () => {
		const place = getConfigurationPlace("AGENT_MODEL", {
			kind: "PROJECT",
			type: "WORKSPACE",
			id: "agent-1",
		});
		expect(place.label).toBe("Editor");
		expect(place.path).toContain("agent-1");
	});
});
