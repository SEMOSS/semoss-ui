import { describe, expect, it } from "vitest";
import { getLevelLabel } from "@/features/bulk-access-management/permission-batch";
import {
	DEFAULT_GRANT_LEVEL,
	describeGrantLevels,
	GRANT_LEVELS,
	getTargetNoun,
	isGrantLevel,
	summarizeGrantLevel,
} from "./grant-levels";

describe("the levels an engine or a project gives", () => {
	it("are Read-Only and Editor, never Author, starting at Read-Only", () => {
		expect(GRANT_LEVELS.map(getLevelLabel)).toEqual([
			"Read-Only",
			"Editor",
		]);
		expect(DEFAULT_GRANT_LEVEL).toBe("READ_ONLY");
		expect(isGrantLevel("EDIT")).toBe(true);
		expect(isGrantLevel("READ_ONLY")).toBe(true);
		expect(isGrantLevel("OWNER")).toBe(false);
		expect(isGrantLevel("")).toBe(false);
	});

	it("say what each level allows on an engine and on a project", () => {
		expect(describeGrantLevels("ENGINE")).toContain(
			"Editor also lets them write to it",
		);
		expect(describeGrantLevels("PROJECT")).toContain("loading a skill");
		expect(summarizeGrantLevel("PROJECT", "READ_ONLY")).toBe(
			"Reads its files, insights and reactors",
		);
		expect(summarizeGrantLevel("ENGINE", "EDIT")).toBe(
			"Reads and writes it, and uses its connection",
		);
		expect(summarizeGrantLevel("ENGINE", "OWNER")).toBeNull();
	});
});

describe("getTargetNoun", () => {
	it("names the target by its kind and project type", () => {
		expect(getTargetNoun("ENGINE", "MODEL")).toBe("engine");
		expect(getTargetNoun("PROJECT", "SKILL")).toBe("skill");
		expect(getTargetNoun("PROJECT", "WORKSPACE")).toBe("agent");
		expect(getTargetNoun("PROJECT", "CODE")).toBe("app");
		expect(getTargetNoun("PROJECT", null)).toBe("project");
	});
});
