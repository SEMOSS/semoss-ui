import { describe, expect, it } from "vitest";
import type { CatalogType } from "@semoss/shared";
import { TYPE_TO_ROUTE } from "@/constants";
import { ALL_ENGINE_TYPES, ALL_PROJECT_TYPES } from "@/utility/catalog";
import {
	CATEGORY_META,
	DEPENDENCY_TYPE_CONFIG,
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
});
