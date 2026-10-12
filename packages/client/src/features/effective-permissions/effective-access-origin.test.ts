import { describe, expect, it } from "vitest";
import type { EffectivePermissionRow, PermissionSource } from "@semoss/sdk";
import {
	getAccessOrigin,
	matchesEffectiveSearch,
} from "./effective-access-origin";

const DIRECT: PermissionSource = {
	kind: "DIRECT",
	level: "READ_ONLY",
	endDate: null,
};
const SALES: PermissionSource = {
	kind: "TEAM",
	id: "Sales",
	type: "CUSTOM",
	level: "EDIT",
	endDate: null,
};

const row = (sources: PermissionSource[]): EffectivePermissionRow => ({
	subject: {
		kind: "USER",
		id: "ada",
		type: "NATIVE",
		name: "Ada Lovelace",
		email: "ada@example.com",
	},
	level: sources[0].level,
	sources,
});

describe("getAccessOrigin", () => {
	it("tells direct access, team access and both apart", () => {
		expect(getAccessOrigin(row([DIRECT]))).toBe("DIRECT");
		expect(getAccessOrigin(row([SALES]))).toBe("TEAMS");
		expect(getAccessOrigin(row([SALES, DIRECT]))).toBe("BOTH");
	});
});

describe("matchesEffectiveSearch", () => {
	it("matches the person and the teams their access comes through", () => {
		const both = row([SALES, DIRECT]);

		expect(matchesEffectiveSearch(both, "")).toBe(true);
		expect(matchesEffectiveSearch(both, "lovelace")).toBe(true);
		expect(matchesEffectiveSearch(both, "ada@")).toBe(true);
		expect(matchesEffectiveSearch(both, "sales")).toBe(true);
		expect(matchesEffectiveSearch(row([DIRECT]), "sales")).toBe(false);
	});
});
