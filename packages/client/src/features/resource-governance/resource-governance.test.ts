import { describe, expect, it } from "vitest";
import { getResourcePagePath } from "@/utility/catalog";
import { getGovernancePath } from "./governance-type-view";
import { findGovernanceType, GOVERNANCE_TYPES } from "./governance-types";
import { buildGovernancePixel } from "./use-governance-resources";

describe("Resource Governance types", () => {
	it("lists every project type, insights included, then every engine type", () => {
		expect(GOVERNANCE_TYPES.map((entry) => entry.type)).toEqual([
			"CODE",
			"BLOCKS",
			"INSIGHT",
			"WORKSPACE",
			"SKILL",
			"NOTEBOOK",
			"AUTOMATION",
			"DATABASE",
			"MODEL",
			"STORAGE",
			"FUNCTION",
			"VECTOR",
			"GUARDRAIL",
		]);
		expect(findGovernanceType("WORKSPACE")?.label).toBe("Agent");
		expect(findGovernanceType("MODEL")?.kind).toBe("ENGINE");
		expect(findGovernanceType("NOT_A_TYPE")).toBeUndefined();
	});
});

describe("buildGovernancePixel", () => {
	it("reads one project type through the admin projects list, by name", () => {
		const entry = findGovernanceType("INSIGHT");
		if (!entry) throw new Error("INSIGHT is listed");
		expect(buildGovernancePixel(entry, 'sales "q1"', "NAME", 25, 50)).toBe(
			'AdminMyProjects(filterWord=["sales \\"q1\\""], projectType=["INSIGHT"], sort=[{"PROJECTNAME" : "ASC"}], limit=[25], offset=[50]);',
		);
	});

	it("reads one engine type through the admin engines list, newest first", () => {
		const entry = findGovernanceType("MODEL");
		if (!entry) throw new Error("MODEL is listed");
		expect(buildGovernancePixel(entry, "", "NEWEST", 25, 0)).toBe(
			'AdminMyEngines(filterWord=[""], engineTypes=["MODEL"], sort=[{"DATECREATED" : "DESC"}], limit=[25], offset=[0]);',
		);
	});
});

describe("paths", () => {
	it("puts the type and the resource in the address", () => {
		expect(getGovernancePath("MODEL")).toBe("/settings/resources/MODEL");
		expect(getGovernancePath("MODEL", "a b")).toBe(
			"/settings/resources/MODEL/a%20b",
		);
	});

	it("opens a resource's own page, and a project of any type in the app pages", () => {
		expect(getResourcePagePath("ENGINE", "MODEL", "m1")).toBe("/model/m1");
		expect(getResourcePagePath("PROJECT", "WORKSPACE", "p1")).toBe(
			"/agent/p1",
		);
		expect(getResourcePagePath("PROJECT", "APP", "p2")).toBe("/app/p2");
		expect(getResourcePagePath("ENGINE", null, "e1")).toBeNull();
	});
});
