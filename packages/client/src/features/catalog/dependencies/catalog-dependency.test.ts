import { describe, expect, it } from "vitest";
import type { CatalogType } from "@semoss/shared";
import { TYPE_TO_ROUTE } from "@/constants";
import { ALL_ENGINE_TYPES, ALL_PROJECT_TYPES } from "@/utility/catalog";
import {
	CATEGORY_META,
	DEPENDENCY_ROLE_LABELS,
	DEPENDENCY_TYPE_CONFIG,
	getDependencyRoleLabel,
	getDependencyTypeConfig,
	toCatalogDependencyPayload,
} from "./catalog-dependency";

describe("DEPENDENCY_TYPE_CONFIG", () => {
	it.each(ALL_ENGINE_TYPES)("maps the %s engine type", (type) => {
		const config = DEPENDENCY_TYPE_CONFIG[type];
		expect(config.kind).toBe("engine");
		expect(config.route).toBe(TYPE_TO_ROUTE[type]);
		expect(config.label).not.toBe("");
		expect(config.icon).toBeDefined();
		expect(CATEGORY_META[type]).toBeDefined();
	});

	it.each(ALL_PROJECT_TYPES)("maps the %s project type", (type) => {
		const config = DEPENDENCY_TYPE_CONFIG[type];
		expect(config.kind).toBe("project");
		expect(config.route).toBe(TYPE_TO_ROUTE[type]);
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

	it("sends agents to the agent pages and notebooks to theirs", () => {
		expect(getDependencyTypeConfig("WORKSPACE").route).toBe("/agent");
		expect(getDependencyTypeConfig("NOTEBOOK").route).toBe("/notebook");
		expect(getDependencyTypeConfig("AUTOMATION").route).toBe("/automation");
	});

	it("falls back for a type it does not know", () => {
		expect(getDependencyTypeConfig("SOMETHING_NEW")).toMatchObject({
			kind: "engine",
			route: "",
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
		expect(getDependencyRoleLabel("JUDGE_MODEL")).toBe("Judge model");
		expect(getDependencyRoleLabel("SUBAGENT")).toBe("Subagent");
		expect(getDependencyRoleLabel("SOMETHING_NEW")).toBe("SOMETHING_NEW");
		expect(
			Object.values(DEPENDENCY_ROLE_LABELS).every(
				(label) => label.length > 0,
			),
		).toBe(true);
	});
});
