import { describe, expect, it } from "vitest";
import {
	DEFAULT_GROUP_ACCESS_LEVEL,
	GROUP_ACCESS_LEVELS,
	getGroupAccessLevel,
} from "./group-access-levels";

describe("group access levels", () => {
	it("lists the levels from least to most access, starting at Read-Only", () => {
		expect(GROUP_ACCESS_LEVELS.map((level) => level.value)).toEqual([
			"READ_ONLY",
			"EDIT",
			"OWNER",
		]);
		expect(GROUP_ACCESS_LEVELS[0]).toBe(DEFAULT_GROUP_ACCESS_LEVEL);
	});

	it.each([
		[3, "READ_ONLY", "Read-Only"],
		["3", "READ_ONLY", "Read-Only"],
		[2, "EDIT", "Editor"],
		["2", "EDIT", "Editor"],
		[1, "OWNER", "Author"],
		["1", "OWNER", "Author"],
	])("reads permission %j as %s", (permission, value, label) => {
		expect(getGroupAccessLevel(permission)).toMatchObject({ value, label });
	});

	it.each([0, 4, "", " 3", "3.0", "EDIT", null, undefined])(
		"reads unknown permission %j as no level",
		(permission) => {
			expect(getGroupAccessLevel(permission)).toBeUndefined();
		},
	);
});
